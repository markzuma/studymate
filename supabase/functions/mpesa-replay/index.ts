import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(data: Record<string, unknown>, status = 200) {
  return Response.json(data, { status, headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return reply({ error: "POST required" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const callbackToken = Deno.env.get("MPESA_CALLBACK_TOKEN");

  if (!url || !anonKey || !serviceKey ||
      !callbackToken || callbackToken.length < 32) {
    return reply({ error: "Recovery unavailable" }, 503);
  }

  const authorization =
    req.headers.get("authorization") ?? "";

  const jwt = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!jwt) {
    return reply({ error: "Authentication required" }, 401);
  }

  const caller = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: identity, error: identityError } =
    await caller.auth.getUser(jwt);

  if (identityError || !identity.user) {
    return reply({ error: "Invalid session" }, 401);
  }

  const { data: admin, error: adminError } =
    await caller.rpc("is_admin");

  if (adminError || admin !== true) {
    return reply({ error: "Administrator access required" }, 403);
  }

  const db = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid JSON" }, 400);
  }

  const checkoutId = String(
    body.checkout_request_id ?? ""
  );

  if (
    checkoutId.length < 10 ||
    checkoutId.length > 150 ||
    !/^[A-Za-z0-9_-]+$/.test(checkoutId)
  ) {
    return reply({ error: "Invalid checkout reference" }, 400);
  }

  const { data: payment, error: paymentError } =
    await db.from("payments")
      .select(
        "id,status,result_code,provider,payment_method,mpesa_receipt_number"
      )
      .eq("checkout_request_id", checkoutId)
      .maybeSingle();

  if (paymentError) {
    return reply({ error: "Payment lookup failed" }, 503);
  }

  if (!payment) {
    return reply({ error: "Payment not found" }, 404);
  }

  if (payment.provider !== "daraja" ||
      payment.payment_method !== "mpesa") {
    return reply({ error: "Not a Daraja payment" }, 409);
  }

  const { data: inbox, error: inboxError } =
    await db.from("mpesa_callback_inbox")
      .select("id,callback_payload,review_status")
      .eq("checkout_request_id", checkoutId)
      .maybeSingle();

  if (inboxError) {
    return reply({ error: "Inbox lookup failed" }, 503);
  }

  if (!inbox) {
    return reply({
      outcome: "missing_callback",
      message: "No saved callback exists for this transaction",
    }, 404);
  }

  if (payment.status === "completed") {
    return reply({
      outcome: "already_completed",
      message: "Payment is already completed",
    });
  }

  const eligible =
    payment.status === "pending" ||
    (
      payment.status === "failed" &&
      payment.result_code === "LOCAL_TIMEOUT"
    );

  if (!eligible) {
    return reply({
      outcome: "requires_review",
      message: "Payment is no longer eligible for callback replay",
    }, 409);
  }

  // One recovery attempt per payment every five minutes.
  const { data: claim, error: claimError } =
    await db.rpc("claim_mpesa_reconciliation", {
      p_payment_id: payment.id,
    });

  if (claimError) {
    return reply({ error: "Cooldown claim failed" }, 503);
  }

  if (!claim?.allowed) {
    return reply({
      outcome: claim?.reason ?? "cooldown",
      retry_after_seconds:
        claim?.retry_after_seconds ?? 300,
    }, claim?.reason === "cooldown" ? 429 : 409);
  }

  const attemptId = String(claim.attempt_id ?? "");

  let outcome = "unresolved";
  let callbackHttpStatus: number | null = null;

  try {
    const endpoint = new URL(
      "/functions/v1/mpesa-callback",
      url
    );

    endpoint.searchParams.set("token", callbackToken);

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inbox.callback_payload),
      signal: AbortSignal.timeout(25000),
    });

    callbackHttpStatus = response.status;

    if (!response.ok) {
      outcome = response.status === 429
        ? "rate_limited"
        : "request_error";
    }

    // Always re-read the database. A callback HTTP 200
    // is not proof of verified payment completion.
    const { data: updated, error: updatedError } =
      await db.from("payments")
        .select(
          "status,result_code,mpesa_receipt_number"
        )
        .eq("id", payment.id)
        .single();

    if (updatedError || !updated) {
      outcome = "request_error";
      return reply({
        outcome,
        message: "Payment state could not be checked",
      }, 503);
    }

    if (updated.status === "completed" &&
        updated.result_code === "0" &&
        updated.mpesa_receipt_number) {

      outcome = "provider_reports_success";

      const { error: markError } =
        await db.from("mpesa_callback_inbox")
          .update({
            review_status: "verified",
            processed_at: new Date().toISOString(),
          })
          .eq("id", inbox.id);

      if (markError) {
        return reply({
          outcome,
          message: "Payment completed but inbox update failed",
        }, 503);
      }

      return reply({
        outcome: "completed",
        message:
          "Existing callback processing completed the payment",
      });
    }

    if (updated.status === "failed" &&
        updated.mpesa_receipt_number) {

      outcome = "unresolved";

      await db.from("mpesa_callback_inbox")
        .update({ review_status: "requires_review" })
        .eq("id", inbox.id);

      return reply({
        outcome: "requires_review",
        message:
          "Late payment evidence requires manual investigation",
      });
    }

    return reply({
      outcome: "unresolved",
      callback_http_status: callbackHttpStatus,
      message:
        "Callback replay did not complete payment verification",
    });
  } catch {
    outcome = "request_error";

    return reply({
      outcome,
      message:
        "Recovery request failed; payment was not approved",
    }, 503);
  } finally {
    if (attemptId) {
      const { error: auditError } =
        await db.from("mpesa_reconciliation_attempts")
          .update({
            outcome,
            provider_http_status: null,
            provider_result_code: null,
          })
          .eq("id", attemptId);

      if (auditError) {
        console.error("Replay audit update failed", {
          code: auditError.code ?? "unknown",
        });
      }
    }
  }
});
