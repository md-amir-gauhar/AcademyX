-- Add slug column as nullable first to handle existing data
ALTER TABLE "organization" ADD COLUMN "slug" varchar(255);--> statement-breakpoint

-- Update existing organizations with a slug based on their name (if any exist)
UPDATE "organization" 
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" IS NULL;--> statement-breakpoint

-- Make slug NOT NULL and add unique constraint
ALTER TABLE "organization" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_slug_unique" UNIQUE("slug");