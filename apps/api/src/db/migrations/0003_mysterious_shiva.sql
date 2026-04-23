CREATE TABLE "teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"highlights" jsonb,
	"image_url" varchar(500),
	"subjects" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" DROP CONSTRAINT "batches_teacher_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teachers_organization_idx" ON "teachers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "teachers_batch_idx" ON "teachers" USING btree ("batch_id");--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "teacher_id";