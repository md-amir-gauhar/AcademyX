
-- Rename batch table to batches and add status column
ALTER TABLE "batch" RENAME TO "batches";--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" DROP CONSTRAINT "batch_slug_unique";--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "batches" DROP CONSTRAINT "batch_organization_id_organization_id_fk";--> statement-breakpoint
ALTER TABLE "batches" DROP CONSTRAINT "batch_teacher_id_user_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "batch_slug_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "batch_organization_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "batch_exam_idx";--> statement-breakpoint
ALTER TABLE "user_batch_mapping" DROP CONSTRAINT "user_batch_mapping_batch_id_batch_id_fk";
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batches_slug_idx" ON "batches" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "batches_organization_idx" ON "batches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "batches_exam_idx" ON "batches" USING btree ("exam");--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD CONSTRAINT "user_batch_mapping_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;