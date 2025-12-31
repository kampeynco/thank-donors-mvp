import { Donor, Entity, PostcardOverrides, LobResponse } from "./types.ts";
import { substituteVariables } from "./utils.ts";
import { generatePostcardFrontHtml, generatePostcardBackHtml } from "./html-templates.ts";

export function validateAddress(donor: Donor): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!donor.addr1) missing.push('address_line1');
    if (!donor.city) missing.push('city');
    if (!donor.state) missing.push('state');
    if (!donor.zip) missing.push('zip');
    return { valid: missing.length === 0, missing };
}

export async function sendPostcardViaLob(
    normalizedDonor: Donor,
    entity: Entity,
    donationDate: string,
    isTestMode: boolean,
    overrides: PostcardOverrides = {}
): Promise<LobResponse> {
    const LOB_API_KEY = isTestMode
        ? Deno.env.get("LOB_TEST_API_KEY")
        : Deno.env.get("LOB_LIVE_API_KEY");

    if (!LOB_API_KEY) {
        console.error("❌ Lob API key not found in environment variables");
        return { success: false, error: "Lob API key not configured" };
    }

    console.log(`📡 Preparing Lob request for ${normalizedDonor.firstname} ${normalizedDonor.lastname} (Mode: ${isTestMode ? 'TEST' : 'LIVE'})`);

    const addressValidation = validateAddress(normalizedDonor);
    if (!addressValidation.valid) {
        console.error(`❌ Incomplete address. Missing: ${addressValidation.missing.join(', ')}`);
        return {
            success: false,
            error: `Incomplete address. Missing: ${addressValidation.missing.join(', ')}`
        };
    }

    const frontImage = overrides.front_image_url || entity.front_image_url;
    const rawBackMessage = overrides.back_message || entity.back_message;

    if (!frontImage) {
        console.error("❌ Missing front image URL. Cannot send postcard.");
        return { success: false, error: "Missing front image design" };
    }

    if (!rawBackMessage) {
        console.error("❌ Missing back message. Cannot send postcard.");
        return { success: false, error: "Missing back message design" };
    }

    const backMessage = substituteVariables(rawBackMessage, normalizedDonor, donationDate);
    const showBranding = entity.tier === 'free' || (entity.tier === 'pro' && entity.branding_enabled !== false);

    const lobPayload = {
        description: `Thank you postcard for ${normalizedDonor.firstname} ${normalizedDonor.lastname}`,
        to: {
            name: `${normalizedDonor.firstname} ${normalizedDonor.lastname}`.trim() || "Donor",
            address_line1: normalizedDonor.addr1,
            address_line2: normalizedDonor.addr2 || undefined,
            address_city: normalizedDonor.city,
            address_state: normalizedDonor.state,
            address_zip: normalizedDonor.zip,
        },
        from: {
            name: entity.committee_name || "Campaign",
            address_line1: entity.street_address || "PO Box 123", // Keep address fallback for now as it's less critical than design? detailed.
            address_city: entity.city || "City",
            address_state: entity.state || "ST",
            address_zip: entity.postal_code || "12345",
        },
        front: generatePostcardFrontHtml(
            frontImage,
            overrides.disclaimer || entity.disclaimer,
            showBranding
        ),
        back: generatePostcardBackHtml(backMessage, showBranding),
        size: "4x6",
        mail_type: "usps_first_class",
    };

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        try {
            console.log(`🚀 Lob API Call (Attempt ${attempt})...`);
            const response = await fetch("https://api.lob.com/v1/postcards", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${btoa(LOB_API_KEY + ":")}`,
                    "Content-Type": "application/json",
                    "Lob-Version": "2020-02-11",
                },
                body: JSON.stringify(lobPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 408) {
                    console.error(`❌ Lob API Client Error (${response.status}):`, JSON.stringify(result));
                    return {
                        success: false,
                        error: result.error?.message || `Lob API returned ${response.status}`
                    };
                }

                if (attempt <= MAX_RETRIES) {
                    throw new Error(`Lob API Error ${response.status}: ${result.error?.message || 'Unknown error'}`);
                } else {
                    console.error("❌ Lob API Error (Final Attempt):", JSON.stringify(result));
                    return {
                        success: false,
                        error: result.error?.message || `Lob API returned ${response.status} after ${attempt} attempts`
                    };
                }
            }

            console.log(`✅ Postcard created successfully! Lob ID: ${result.id}`);
            return {
                success: true,
                lobId: result.id,
                url: result.url,
                lobStatus: result.status
            };

        } catch (error: any) {
            console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
            if (attempt <= MAX_RETRIES) {
                const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            } else {
                return { success: false, error: `Failed after ${MAX_RETRIES} retries: ${error.message}` };
            }
        }
    }

    return { success: false, error: "Unexpected loop termination" };
}
