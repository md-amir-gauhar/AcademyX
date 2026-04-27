CREATE TYPE "public"."media_job_status" AS ENUM('PENDING', 'PROCESSING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TABLE "media_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "media_job_status" DEFAULT 'PENDING' NOT NULL,
	"source_key" varchar(500) NOT NULL,
	"source_content_type" varchar(100),
	"output_prefix" varchar(500),
	"hls_url" varchar(500),
	"duration_seconds" real,
	"width" integer,
	"height" integer,
	"size_bytes" bigint,
	"progress" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "youtube_link" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "media_job_id" uuid;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "hls_url" varchar(500);--> statement-breakpoint
ALTER TABLE "media_jobs" ADD CONSTRAINT "media_jobs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_jobs" ADD CONSTRAINT "media_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_jobs_org_idx" ON "media_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_jobs_status_idx" ON "media_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_jobs_user_idx" ON "media_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "schedules_media_job_idx" ON "schedules" USING btree ("media_job_id");