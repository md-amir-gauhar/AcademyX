CREATE TYPE "public"."schedule_status" AS ENUM('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city" varchar(255),
	"state" varchar(255),
	"pincode" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "address_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"subject_name" varchar(255) NOT NULL,
	"youtube_link" varchar(500) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" "schedule_status" DEFAULT 'SCHEDULED' NOT NULL,
	"teacher_id" uuid,
	"thumbnail_url" varchar(500),
	"notify_before_minutes" integer DEFAULT 30,
	"tags" jsonb,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"content_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_series" RENAME COLUMN "is_active" TO "is_published";--> statement-breakpoint
ALTER TABLE "test_series" ADD COLUMN "is_purchased" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "test_series" ADD COLUMN "status" "status" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_img" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedules_organization_idx" ON "schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "schedules_topic_idx" ON "schedules" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "schedules_batch_idx" ON "schedules" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "schedules_subject_idx" ON "schedules" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "schedules_scheduled_at_idx" ON "schedules" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "schedules_status_idx" ON "schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "schedules_teacher_idx" ON "schedules" USING btree ("teacher_id");