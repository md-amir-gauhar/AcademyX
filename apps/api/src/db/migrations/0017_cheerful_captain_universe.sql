ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_phone_number_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "user_org_email_unique" ON "user" USING btree ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_org_phone_unique" ON "user" USING btree ("organization_id","phone_number");