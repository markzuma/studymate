-- Allow Safaricom Daraja as a payment provider
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_provider_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_provider_check
CHECK (provider IN ('pesapal', 'intasend', 'daraja'));

-- Store Safaricom transaction information
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS merchant_request_id TEXT,
ADD COLUMN IF NOT EXISTS checkout_request_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS result_code TEXT,
ADD COLUMN IF NOT EXISTS result_description TEXT,
ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT,
ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;

-- Make transaction lookups efficient
CREATE INDEX IF NOT EXISTS idx_payments_checkout_request
ON public.payments(checkout_request_id);
