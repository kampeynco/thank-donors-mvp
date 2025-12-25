import { Donor } from "./types.ts";

export const BRANDING_NOTE = "Mailed by ThankDonors.com";

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function substituteVariables(template: string, donor: Donor, donationDate: string): string {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return template
        .replace(/%FIRST_NAME%/g, donor.firstname || 'Friend')
        .replace(/%LAST_NAME%/g, donor.lastname || '')
        .replace(/%FULL_NAME%/g, `${donor.firstname || 'Friend'} ${donor.lastname || ''}`.trim())
        .replace(/%AMOUNT%/g, donor.amount ? `$${donor.amount.toFixed(2)}` : '')
        .replace(/%EMAIL%/g, donor.email || '')
        .replace(/%ADDRESS1%/g, donor.addr1 || '')
        .replace(/%ADDRESS2%/g, donor.addr2 || '')
        .replace(/%CITY%/g, donor.city || '')
        .replace(/%STATE%/g, donor.state || '')
        .replace(/%ZIP%/g, donor.zip || '')
        .replace(/%DONATION_DAY%/g, donationDate)
        .replace(/%CURRENT_DAY%/g, currentDay);
}
