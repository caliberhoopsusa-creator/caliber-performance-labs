CREATE TABLE "daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"quest_date" date NOT NULL,
	"quest_type" text NOT NULL,
	"target_value" integer DEFAULT 1 NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"xp_reward" integer DEFAULT 25 NOT NULL,
	"coin_reward" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"brand" text NOT NULL,
	"category" text NOT NULL,
	"model" text,
	"size" text,
	"colorway" text,
	"in_use" boolean DEFAULT true NOT NULL,
	"purchased_at" date,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "guardian_links" ADD COLUMN "minor_consented" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "minor_data_public" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "verified_athlete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "verification_method" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_conversions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "daily_quests" ADD CONSTRAINT "daily_quests_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_quests_player_id_idx" ON "daily_quests" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "daily_quests_player_date_idx" ON "daily_quests" USING btree ("player_id","quest_date");--> statement-breakpoint
CREATE INDEX "equipment_player_id_idx" ON "equipment" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "equipment_category_idx" ON "equipment" USING btree ("category");--> statement-breakpoint
ALTER TABLE "colleges" DROP COLUMN "nfl_players_produced";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");