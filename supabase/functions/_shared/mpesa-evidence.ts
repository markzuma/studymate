export type MpesaPayment = {
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  amount_kes: number;
  phone_number: string | null;
};

type MetadataItem = { Name?: unknown; Value?: unknown };
type ProviderReply = Record<string, unknown>;
type StkCallback = Record<string, unknown> & {
  CallbackMetadata?: { Item?: MetadataItem[] };
};

export function normalizeMpesaPhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export function validateMpesaSuccess(
  payment: MpesaPayment,
  callback: StkCallback,
  query: ProviderReply,
): { ok: true; receipt: string } | { ok: false; reason: string } {
  const fail = (reason: string) => ({ ok: false as const, reason });

  if (!payment.checkout_request_id || !payment.merchant_request_id) {
    return fail("missing_stored_reference");
  }
  if (
    String(query.ResponseCode ?? "") !== "0" ||
    String(query.ResultCode ?? "") !== "0" ||
    String(callback.ResultCode ?? "") !== "0"
  ) return fail("not_confirmed_success");

  for (const source of [callback, query]) {
    if (
      source.CheckoutRequestID !== payment.checkout_request_id ||
      source.MerchantRequestID !== payment.merchant_request_id
    ) return fail("reference_mismatch_or_missing");
  }

  const items = callback.CallbackMetadata?.Item;
  if (!Array.isArray(items)) return fail("missing_metadata");
  const getUnique = (name: string): unknown => {
    const matches = items.filter((item) => item?.Name === name);
    return matches.length === 1 ? matches[0].Value : undefined;
  };

  const rawAmount = getUnique("Amount");
  const amount = Number(rawAmount);
  if (
    rawAmount == null || String(rawAmount).trim() === "" ||
    !Number.isInteger(payment.amount_kes) || payment.amount_kes <= 0 ||
    !Number.isFinite(amount) || amount !== payment.amount_kes
  ) return fail("amount_invalid_or_mismatch");

  const expected = normalizeMpesaPhone(payment.phone_number);
  const actual = normalizeMpesaPhone(getUnique("PhoneNumber"));
  if (!expected || !actual || expected !== actual) {
    return fail("phone_invalid_or_mismatch");
  }

  const rawReceipt = getUnique("MpesaReceiptNumber");
  const receipt = typeof rawReceipt === "string" ? rawReceipt.trim() : "";
  if (!/^[A-Za-z0-9]{6,32}$/.test(receipt)) {
    return fail("receipt_invalid_or_missing");
  }
  return { ok: true, receipt };
}
