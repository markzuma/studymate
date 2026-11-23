import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Authorise through the caller-scoped Supabase client.
    const { data: isAdmin, error: adminError } =
      await ctx.supabase.rpc("is_admin");

    if (adminError || isAdmin !== true) {
      return json({ error: "Administrator access required" }, 403);
    }

    let paymentId: string;

    try {
      const body = await req.json();
      paymentId = String(body?.paymentId ?? "");

      if (!uuidPattern.test(paymentId)) {
        return json({ error: "Invalid payment ID" }, 400);
      }
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    // Admin privilege has been checked before service-role access.
    const { data: payment, error: paymentError } =
      await ctx.supabaseAdmin
        .from("payments")
        .select(
          "id,status,provider,payment_method," +
          "checkout_request_id,merchant_request_id," +
          "amount_kes,phone_number"
        )
        .eq("id", paymentId)
        .maybeSingle();

    if (paymentError) {
      return json({ error: "Payment lookup failed" }, 500);
    }

    // PERIAK RECONCILIATION PAYMENT TYPE V1
    // The helper client has no generated payments table type.
    // Explicitly describe the selected database fields.
    type ReconciliationPayment = {
      id: string;
      status: string;
      provider: string;
      payment_method: string;
      checkout_request_id: string | null;
      merchant_request_id: string | null;
      amount_kes: number;
      phone_number: string | null;
    };

    const typedPayment = payment as unknown as
      ReconciliationPayment | null;

    if (
      !typedPayment ||
      typedPayment.provider !== "daraja" ||
      typedPayment.payment_method !== "mpesa"
    ) {
      return json({ error: "M-Pesa payment not found" }, 404);
    }

    if (!typedPayment.checkout_request_id) {
      return json({
        outcome: "unresolved",
        message: "Payment has no Safaricom checkout reference.",
      });
    }

    const key = Deno.env.get("MPESA_CONSUMER_KEY");
    const secret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");

    if (!key || !secret || !shortcode || !passkey) {
      return json({
        error: "Daraja credentials are not configured",
      }, 503);
    }

    // PERIAK RECONCILIATION COOLDOWN V1
    // Claim atomically before contacting Safaricom.
    const { data: claimData, error: claimError } =
      await ctx.supabaseAdmin.rpc(
        "claim_mpesa_reconciliation",
        { p_payment_id: paymentId },
      );

    if (claimError) {
      console.error("Reconciliation claim failed", {
        code: claimError.code ?? "unknown",
      });
      return json({ error: "Reconciliation unavailable" }, 503);
    }

    const claim = claimData as unknown as {
      allowed?: boolean;
      reason?: string;
      retry_after_seconds?: number;
      attempt_id?: string;
    } | null;

    if (!claim?.allowed) {
      if (claim?.reason === "cooldown") {
        return json({
          outcome: "rate_limited",
          message: "Please allow the reconciliation cooldown to finish.",
          retry_after_seconds: claim.retry_after_seconds ?? 300,
        }, 429);
      }

      return json({
        error: "Payment is not eligible for reconciliation",
      }, 404);
    }

    if (!claim.attempt_id) {
      return json({ error: "Invalid reconciliation claim" }, 503);
    }

    let attemptOutcome = "unresolved";
    let providerHttpStatus: number | null = null;
    let providerResultCode: string | null = null;

    // Sandbox only. Production requires separate onboarding
    // and an explicit environment configuration review.
    const baseUrl = "https://sandbox.safaricom.co.ke";

    try {
      const authResponse = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
          },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!authResponse.ok) {
        attemptOutcome = "request_error";
        providerHttpStatus = authResponse.status;
        return json({
          outcome: "unresolved",
          message: "Safaricom authentication was unsuccessful.",
        }, 502);
      }

      const authData = await authResponse.json();

      if (!authData.access_token) {
        return json({
          outcome: "unresolved",
          message: "Safaricom access token unavailable.",
        }, 502);
      }

      const timestamp = new Date(
        Date.now() + 3 * 60 * 60 * 1000
      ).toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

      const password =
        btoa(`${shortcode}${passkey}${timestamp}`);

      const response = await fetch(
        `${baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: typedPayment.checkout_request_id,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      providerHttpStatus = response.status;

      if (!response.ok) {
        attemptOutcome =
          response.status === 429 ? "rate_limited" : "request_error";

        return json({
          outcome: "unresolved",
          message: "Safaricom status query was unavailable.",
          provider_http_status: response.status,
        }, 502);
      }

      const result = await response.json();

      if (String(result.ResponseCode ?? "") !== "0") {
        attemptOutcome = "unresolved";
        providerResultCode = String(result.ResponseCode ?? "");
        return json({
          outcome: "unresolved",
          message: "Safaricom did not accept the status query.",
        });
      }

      // Some query responses may omit these fields.
      // If supplied, they must match the stored references.
      if (
        result.CheckoutRequestID &&
        String(result.CheckoutRequestID) !==
          typedPayment.checkout_request_id
      ) {
        attemptOutcome = "reference_mismatch";
        return json({
          outcome: "reference_mismatch",
          message: "Safaricom checkout reference mismatch.",
        }, 409);
      }

      if (
        typedPayment.merchant_request_id &&
        result.MerchantRequestID &&
        String(result.MerchantRequestID) !==
          typedPayment.merchant_request_id
      ) {
        attemptOutcome = "reference_mismatch";
        return json({
          outcome: "reference_mismatch",
          message: "Safaricom merchant reference mismatch.",
        }, 409);
      }

      const resultCode = result.ResultCode;

      if (resultCode === undefined || resultCode === null) {
        return json({
          outcome: "unresolved",
          message: "Safaricom has not supplied a final result.",
        });
      }

      const code = String(resultCode);

      providerResultCode = code;

      if (code === "0") {
        // PERIAK SUCCESS EVIDENCE REVIEW V1
        attemptOutcome = "provider_reports_success";

        // A successful result must have BOTH matching
        // Safaricom references before callback inspection.
        const referencesMatch =
          typeof result.CheckoutRequestID === "string" &&
          result.CheckoutRequestID ===
            typedPayment.checkout_request_id &&
          typeof result.MerchantRequestID === "string" &&
          Boolean(typedPayment.merchant_request_id) &&
          result.MerchantRequestID ===
            typedPayment.merchant_request_id;

        if (!referencesMatch) {
          attemptOutcome = "reference_mismatch";

          return json({
            outcome: "reference_mismatch",
            evidence_status: "provider_references_missing_or_mismatched",
            message:
              "Successful provider result lacks matching transaction " +
              "references. Administrator review required.",
          }, 409);
        }

        const { data: inbox, error: inboxError } =
          await ctx.supabaseAdmin
            .from("mpesa_callback_inbox")
            .select("callback_payload")
            .eq(
              "checkout_request_id",
              typedPayment.checkout_request_id,
            )
            .maybeSingle();

        if (inboxError) {
          return json({
            outcome: "provider_reports_success",
            evidence_status: "inbox_lookup_failed",
            message:
              "Provider reports success, but callback evidence " +
              "could not be retrieved. No activation performed.",
          }, 503);
        }

        if (!inbox) {
          return json({
            outcome: "provider_reports_success",
            evidence_status: "missing_callback",
            message:
              "Provider reports success, but no saved callback " +
              "exists. Independent payment review required.",
          });
        }

        type CallbackItem = {
          Name?: string;
          Value?: unknown;
        };

        type SavedCallback = {
          Body?: {
            stkCallback?: {
              CheckoutRequestID?: string;
              MerchantRequestID?: string;
              ResultCode?: number | string;
              CallbackMetadata?: {
                Item?: CallbackItem[];
              };
            };
          };
        };

        const stored = (
          inbox as unknown as {
            callback_payload: SavedCallback;
          }
        ).callback_payload;

        const callback = stored?.Body?.stkCallback;
        const items = callback?.CallbackMetadata?.Item;

        const metadata = Array.isArray(items) ? items : [];

        const getItem = (name: string): unknown =>
          metadata.find(item => item.Name === name)?.Value;

        const normalizePhone = (value: unknown): string => {
          const digits = String(value ?? "").replace(/\D/g, "");

          if (digits.startsWith("254") && digits.length === 12) {
            return digits;
          }

          if (digits.startsWith("0") && digits.length === 10) {
            return "254" + digits.slice(1);
          }

          if (/^[17]\d{8}$/.test(digits)) {
            return "254" + digits;
          }

          return digits;
        };

        const receipt = String(
          getItem("MpesaReceiptNumber") ?? ""
        ).trim();

        const amountValue = getItem("Amount");
        const amount = Number(amountValue);

        const savedPhone = normalizePhone(
          getItem("PhoneNumber")
        );

        const expectedPhone = normalizePhone(
          typedPayment.phone_number
        );

        const fieldsMatch =
          callback?.CheckoutRequestID ===
            typedPayment.checkout_request_id &&
          callback?.MerchantRequestID ===
            typedPayment.merchant_request_id &&
          String(callback?.ResultCode ?? "") === "0" &&
          receipt.length > 0 &&
          amountValue !== undefined &&
          amountValue !== null &&
          Number.isFinite(amount) &&
          amount === Number(typedPayment.amount_kes) &&
          expectedPhone.length === 12 &&
          savedPhone === expectedPhone;

        if (!fieldsMatch) {
          return json({
            outcome: "provider_reports_success",
            evidence_status: "conflicting_or_incomplete_callback",
            message:
              "Provider reports success, but saved callback details " +
              "are incomplete or conflicting. Manual review required.",
          });
        }

        // Matching callback fields are useful evidence,
        // NOT independent settlement confirmation.
        // Never activate Premium from this review alone.
        return json({
          outcome: "provider_reports_success",
          evidence_status: "callback_fields_match_unverified",
          stored_status: typedPayment.status,
          message:
            "Provider reports success and saved callback fields " +
            "match. Independent transaction verification is still " +
            "required before Premium activation.",
        });
      }

      // PERIAK VERIFIED FAILURE RECOVERY V1
      attemptOutcome = "provider_reports_unsuccessful";

      // Do not automatically cancel if the provider omitted
      // either transaction reference or the payment is no
      // longer pending.
      const referencesVerified =
        typeof result.CheckoutRequestID === "string" &&
        result.CheckoutRequestID ===
          typedPayment.checkout_request_id &&
        typeof result.MerchantRequestID === "string" &&
        Boolean(typedPayment.merchant_request_id) &&
        result.MerchantRequestID ===
          typedPayment.merchant_request_id;

      let failureResolved = false;

      if (referencesVerified &&
          typedPayment.status === "pending") {
        // Persist verified evidence before invoking the
        // atomic database resolution function.
        const { error: evidenceError } =
          await ctx.supabaseAdmin
            .from("mpesa_reconciliation_attempts")
            .update({
              outcome: attemptOutcome,
              provider_http_status: providerHttpStatus,
              provider_result_code: code,
            })
            .eq("id", claim.attempt_id);

        if (!evidenceError) {
          const { data: resolution, error: resolutionError } =
            await ctx.supabaseAdmin.rpc(
              "resolve_verified_mpesa_failure",
              { p_payment_id: paymentId },
            );

          if (resolutionError) {
            console.warn("Verified failure resolution deferred", {
              code: resolutionError.code ?? "unknown",
            });
          } else {
            const resultData = resolution as unknown as {
              success?: boolean;
            } | null;

            failureResolved = resultData?.success === true;
          }
        } else {
          console.error("Failure evidence could not be saved", {
            code: evidenceError.code ?? "unknown",
          });
        }
      }

      return json({
        outcome: "provider_reports_unsuccessful",
        provider_result_code: code,
        failure_resolved: failureResolved,
        message: failureResolved
          ? "Verified unsuccessful transaction closed safely."
          : "Safaricom reports an unsuccessful transaction. " +
            "Payment remains unchanged pending further review.",
      });

    } catch {
      attemptOutcome = "request_error";

      return json({
        outcome: "unresolved",
        message:
          "Safaricom could not be reached or its response " +
          "could not be processed. No records were changed.",
      }, 502);
    } finally {
      // Persist the result, even when Safaricom is unavailable.
      // Never change payment or subscription status here.
      const { error: auditError } = await ctx.supabaseAdmin
        .from("mpesa_reconciliation_attempts")
        .update({
          outcome: attemptOutcome,
          provider_http_status: providerHttpStatus,
          provider_result_code: providerResultCode,
        })
        .eq("id", claim.attempt_id);

      if (auditError) {
        console.error("Reconciliation audit update failed", {
          code: auditError.code ?? "unknown",
        });
      }
    }
  }),
};
