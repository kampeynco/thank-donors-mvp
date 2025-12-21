ALTER TABLE postcards ADD COLUMN IF NOT EXISTS thanksio_order_id TEXT;
ALTER TABLE postcards ADD COLUMN IF NOT EXISTS error_message TEXT;
