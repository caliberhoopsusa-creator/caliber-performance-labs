ALTER TABLE "players" ADD COLUMN "in_transfer_portal" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "transfer_portal_entered_at" timestamp;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "transfer_portal_note" text;--> statement-breakpoint
ALTER TABLE "recruiting_events" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recruiting_events" ADD COLUMN "featured_until" timestamp;--> statement-breakpoint
ALTER TABLE "recruiting_events" ADD COLUMN "listing_tier" text DEFAULT 'free';