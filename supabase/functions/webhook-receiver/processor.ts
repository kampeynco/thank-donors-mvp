import { sendPostcardViaLob } from "./lob.ts";
import { Donor } from "./types.ts";



export async function processLineItem(
    item: any,
    donor: any,
    actBlueId: string,
    donationDate: string,
    isTestMode: boolean,
    supabase: any,
    eventId?: string
): Promise<{ success: boolean; error?: string }> {
    const entityId = item.entityId || item.entity_id;
    const amount = parseFloat(item.amount || "0");
    console.log(`🔍 Checking line item. Entity ID: ${entityId}, Amount: ${amount}`);

    // 1. Fetch the Entity and its linked Account
    const { data: entity, error: entityError } = await supabase
        .from("actblue_entities")
        .select(`
      entity_id,
      committee_name,
      tier,
      balance_cents,
      stripe_customer_id,
      front_image_url,
      back_message,
      disclaimer,
      street_address,
      city,
      state,
      postal_code,
      branding_enabled,
      actblue_accounts(
        id,
        profile_id
      )
    `)
        .eq("entity_id", entityId)
        .single();

    if (entityError || !entity) {
        console.warn(`⚠️ Entity ID ${entityId} not found or query error: ${entityError?.message}. Skipping.`);
        return { success: false, error: `Entity not found: ${entityId}` };
    }

    const account = entity.actblue_accounts?.[0];
    if (!account) {
        console.warn(`⚠️ No linked profile found for Entity ID ${entityId}. Skipping.`);
        return { success: false, error: 'No linked profile' };
    }

    console.log(`✅ Resolved entity: ${entity.committee_name} and profile: ${account.profile_id}`);

    // 1b. Update Webhook Event with Profile ID (if eventId is provided)
    if (eventId) {
        // Fire and forget update
        supabase
            .from('webhook_events')
            .update({ profile_id: account.profile_id })
            .eq('id', eventId)
            .then(({ error }: any) => {
                if (error) console.error("❌ Failed to link webhook event to profile:", error);
                else console.log(`🔗 Linked webhook event ${eventId} to profile ${account.profile_id}`);
            });
    }

    // 2. Determine pricing
    const TIER_CONFIG = {
        'pay_as_you_go': { per_postcard: 199, included_cards: 0 },
        'pro_starter': { per_postcard: 99, included_cards: 125 },
        'pro_grow': { per_postcard: 89, included_cards: 250 },
        'pro_scale': { per_postcard: 79, included_cards: 500 },
        'agency_starter': { per_postcard: 89, included_cards: 500 },
        'agency_grow': { per_postcard: 79, included_cards: 1000 },
        'agency_scale': { per_postcard: 74, included_cards: 2500 }
    } as const;

    const tier = (entity.tier || 'pay_as_you_go') as keyof typeof TIER_CONFIG;
    const config = TIER_CONFIG[tier] || TIER_CONFIG['pay_as_you_go'];

    // 2a. Check Usage for Overage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: usageCount, error: usageError } = await supabase
        .from('postcards')
        .select('id, donations!inner(actblue_accounts!inner(entity_id))', { count: 'exact', head: true })
        .eq('donations.actblue_accounts.entity_id', entityId)
        .gte('created_at', startOfMonth);

    if (usageError) {
        console.error("❌ Error counting usage:", usageError);
        // Fallback to safe overage pricing if we can't verify usage? Or lenient?
        // Let's be lenient for now to avoid blocking sends on system error, but log it.
    }

    const currentUsage = usageCount || 0;
    const isOverLimit = currentUsage >= config.included_cards;
    const priceCents = isOverLimit ? 199 : config.per_postcard;

    console.log(`📊 Usage Check: Tier=${tier}, Limit=${config.included_cards}, Used=${currentUsage}, Price=${priceCents}c ${isOverLimit ? '(OVERAGE)' : ''}`);

    // 3. Atomic balance deduction
    const { data: updatedEntity, error: deductError } = await supabase
        .from('actblue_entities')
        .update({ balance_cents: entity.balance_cents - priceCents })
        .eq('entity_id', entityId)
        .gte('balance_cents', priceCents)
        .select('balance_cents')
        .single();

    if (deductError || !updatedEntity) {
        console.warn(`❌ Entity ${entityId} has insufficient balance or concurrent update. Current: ${entity.balance_cents}c, Need: ${priceCents}c.`);
        return { success: false, error: 'Insufficient balance' };
    }

    console.log(`💰 Deducted ${priceCents}c from entity ${entityId}. New balance: ${updatedEntity.balance_cents}c`);

    // 4. Record transaction
    await supabase.from('billing_transactions').insert({
        entity_id: entityId,
        profile_id: account.profile_id,
        amount_cents: -priceCents,
        type: 'postcard_deduction',
        description: `Postcard for donor: ${donor.firstname} ${donor.lastname}`
    });

    // 5. Create normalized donor object
    const normalizedDonor: Donor = {
        firstname: donor.firstname || donor.firstName || 'Friend',
        lastname: donor.lastname || donor.lastName || '',
        email: donor.email || '',
        addr1: donor.addr1 || donor.address_line1 || donor.addressLine1 || '',
        addr2: donor.addr2 || donor.address_line2 || donor.addressLine2 || '',
        city: donor.city || '',
        state: donor.state || '',
        zip: donor.zip || donor.postalCode || donor.postal_code || '',
        amount: amount
    };

    // 6. Insert Donation Record
    const donationUid = `${actBlueId}_${entityId}`;
    console.log(`💾 Saving donation record ${donationUid} to database...`);

    const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
            profile_id: account.profile_id,
            actblue_account_id: account.id,
            actblue_donation_id: donationUid,
            amount: amount,
            donor_firstname: normalizedDonor.firstname,
            donor_lastname: normalizedDonor.lastname,
            donor_email: normalizedDonor.email,
            donor_addr1: normalizedDonor.addr1,
            donor_city: normalizedDonor.city,
            donor_state: normalizedDonor.state,
            donor_zip: normalizedDonor.zip
        })
        .select()
        .single();

    if (donationError) {
        if (donationError.code === '23505') {
            console.log(`ℹ️ Duplicate donation item received (${donationUid}). Refunding balance.`);
            await supabase.rpc('increment_entity_balance', {
                p_amount: priceCents
            });
            await supabase.from('billing_transactions').insert({
                entity_id: entityId,
                profile_id: account.profile_id,
                amount_cents: priceCents,
                type: 'refund',
                description: `Refund: Duplicate donation`
            });
            return { success: false, error: 'Duplicate donation' };
        }

        console.error("❌ Error inserting donation:", JSON.stringify(donationError));
        await supabase.rpc('increment_entity_balance', {
            p_amount: priceCents
        });
        await supabase.from('billing_transactions').insert({
            entity_id: entityId,
            profile_id: account.profile_id,
            amount_cents: priceCents,
            type: 'refund',
            description: `Refund: System error`
        });
        return { success: false, error: donationError.message };
    }

    // 7. Send Postcard via Lob.com API
    const lobResult = await sendPostcardViaLob(normalizedDonor, entity, donationDate, isTestMode, {});

    // 8. If Lob failed, refund the balance
    if (!lobResult.success) {
        console.warn(`⚠️ Lob API failed. Refunding ${priceCents}c to entity ${entityId}`);
        await supabase.rpc('increment_entity_balance', {
            p_amount: priceCents
        });
        await supabase.from('billing_transactions').insert({
            entity_id: entityId,
            profile_id: account.profile_id,
            amount_cents: priceCents,
            type: 'refund',
            description: `Refund: Mailing service error`
        });
    }

    // 9. Create Postcard Record
    console.log(`📝 Recording postcard status: ${lobResult.success ? 'processed' : 'failed'}`);
    const postcardStatus = lobResult.success ? 'processed' : 'failed';

    const { data: postcardData, error: postcardError } = await supabase
        .from('postcards')
        .insert({
            donation_id: donation.id,
            profile_id: account.profile_id,
            status: postcardStatus,
            front_image_url: entity.front_image_url,
            back_message: entity.back_message,
            lob_postcard_id: lobResult.lobId || null,
            lob_url: lobResult.url || null,
            error_message: lobResult.error || null
        })
        .select()
        .single();

    if (postcardError) {
        console.error("❌ Error creating postcard record:", JSON.stringify(postcardError));
    } else if (postcardData) {
        await supabase.from('postcard_events').insert({
            postcard_id: postcardData.id,
            status: postcardStatus,
            details: lobResult.success
                ? 'Postcard successfully sent to Lob.com'
                : `Failed to send to Lob.com: ${lobResult.error}`
        });
    }

    return { success: lobResult.success };
}
