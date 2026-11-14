
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

function ack(message: string) {
  return Response.json({ ResultCode: 0, ResultDesc: message });
}

function normalizePhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;

  return digits;
}

function kenyaTimestamp(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000)
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
}

function mpesaDate(value: unknown): string | null {
  const s = String(value ?? "");
  if (!/^\d{14}$/.test(s)) return null;

  const kenyaTime =
    `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` +
    `T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+03:00`;

  return new Date(kenyaTime).toISOString();
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return ack("Method not supported");
    }

    try {
      const payload = await req.json();
      const stk = payload?.Body?.stkCallback;

      if (!stk?.CheckoutRequestID) {
        return ack("Invalid callback");
      }

      const checkoutId = String(stk.CheckoutRequestID);
      const callbackCode = String(stk.ResultCode ?? "");

      const { data: payment, error: paymentError } =
        await ctx.supabaseAdmin
          .from("payments")
          .select(
            "id,status,result_code,subscription_id,expires_at,provider,payment_method,amount_kes,phone_number,merchant_request_id,checkout_request_id",
          )
          .eq("checkout_request_id", checkoutId)
          .maybeSingle();

      if (paymentError) throw paymentError;
      if (!payment) {
        return Response.json({ error: "Payment not found" }, { status: 500 });
      }

      if (payment.status === "completed") {
        return ack("Payment already processed");
      }

      const deadlinePassed =
        payment.status === "pending" &&
        payment.expires_at &&
        Date.parse(payment.expires_at) <= Date.now();

      const isLateTimeout =
        (payment.status === "failed" && payment.result_code === "LOCAL_TIMEOUT") ||
        Boolean(deadlinePassed);

      if (deadlinePassed) {
        const { error: timeoutError } = await ctx.supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            result_code: "LOCAL_TIMEOUT",
            result_description:
              "Payment attempt expired after 60 seconds without verification.",
          })
          .eq("id", payment.id)
          .eq("status", "pending");

        if (timeoutError) throw timeoutError;

        const { error: subscriptionError } = await ctx.supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", payment.subscription_id)
          .eq("status", "pending");

        if (subscriptionError) throw subscriptionError;
      }

      if (
        (payment.status !== "pending" && !isLateTimeout) ||
        payment.provider !== "daraja" ||
        payment.payment_method !== "mpesa"
      ) {
        return ack("Payment is not eligible for processing");
      }

      if (
        payment.merchant_request_id &&
        String(stk.MerchantRequestID ?? "") !== payment.merchant_request_id
      ) {
        return ack("Merchant request mismatch");
      }

      const key = Deno.env.get("MPESA_CONSUMER_KEY");
      const secret = Deno.env.get("MPESA_CONSUMER_SECRET");
      const shortcode = Deno.env.get("MPESA_SHORTCODE");
      const passkey = Deno.env.get("MPESA_PASSKEY");

      if (!key || !secret || !shortcode || !passkey) {
        throw new Error("Daraja credentials are not configured");
      }

      const auth = await fetch(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
          },
        },
      );

      if (!auth.ok) throw new Error("Daraja authentication failed");

      const authData = await auth.json();
      if (!authData.access_token) {
        throw new Error("Daraja access token missing");
      }

      const timestamp = kenyaTimestamp();
      const password = btoa(`${shortcode}${passkey}${timestamp}`);

      const query = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
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
            CheckoutRequestID: checkoutId,
          }),
        },
      );

      const queryData = await query.json();

      if (!query.ok || String(queryData.ResponseCode) !== "0") {
        console.warn("Daraja query not accepted", checkoutId);
        return ack("Awaiting Daraja verification");
      }

      if (String(queryData.CheckoutRequestID ?? "") !== checkoutId) {
        return ack("Daraja checkout reference mismatch");
      }

      if (
        payment.merchant_request_id &&
        String(queryData.MerchantRequestID ?? "") !==
          payment.merchant_request_id
      ) {
        return ack("Daraja merchant reference mismatch");
      }

      const verifiedCode = String(queryData.ResultCode ?? "");

      if (!verifiedCode) {
        return ack("Transaction verification is still pending");
      }

      if (callbackCode !== verifiedCode) {
        console.warn("Callback and query results disagree", checkoutId);
        return ack("Payment requires further verification");
      }

      if (verifiedCode !== "0") {
        const { error: failureError } = await ctx.supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            result_code: verifiedCode,
            result_description: String(
              queryData.ResultDesc ?? stk.ResultDesc ?? "Payment unsuccessful",
            ),
          })
          .eq("id", payment.id)
          .eq("status", "pending");

        if (failureError) throw failureError;
        return ack("Payment unsuccessful");
      }

      const items: Array<{ Name?: string; Value?: unknown }> =
        Array.isArray(stk.CallbackMetadata?.Item)
          ? stk.CallbackMetadata.Item
          : [];

      const getItem = (name: string) =>
        items.find((item) => item.Name === name)?.Value;

      const amount = Number(getItem("Amount"));
      const phone = normalizePhone(getItem("PhoneNumber"));
      const storedPhone = normalizePhone(payment.phone_number);
      const receipt = String(getItem("MpesaReceiptNumber") ?? "");

      if (
        !Number.isFinite(amount) ||
        amount !== payment.amount_kes ||
        !phone ||
        phone !== storedPhone ||
        !receipt
      ) {
        console.error("Payment details did not match", checkoutId);
        return ack("Payment details require manual review");
      }

      // Record verified late success without activating the cancelled subscription.
      if (isLateTimeout) {
        const { data: latePayment, error: latePaymentError } =
          await ctx.supabaseAdmin
            .from("payments")
            .update({
              result_code: "0",
              result_description:
                "Late M-Pesa success verified after PERIAK timeout. Refund/reconciliation required.",
              mpesa_receipt_number: receipt,
              transaction_date: mpesaDate(getItem("TransactionDate")),
            })
            .eq("id", payment.id)
            .eq("status", "failed")
            .eq("result_code", "LOCAL_TIMEOUT")
            .select("id")
            .maybeSingle();

        if (latePaymentError) throw latePaymentError;
        if (!latePayment) {
          return ack("Late payment already handled or status changed");
        }

        console.warn("Late M-Pesa success requires refund review", checkoutId, receipt);
        return ack("Late payment recorded for refund review");
      }

      const { data: completion, error: completionError } =
        await ctx.supabaseAdmin.rpc("complete_mpesa_payment", {
          p_payment_id: payment.id,
          p_receipt_number: receipt,
          p_result_description: String(
            queryData.ResultDesc ?? stk.ResultDesc ?? "Payment verified",
          ),
          p_transaction_date: mpesaDate(getItem("TransactionDate")),
        });

      if (completionError) {
        console.error("Atomic payment completion failed", completionError);
        return Response.json(
          { error: "Payment completion failed" },
          { status: 500 },
        );
      }

      console.log("M-Pesa payment completed", checkoutId, completion);

      return ack("Payment verified successfully");
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      return Response.json(
        { error: "Callback processing failed" },
        { status: 500 },
      );
    }
  }),
};
