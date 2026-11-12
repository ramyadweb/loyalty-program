CREATE TYPE "public"."redemption_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "user_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"points_spent" integer NOT NULL,
	"status" "redemption_status" DEFAULT 'pending' NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "points_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_rewards_user_id_idx" ON "user_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_rewards_reward_id_idx" ON "user_rewards" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "user_rewards_status_idx" ON "user_rewards" USING btree ("status");