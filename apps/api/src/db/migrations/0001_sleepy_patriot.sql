CREATE TYPE "public"."class" AS ENUM('11', '12', '12+', 'Grad');--> statement-breakpoint
CREATE TYPE "public"."exam" AS ENUM('JEE', 'NEET', 'UPSC', 'BANK', 'SSC', 'GATE', 'CAT', 'NDA', 'CLAT', 'OTHER');--> statement-breakpoint
CREATE TABLE "batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" jsonb,
	"class" "class" NOT NULL,
	"exam" "exam" NOT NULL,
	"image_url" varchar(500),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"total_price" real NOT NULL,
	"discount_percentage" real DEFAULT 0 NOT NULL,
	"faq" jsonb,
	"teacher_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "batch_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_batch_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD CONSTRAINT "user_batch_mapping_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD CONSTRAINT "user_batch_mapping_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD CONSTRAINT "user_batch_mapping_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_slug_idx" ON "batch" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "batch_organization_idx" ON "batch" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "batch_exam_idx" ON "batch" USING btree ("exam");--> statement-breakpoint
CREATE INDEX "user_batch_idx" ON "user_batch_mapping" USING btree ("user_id","batch_id");--> statement-breakpoint
CREATE INDEX "user_org_batch_idx" ON "user_batch_mapping" USING btree ("user_id","organization_id");