ALTER TABLE "deals" ADD COLUMN "price_delta_percentage" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "enable_dynamic_pricing" text DEFAULT 'true';--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "initial_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "final_price" integer;