CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."status";--> statement-breakpoint
ALTER TABLE "batches" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";