-- Seed Test Accounts for lenox@kampeyn.com
-- Updated to include dummy webhook data to satisfy NOT NULL constraints

DO $$
DECLARE
    target_user_id UUID;
    v_entity_id BIGINT;
    v_name TEXT;
    v_dummy_url TEXT := 'https://example.com/dummy-webhook';
    v_dummy_user TEXT := 'dummy_user';
    v_dummy_pass TEXT := 'dummy_pass';
    v_dummy_source TEXT := 'dummy_source_id';
BEGIN
    -- 1. Find the User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'lenox@kampeyn.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User lenox@kampeyn.com not found. Skipping seed.';
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding accounts for user: %', target_user_id;

    -- Entity 157973: AB charities
    v_entity_id := 157973;
    v_name := 'AB charities for CA';
    
    -- Insert Entity with dummy webhook data
    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    -- Insert Account with dummy webhook data
    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);


    -- Entity 157975: Forever recurring
    v_entity_id := 157975;
    v_name := 'Forever recurring for CA';

    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);


    -- Entity 157971: Self employed
    v_entity_id := 157971;
    v_name := 'Self employed for CA';

    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);


    -- Entity 157977: Monthly recurring
    v_entity_id := 157977;
    v_name := 'Monthly recurring for CA';

    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);


    -- Entity 157979: Weekly recurring
    v_entity_id := 157979;
    v_name := 'Weekly recurring for CA';

    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);


    -- Entity 157981: Paypal
    v_entity_id := 157981;
    v_name := 'Paypal for CA';

    INSERT INTO actblue_entities (entity_id, committee_name, tier, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (v_entity_id, v_name, 'free', v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source)
    ON CONFLICT (entity_id) DO UPDATE SET 
        committee_name = v_name,
        webhook_url = EXCLUDED.webhook_url, 
        webhook_username = EXCLUDED.webhook_username,
        webhook_password = EXCLUDED.webhook_password,
        webhook_source_id = EXCLUDED.webhook_source_id;

    INSERT INTO actblue_accounts (profile_id, entity_id, committee_name, webhook_url, webhook_username, webhook_password, webhook_source_id)
    VALUES (target_user_id, v_entity_id, v_name, v_dummy_url, v_dummy_user, v_dummy_pass, v_dummy_source);

    RAISE NOTICE 'Seeding complete.';

END $$;
