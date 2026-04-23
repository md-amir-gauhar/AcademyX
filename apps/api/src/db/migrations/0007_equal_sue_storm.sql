CREATE TYPE "public"."difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('BATCH', 'TEST_SERIES');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('RAZORPAY', 'STRIPE', 'PAYPAL', 'FREE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'NUMERICAL');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'RAZORPAY' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"provider_order_id" varchar(255),
	"provider_payment_id" varchar(255),
	"provider_signature" varchar(500),
	"receipt_id" varchar(255),
	"transaction_data" jsonb,
	"failure_reason" text,
	"refund_id" varchar(255),
	"refund_amount" real,
	"refunded_at" timestamp,
	"initiated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_id" uuid,
	"text_answer" text,
	"is_correct" boolean,
	"marks_awarded" real DEFAULT 0,
	"time_spent_seconds" integer DEFAULT 0,
	"is_marked_for_review" boolean DEFAULT false,
	"is_skipped" boolean DEFAULT false,
	"answered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"time_spent_seconds" integer DEFAULT 0,
	"total_score" real DEFAULT 0,
	"percentage" real DEFAULT 0,
	"correct_count" integer DEFAULT 0,
	"wrong_count" integer DEFAULT 0,
	"skipped_count" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_passed" boolean,
	"rank" integer,
	"percentile" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"text" text NOT NULL,
	"image_url" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"text" text NOT NULL,
	"image_url" varchar(500),
	"type" "question_type" DEFAULT 'MCQ' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'MEDIUM' NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"negative_marks" real DEFAULT 0,
	"explanation" text,
	"explanation_image_url" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"total_marks" integer DEFAULT 0,
	"question_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"exam" "exam" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" jsonb,
	"slug" varchar(255) NOT NULL,
	"image_url" varchar(500),
	"total_price" real DEFAULT 0 NOT NULL,
	"discount_percentage" real DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"duration_days" integer DEFAULT 365,
	"test_count" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_series_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_series_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" jsonb,
	"slug" varchar(255) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"passing_marks" integer DEFAULT 40,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"show_answers_after_submit" boolean DEFAULT true NOT NULL,
	"allow_review" boolean DEFAULT true NOT NULL,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"section_count" integer DEFAULT 0,
	"question_count" integer DEFAULT 0,
	"attempt_count" integer DEFAULT 0,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_test_series_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_series_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"original_price" real NOT NULL,
	"discount_amount" real DEFAULT 0,
	"final_price" real NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_id" uuid,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "original_price" real NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "discount_amount" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "final_price" real NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "start_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt_answers" ADD CONSTRAINT "test_attempt_answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt_answers" ADD CONSTRAINT "test_attempt_answers_question_id_test_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt_answers" ADD CONSTRAINT "test_attempt_answers_selected_option_id_test_question_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."test_question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_question_options" ADD CONSTRAINT "test_question_options_question_id_test_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_section_id_test_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."test_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_series" ADD CONSTRAINT "test_series_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_test_series_id_test_series_id_fk" FOREIGN KEY ("test_series_id") REFERENCES "public"."test_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_test_series_enrollment" ADD CONSTRAINT "user_test_series_enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_test_series_enrollment" ADD CONSTRAINT "user_test_series_enrollment_test_series_id_test_series_id_fk" FOREIGN KEY ("test_series_id") REFERENCES "public"."test_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_test_series_enrollment" ADD CONSTRAINT "user_test_series_enrollment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_test_series_enrollment" ADD CONSTRAINT "user_test_series_enrollment_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_entity_idx" ON "orders" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_provider_order_idx" ON "orders" USING btree ("provider_order_id");--> statement-breakpoint
CREATE INDEX "test_attempt_answers_attempt_idx" ON "test_attempt_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "test_attempt_answers_question_idx" ON "test_attempt_answers" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_attempt_question" ON "test_attempt_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "test_attempts_user_idx" ON "test_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_attempts_test_idx" ON "test_attempts" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_attempts_user_test_idx" ON "test_attempts" USING btree ("user_id","test_id");--> statement-breakpoint
CREATE INDEX "test_question_options_question_idx" ON "test_question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "test_questions_section_idx" ON "test_questions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "test_questions_org_idx" ON "test_questions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_questions_order_idx" ON "test_questions" USING btree ("section_id","display_order");--> statement-breakpoint
CREATE INDEX "test_sections_test_idx" ON "test_sections" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_sections_order_idx" ON "test_sections" USING btree ("test_id","display_order");--> statement-breakpoint
CREATE INDEX "test_series_slug_idx" ON "test_series" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "test_series_org_idx" ON "test_series" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_series_exam_idx" ON "test_series" USING btree ("exam");--> statement-breakpoint
CREATE INDEX "tests_slug_idx" ON "tests" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tests_series_idx" ON "tests" USING btree ("test_series_id");--> statement-breakpoint
CREATE INDEX "tests_org_idx" ON "tests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_test_series_user_idx" ON "user_test_series_enrollment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_test_series_series_idx" ON "user_test_series_enrollment" USING btree ("test_series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_test_series" ON "user_test_series_enrollment" USING btree ("user_id","test_series_id");--> statement-breakpoint
ALTER TABLE "user_batch_mapping" ADD CONSTRAINT "user_batch_mapping_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_batch" ON "user_batch_mapping" USING btree ("user_id","batch_id");--> statement-breakpoint
ALTER TABLE "user_batch_mapping" DROP COLUMN "purchased_at";