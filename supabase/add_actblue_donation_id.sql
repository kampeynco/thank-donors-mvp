-- Add actblue_donation_id column to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_donation_id text;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donations_actblue_donation_id ON donations(actblue_donation_id);
