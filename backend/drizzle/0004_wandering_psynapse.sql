CREATE TYPE "public"."redemption_code_status" AS ENUM('generated', 'completed', 'expired');--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_reward_id" integer NOT NULL,
	"redemption_code" varchar(100) NOT NULL,
	"status" "redemption_code_status" DEFAULT 'generated' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reward_redemptions_redemption_code_unique" UNIQUE("redemption_code")
);
--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_reward_id_user_rewards_id_fk" FOREIGN KEY ("user_reward_id") REFERENCES "public"."user_rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reward_redemptions_user_reward_id_idx" ON "reward_redemptions" USING btree ("user_reward_id");--> statement-breakpoint
CREATE INDEX "reward_redemptions_redemption_code_idx" ON "reward_redemptions" USING btree ("redemption_code");--> statement-breakpoint
CREATE INDEX "reward_redemptions_status_idx" ON "reward_redemptions" USING btree ("status");