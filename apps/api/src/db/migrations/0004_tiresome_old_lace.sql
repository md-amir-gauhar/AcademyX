CREATE TABLE "batch_teacher_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_batch_id_batches_id_fk";
--> statement-breakpoint
DROP INDEX "teachers_batch_idx";--> statement-breakpoint
ALTER TABLE "batch_teacher_mapping" ADD CONSTRAINT "batch_teacher_mapping_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_teacher_mapping" ADD CONSTRAINT "batch_teacher_mapping_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_teacher_mapping" ADD CONSTRAINT "batch_teacher_mapping_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_teacher_batch_idx" ON "batch_teacher_mapping" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "batch_teacher_teacher_idx" ON "batch_teacher_mapping" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "batch_teacher_org_idx" ON "batch_teacher_mapping" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "teachers" DROP COLUMN "batch_id";