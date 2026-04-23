-- Create status enum
CREATE TYPE "status" AS ENUM('ACTIVE', 'INACTIVE');

-- Add temporary column
ALTER TABLE "batches" ADD COLUMN "status_new" "status";

-- Migrate data: true -> ACTIVE, false -> INACTIVE  
UPDATE "batches" SET "status_new" = CASE 
  WHEN "status" = true THEN 'ACTIVE'::"status"
  ELSE 'INACTIVE'::"status"
END;

-- Set default for new column
ALTER TABLE "batches" ALTER COLUMN "status_new" SET DEFAULT 'ACTIVE'::"status";
ALTER TABLE "batches" ALTER COLUMN "status_new" SET NOT NULL;

-- Drop old column
ALTER TABLE "batches" DROP COLUMN "status";

-- Rename new column to status
ALTER TABLE "batches" RENAME COLUMN "status_new" TO "status";
