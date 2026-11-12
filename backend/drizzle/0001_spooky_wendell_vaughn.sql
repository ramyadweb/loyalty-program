CREATE TABLE "token_blacklist" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "token_hash" varchar(64) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "token_blacklist_token_hash_unique"
    UNIQUE("token_hash")
);
--> statement-breakpoint

ALTER TABLE "token_blacklist"
ADD CONSTRAINT "token_blacklist_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;