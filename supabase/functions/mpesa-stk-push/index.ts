import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;

  return null;
}

function kenyaTimestamp(): string {
  const kenyaTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return kenyaTime.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const studentId = ctx.userClaims?.id;

    if (!studentId) {
      return json({ error: "Authentication required" }, 401);
    }

    let subscriptionId: string | null = null;
    let paymentId: string | null = null;
    let stkRequestStarted = false;

    try {
      const body = await req.json();
      const planId = String(body.planId ?? "");
      const phone = normalizePhone(body.phoneNumber);

      if (!planId || !phone) {
        return json({
          error: "Please provide a valid Premium plan and Kenyan phone number.",
        }, 400);
      }

      // Always retrieve the price from the database.
      const { data: plan, error: planError } =
        await ctx.supabaseAdmin
          .from("subscription_plans")
          .select("id, name, price_kes, duration_days, is_active")
          .eq("id", planId)
          .eq("is_active", true)
          .maybeSingle();

      if (planError) throw planError;

      if (
        !plan ||
        !Number.isInteger(plan.price_kes) ||
        plan.price_kes <= 0 ||
        !Number.isInteger(plan.duration_days) ||
        plan.duration_days <= 0
      ) {
        return json({ error: "This Premium plan is unavailable." }, 404);
      }

      // Create a pending subscription.
      const { data: subscription, error: subscriptionError } =
        await ctx.supabaseAdmin
          .from("subscriptions")
          .insert({
            student_id: studentId,
            plan_id: plan.id,
            status: "pending",
          })
          .select("id")
          .single();

      if (subscriptionError) throw subscriptionError;
      subscriptionId = subscription.id;

      // Create its pending M-Pesa payment.
      const { data: payment, error: paymentError } =
        await ctx.supabaseAdmin
          .from("payments")
          .insert({
            student_id: studentId,
            subscription_id: subscription.id,
            provider: "daraja",
            payment_method: "mpesa",
            amount_kes: plan.price_kes,
            phone_number: phone,
            status: "pending",
          })
          .select("id")
          .single();

      if (paymentError) {
        await ctx.supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscription.id)
          .eq("status", "pending");

        throw paymentError;
      }

      paymentId = payment.id;

      const key = Deno.env.get("MPESA_CONSUMER_KEY");
      const secret = Deno.env.get("MPESA_CONSUMER_SECRET");
      const shortcode = Deno.env.get("MPESA_SHORTCODE");
      const passkey = Deno.env.get("MPESA_PASSKEY");

      if (!key || !secret || !shortcode || !passkey) {
        throw new Error("Daraja credentials are not configured");
      }

      const authResponse = await fetch(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
          },
        },
      );

      if (!authResponse.ok) {
        throw new Error("Daraja authentication failed");
      }

      const authData = await authResponse.json();

      if (!authData.access_token) {
        throw new Error("Daraja access token missing");
      }

      const timestamp = kenyaTimestamp();
      const password = btoa(`${shortcode}${passkey}${timestamp}`);
      const callbackUrl =
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

      stkRequestStarted = true;
      const stkResponse = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
            TransactionType: "CustomerPayBillOnline",
            Amount: plan.price_kes,
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: callbackUrl,
            AccountReference: "PERIAK",
            TransactionDesc: `PERIAK ${plan.name}`,
          }),
        },
      );

      const stkData = await stkResponse.json();

      // Only a definite Daraja rejection should fail the payment.
      if (
        stkData.ResponseCode !== undefined &&
        String(stkData.ResponseCode) !== "0"
      ) {
        console.error("Daraja explicitly rejected STK request", stkData);

        const { error: paymentUpdateError } = await ctx.supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            result_code: String(stkData.ResponseCode),
            result_description: String(
              stkData.ResponseDescription ?? "Daraja rejected the STK request",
            ),
          })
          .eq("id", payment.id)
          .eq("status", "pending");

        if (paymentUpdateError) {
          console.error("Could not record Daraja rejection", paymentUpdateError);
          return json({
            success: true,
            pending: true,
            message: "M-Pesa rejected the request, but PERIAK could not update its payment record. Do not retry; contact support.",
          });
        }

        const { error: subscriptionUpdateError } = await ctx.supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscription.id)
          .eq("status", "pending");

        if (subscriptionUpdateError) {
          console.error("Could not cancel rejected subscription", subscriptionUpdateError);
          return json({
            success: true,
            pending: true,
            message: "M-Pesa rejected the request, but PERIAK needs to review the subscription record. Do not retry; contact support.",
          });
        }

        return json({
          error: "M-Pesa rejected the payment request. Please try again.",
        }, 502);
      }

      // An unclear response may mean Safaricom received the request.
      // Preserve pending status to prevent accidental duplicate payments.
      if (
        !stkResponse.ok ||
        !stkData.CheckoutRequestID ||
        !stkData.MerchantRequestID
      ) {
        console.error("Daraja STK response is incomplete or uncertain", stkData);

        if (stkData.CheckoutRequestID) {
          const { error: referenceError } = await ctx.supabaseAdmin
            .from("payments")
            .update({
              checkout_request_id: String(stkData.CheckoutRequestID),
              provider_reference: String(stkData.CheckoutRequestID),
            })
            .eq("id", payment.id)
            .eq("status", "pending");

          if (referenceError) {
            console.error("Could not save partial Daraja reference", referenceError);
          }
        }

        return json({
          success: true,
          pending: true,
          message: "Safaricom's response was unclear. Your payment request may still be processing. Do not retry. Contact PERIAK support before making another payment.",
        });
      }

      const { error: saveError } = await ctx.supabaseAdmin
        .from("payments")
        .update({
          merchant_request_id: String(stkData.MerchantRequestID),
          checkout_request_id: String(stkData.CheckoutRequestID),
          provider_reference: String(stkData.CheckoutRequestID),
        })
        .eq("id", payment.id)
        .eq("status", "pending");

      if (saveError) {
        console.error("Could not save Daraja checkout reference", saveError);
        return json({
          error: "Payment was initiated but its reference could not be saved. Please contact support before retrying.",
        }, 500);
      }

      return json({
        success: true,
        message: "STK Push sent. Check your phone and enter your M-Pesa PIN.",
        checkoutRequestId: String(stkData.CheckoutRequestID),
      });
    } catch (error) {
      console.error("M-Pesa STK Push error:", error);

      if (stkRequestStarted) {
        return json({
          success: true,
          pending: true,
          message: "The M-Pesa request may have reached Safaricom, but its response could not be confirmed. Do not retry. Contact PERIAK support before attempting another payment.",
        });
      }

      if (paymentId) {
        const { error: cleanupPaymentError } = await ctx.supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            result_code: "STK_NOT_SUBMITTED",
            result_description: "STK request was not submitted",
          })
          .eq("id", paymentId)
          .eq("status", "pending");

        if (cleanupPaymentError) {
          console.error("Payment cleanup failed", cleanupPaymentError);
        }
      }

      if (subscriptionId) {
        const { error: cleanupSubscriptionError } = await ctx.supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscriptionId)
          .eq("status", "pending");

        if (cleanupSubscriptionError) {
          console.error("Subscription cleanup failed", cleanupSubscriptionError);
        }
      }

      return json({
        error: "Unable to start payment. Please try again later.",
      }, 500);
    }
  }),
};
