CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."points_activity" AS ENUM('REGISTRATION', 'FEEDBACK', 'ADMIN_BONUS', 'REDEMPTION', 'REVERSAL');--> statement-breakpoint
ALTER TYPE "public"."audit_activity_type" ADD VALUE 'POINTS_AWARDED';--> statement-breakpoint
ALTER TYPE "public"."audit_activity_type" ADD VALUE 'FEEDBACK_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."audit_activity_type" ADD VALUE 'FEEDBACK_REJECTED';--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"activity" "points_activity" NOT NULL,
	"description" text NOT NULL,
	"reference_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedbacks_user_id_idx" ON "feedbacks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedbacks_status_idx" ON "feedbacks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedbacks_created_at_idx" ON "feedbacks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "points_transactions_user_id_idx" ON "points_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "points_transactions_activity_idx" ON "points_transactions" USING btree ("activity");--> statement-breakpoint
CREATE INDEX "points_transactions_created_at_idx" ON "points_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "points_tx_registration_unique" ON "points_transactions" USING btree ("user_id","activity") WHERE "points_transactions"."activity" = 'REGISTRATION';--> statement-breakpoint
CREATE UNIQUE INDEX "points_tx_feedback_unique" ON "points_transactions" USING btree ("activity","reference_id") WHERE "points_transactions"."activity" = 'FEEDBACK' AND "points_transactions"."reference_id" IS NOT NULL;