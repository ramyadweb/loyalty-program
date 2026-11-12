CREATE TYPE "public"."reward_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"points_required" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text,
	"status" "reward_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
