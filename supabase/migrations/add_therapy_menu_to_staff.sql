-- Add is_active_therapy_menu and certificate_url to Staff table
ALTER TABLE "Staff"
ADD COLUMN IF NOT EXISTS "is_active_therapy_menu" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "certificate_url" text;
