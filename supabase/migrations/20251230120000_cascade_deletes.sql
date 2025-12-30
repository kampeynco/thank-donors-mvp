-- Migration: Enable cascading deletes for donations
-- Description: Ensures that deleting a donation cascades to postcards, postcard_events, billing_transactions, and webhook_events.

-- 1. Postcards (donations -> postcards)
-- We assume the constraint name is postcards_donation_id_fkey. If not, this might fail or duplicate.
-- Safer approach: Drop by known columns matches if possible, but standard is by name.
ALTER TABLE postcards
DROP CONSTRAINT IF EXISTS postcards_donation_id_fkey;

ALTER TABLE postcards
ADD CONSTRAINT postcards_donation_id_fkey
FOREIGN KEY (donation_id)
REFERENCES donations(id)
ON DELETE CASCADE;

-- 2. Postcard Events (postcards -> postcard_events)
-- Transitive cascade: deleting donation deletes postcard, which deletes postcard_events
ALTER TABLE postcard_events
DROP CONSTRAINT IF EXISTS postcard_events_postcard_id_fkey;

ALTER TABLE postcard_events
ADD CONSTRAINT postcard_events_postcard_id_fkey
FOREIGN KEY (postcard_id)
REFERENCES postcards(id)
ON DELETE CASCADE;

-- 3. Billing Transactions (donations -> billing_transactions)
-- Only apply if donation_id exists in billing_transactions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_transactions' AND column_name = 'donation_id') THEN
        ALTER TABLE billing_transactions
        DROP CONSTRAINT IF EXISTS billing_transactions_donation_id_fkey;

        ALTER TABLE billing_transactions
        ADD CONSTRAINT billing_transactions_donation_id_fkey
        FOREIGN KEY (donation_id)
        REFERENCES donations(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Webhook Events (donations -> webhook_events)
-- Only apply if donation_id exists in webhook_events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_events' AND column_name = 'donation_id') THEN
        ALTER TABLE webhook_events
        DROP CONSTRAINT IF EXISTS webhook_events_donation_id_fkey;

        ALTER TABLE webhook_events
        ADD CONSTRAINT webhook_events_donation_id_fkey
        FOREIGN KEY (donation_id)
        REFERENCES donations(id)
        ON DELETE CASCADE;
    END IF;
END $$;
