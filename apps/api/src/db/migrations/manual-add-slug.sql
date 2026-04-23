-- Manual migration to add slug column to organization table
-- This should be run manually on the database before deploying the new code

-- Step 1: Add the slug column as nullable first
ALTER TABLE organization ADD COLUMN IF NOT EXISTS slug varchar(255);

-- Step 2: Update existing organizations with a default slug based on their name
-- This is a one-time update for existing data
UPDATE organization 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: Make the column NOT NULL and add unique constraint
ALTER TABLE organization ALTER COLUMN slug SET NOT NULL;
ALTER TABLE organization ADD CONSTRAINT organization_slug_unique UNIQUE(slug);
