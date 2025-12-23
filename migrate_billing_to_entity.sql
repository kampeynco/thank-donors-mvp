-- 1. Add billing columns to actblue_entities
ALTER TABLE actblue_entities 
ADD COLUMN IF NOT EXISTS balance_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_topup_amount_cents INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS topup_threshold_cents INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Add entity_id to billing_transactions
ALTER TABLE billing_transactions 
ADD COLUMN IF NOT EXISTS entity_id INTEGER REFERENCES actblue_entities(entity_id);

-- 3. Data Migration
-- We migrate the billing info from the FIRST profile associated with an entity.
-- Usually, the person who connected the account is the one who topped it up.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT ON (entity_id) 
            a.entity_id, 
            p.balance_cents, 
            p.tier, 
            p.stripe_customer_id,
            p.auto_topup_enabled,
            p.auto_topup_amount_cents
        FROM actblue_accounts a
        JOIN profiles p ON a.profile_id = p.id
        ORDER BY a.entity_id, a.created_at ASC
    ) LOOP
        UPDATE actblue_entities 
        SET balance_cents = r.balance_cents,
            tier = r.tier,
            stripe_customer_id = r.stripe_customer_id,
            auto_topup_enabled = r.auto_topup_enabled,
            auto_topup_amount_cents = r.auto_topup_amount_cents
        WHERE entity_id = r.entity_id;

        -- Update existing transactions to link to the entity
        UPDATE billing_transactions bt
        SET entity_id = r.entity_id
        FROM actblue_accounts aa
        WHERE bt.profile_id = aa.profile_id AND aa.entity_id = r.entity_id;
    END LOOP;
END $$;

-- 4. Cleanup (Optional: keep columns in profiles for now to avoid breaking existing users mid-migration, but we should eventually drop them)
-- COMMENTED OUT TO PREVENT DATA LOSS UNTIL FULLY VERIFIED
-- ALTER TABLE profiles DROP COLUMN balance_cents;
-- ALTER TABLE profiles DROP COLUMN tier;
-- ALTER TABLE profiles DROP COLUMN auto_topup_enabled;
-- ALTER TABLE profiles DROP COLUMN auto_topup_amount_cents;
-- ALTER TABLE profiles DROP COLUMN stripe_customer_id;
