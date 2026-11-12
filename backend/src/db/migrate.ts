import { pool } from "../config/db.js";

async function migrate() {
  try {
    console.log("Syncing database schema...");

    // 1. Add 'blocked' to user_status enum if not present
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'user_status' AND e.enumlabel = 'blocked'
        ) THEN
          ALTER TYPE "user_status" ADD VALUE 'blocked';
        END IF;
      END
      $$;
    `);

    // 2. Create password_resets table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "otp_hash" text NOT NULL,
        "reset_token" varchar(255),
        "is_verified" boolean DEFAULT false NOT NULL,
        "attempts" integer DEFAULT 0 NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 3. Create ticket_priority enum if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
          CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high');
        END IF;
      END
      $$;
    `);

    // 4. Create ticket_status enum if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
          CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
        END IF;
      END
      $$;
    `);

    // 5. Create tickets table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "category" varchar(100) NOT NULL,
        "priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
        "status" "ticket_status" DEFAULT 'open' NOT NULL,
        "assigned_to" integer REFERENCES "users"("id") ON DELETE SET NULL,
        "admin_response" text,
        "resolved_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "tickets_user_id_idx" ON "tickets" ("user_id");
      CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" ("status");
    `);

    // 6. Create reward_status enum & rewards table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_status') THEN
          CREATE TYPE "reward_status" AS ENUM ('active', 'inactive');
        END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS "rewards" (
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
    `);

    // 7. Create redemption_status enum, user_rewards table & add points_balance
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemption_status') THEN
          CREATE TYPE "redemption_status" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END
      $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'points_balance'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "points_balance" integer DEFAULT 0 NOT NULL;
        END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS "user_rewards" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "reward_id" integer NOT NULL REFERENCES "rewards"("id") ON DELETE RESTRICT,
        "points_spent" integer NOT NULL,
        "status" "redemption_status" DEFAULT 'pending' NOT NULL,
        "redeemed_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "user_rewards_user_id_idx" ON "user_rewards" ("user_id");
      CREATE INDEX IF NOT EXISTS "user_rewards_reward_id_idx" ON "user_rewards" ("reward_id");
      CREATE INDEX IF NOT EXISTS "user_rewards_status_idx" ON "user_rewards" ("status");
    `);

    // 8. Create redemption_code_status enum & reward_redemptions table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemption_code_status') THEN
          CREATE TYPE "redemption_code_status" AS ENUM ('generated', 'completed', 'expired');
        END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS "reward_redemptions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_reward_id" integer NOT NULL REFERENCES "user_rewards"("id") ON DELETE CASCADE,
        "redemption_code" varchar(50) NOT NULL UNIQUE,
        "status" "redemption_code_status" DEFAULT 'generated' NOT NULL,
        "generated_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "reward_redemptions_user_reward_id_idx" ON "reward_redemptions" ("user_reward_id");
      CREATE INDEX IF NOT EXISTS "reward_redemptions_redemption_code_idx" ON "reward_redemptions" ("redemption_code");
      CREATE INDEX IF NOT EXISTS "reward_redemptions_status_idx" ON "reward_redemptions" ("status");
    `);

    // 9. Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "type" varchar(100) NOT NULL,
        "is_read" boolean DEFAULT false NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
      CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");
    `);

    // 10. Update audit_activity_type enum with new activities
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'audit_activity_type' AND e.enumlabel = 'POINTS_AWARDED'
        ) THEN
          ALTER TYPE "audit_activity_type" ADD VALUE 'POINTS_AWARDED';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'audit_activity_type' AND e.enumlabel = 'FEEDBACK_APPROVED'
        ) THEN
          ALTER TYPE "audit_activity_type" ADD VALUE 'FEEDBACK_APPROVED';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'audit_activity_type' AND e.enumlabel = 'FEEDBACK_REJECTED'
        ) THEN
          ALTER TYPE "audit_activity_type" ADD VALUE 'FEEDBACK_REJECTED';
        END IF;
      END
      $$;
    `);

    // 11. Create points_activity enum and feedback_status enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'points_activity') THEN
          CREATE TYPE "points_activity" AS ENUM ('REGISTRATION', 'FEEDBACK', 'ADMIN_BONUS', 'REDEMPTION', 'REVERSAL');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
          CREATE TYPE "feedback_status" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END
      $$;
    `);

    // 12. Create points_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "points_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "points" integer NOT NULL,
        "activity" "points_activity" NOT NULL,
        "description" text NOT NULL,
        "reference_id" integer,
        "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "points_transactions_user_id_idx" ON "points_transactions" ("user_id");
      CREATE INDEX IF NOT EXISTS "points_transactions_activity_idx" ON "points_transactions" ("activity");
      CREATE INDEX IF NOT EXISTS "points_transactions_created_at_idx" ON "points_transactions" ("created_at");

      CREATE UNIQUE INDEX IF NOT EXISTS "points_tx_registration_unique" 
      ON "points_transactions" ("user_id", "activity") 
      WHERE "activity" = 'REGISTRATION';

      CREATE UNIQUE INDEX IF NOT EXISTS "points_tx_feedback_unique" 
      ON "points_transactions" ("activity", "reference_id") 
      WHERE "activity" = 'FEEDBACK' AND "reference_id" IS NOT NULL;
    `);

    // 13. Create feedbacks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "feedbacks" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "status" "feedback_status" DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "feedbacks_user_id_idx" ON "feedbacks" ("user_id");
      CREATE INDEX IF NOT EXISTS "feedbacks_status_idx" ON "feedbacks" ("status");
      CREATE INDEX IF NOT EXISTS "feedbacks_created_at_idx" ON "feedbacks" ("created_at");
    `);

    // 14. Data backfill / consistency: ensure approved users have registration bonus recorded
    await pool.query(`
      DO $$
      BEGIN
        -- Backfill registration bonus for existing approved users without a registration transaction
        INSERT INTO "points_transactions" ("user_id", "points", "activity", "description", "created_at")
        SELECT u.id, 100, 'REGISTRATION'::points_activity, 'Registration welcome bonus', u.created_at
        FROM "users" u
        WHERE u.status = 'approved'
          AND NOT EXISTS (
            SELECT 1 FROM "points_transactions" pt 
            WHERE pt.user_id = u.id AND pt.activity = 'REGISTRATION'
          );

        -- Backfill redemption transactions for existing user_rewards without a transaction
        INSERT INTO "points_transactions" ("user_id", "points", "activity", "description", "reference_id", "created_at")
        SELECT ur.user_id, ur.points_spent, 'REDEMPTION'::points_activity, 'Reward redemption claim #' || ur.id, ur.id, ur.redeemed_at
        FROM "user_rewards" ur
        WHERE NOT EXISTS (
          SELECT 1 FROM "points_transactions" pt 
          WHERE pt.user_id = ur.user_id AND pt.activity = 'REDEMPTION' AND pt.reference_id = ur.id
        );
      END
      $$;
    `);

    // 15. Add ticket activities to points_activity enum (must be committed before creating indexes)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'points_activity' AND e.enumlabel = 'TICKET_CREATED'
        ) THEN
          ALTER TYPE "points_activity" ADD VALUE 'TICKET_CREATED';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'points_activity' AND e.enumlabel = 'TICKET_OPENED'
        ) THEN
          ALTER TYPE "points_activity" ADD VALUE 'TICKET_OPENED';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
          WHERE t.typname = 'points_activity' AND e.enumlabel = 'TICKET_RESOLVED'
        ) THEN
          ALTER TYPE "points_activity" ADD VALUE 'TICKET_RESOLVED';
        END IF;
      END
      $$;
    `);

    // 16. Add ticket tracking columns and idempotency indexes
    await pool.query(`
      -- Add columns to tickets table to track opened status if not already present
      ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "opened_at" timestamp;
      ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "opened_by" integer REFERENCES "users"("id") ON DELETE SET NULL;

      -- Unique partial indexes to prevent duplicate ticket points at the database level
      CREATE UNIQUE INDEX IF NOT EXISTS "points_tx_ticket_created_unique" 
      ON "points_transactions" ("activity", "reference_id") 
      WHERE "activity" = 'TICKET_CREATED' AND "reference_id" IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS "points_tx_ticket_opened_unique" 
      ON "points_transactions" ("activity", "reference_id") 
      WHERE "activity" = 'TICKET_OPENED' AND "reference_id" IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS "points_tx_ticket_resolved_unique" 
      ON "points_transactions" ("activity", "reference_id") 
      WHERE "activity" = 'TICKET_RESOLVED' AND "reference_id" IS NOT NULL;
    `);

    console.log("Database schema synced successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
