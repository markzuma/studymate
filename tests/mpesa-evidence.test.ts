import {
  validateMpesaSuccess,
  type MpesaPayment,
} from "../supabase/functions/_shared/mpesa-evidence.ts";

type Item = { Name: string; Value: unknown };
const payment: MpesaPayment = {
  checkout_request_id: "ws_CO_SANDBOX_TEST",
  merchant_request_id: "merchant-test",
  amount_kes: 20,
  phone_number: "0708374149",
};
const query: Record<string, unknown> = {
  ResponseCode: "0", ResultCode: "0",
  CheckoutRequestID: "ws_CO_SANDBOX_TEST",
  MerchantRequestID: "merchant-test",
};
const callback = {
  ResultCode: 0,
  CheckoutRequestID: "ws_CO_SANDBOX_TEST",
  MerchantRequestID: "merchant-test",
  CallbackMetadata: { Item: [
    { Name: "Amount", Value: 20 },
    { Name: "PhoneNumber", Value: 254708374149 },
    { Name: "MpesaReceiptNumber", Value: "AB12345678" },
  ] as Item[] },
};
const meta = (name: string, value: unknown) => ({
  ...callback,
  CallbackMetadata: { Item: callback.CallbackMetadata.Item.map(
    (item) => item.Name === name ? { ...item, Value: value } : item
  ) },
});
const cases: Array<[string, boolean]> = [
  ["valid provider + callback evidence", validateMpesaSuccess(payment, callback, query).ok],
  ["mismatched amount blocked", !validateMpesaSuccess(payment, meta("Amount", 21), query).ok],
  ["zero amount blocked", !validateMpesaSuccess(payment, meta("Amount", 0), query).ok],
  ["missing amount blocked", !validateMpesaSuccess(payment, meta("Amount", null), query).ok],
  ["wrong phone blocked", !validateMpesaSuccess(payment, meta("PhoneNumber", 254700000000), query).ok],
  ["missing receipt blocked", !validateMpesaSuccess(payment, meta("MpesaReceiptNumber", ""), query).ok],
  ["non-string receipt blocked", !validateMpesaSuccess(payment, meta("MpesaReceiptNumber", 123456789), query).ok],
  ["callback failure blocked", !validateMpesaSuccess(payment, { ...callback, ResultCode: 1037 }, query).ok],
  ["provider failure blocked", !validateMpesaSuccess(payment, callback, { ...query, ResultCode: "1037" }).ok],
  ["provider query rejection blocked", !validateMpesaSuccess(payment, callback, { ...query, ResponseCode: "1" }).ok],
  ["missing provider merchant ref blocked", !validateMpesaSuccess(payment, callback, { ...query, MerchantRequestID: undefined }).ok],
  ["wrong provider checkout ref blocked", !validateMpesaSuccess(payment, callback, { ...query, CheckoutRequestID: "wrong" }).ok],
  ["wrong callback merchant ref blocked", !validateMpesaSuccess(payment, { ...callback, MerchantRequestID: "wrong" }, query).ok],
  ["missing stored merchant ref blocked", !validateMpesaSuccess({ ...payment, merchant_request_id: null }, callback, query).ok],
  ["duplicate receipt metadata blocked", !validateMpesaSuccess(payment, { ...callback, CallbackMetadata: { Item: [...callback.CallbackMetadata.Item, { Name: "MpesaReceiptNumber", Value: "AB12345678" }] } }, query).ok],
  ["Kenyan 01 numbers accepted", validateMpesaSuccess({ ...payment, phone_number: "0101234567" }, meta("PhoneNumber", 254101234567), query).ok],
];
for (const [name, expected] of cases) {
  Deno.test(name, () => {
    if (!expected) throw new Error(`Evidence policy failed: ${name}`);
  });
}
