CREATE TABLE "user_content_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"total_duration" integer NOT NULL,
	"watch_percentage" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"watch_count" integer DEFAULT 1 NOT NULL,
	"last_watched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_content_progress_user_last_watched_idx" ON "user_content_progress" USING btree ("user_id","last_watched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_content_progress_user_content_idx" ON "user_content_progress" USING btree ("user_id","content_id");--> statement-breakpoint
CREATE INDEX "user_content_progress_batch_idx" ON "user_content_progress" USING btree ("user_id","batch_id");--> statement-breakpoint
CREATE INDEX "user_content_progress_completed_idx" ON "user_content_progress" USING btree ("user_id","is_completed");