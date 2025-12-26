CREATE TABLE "fulfillment_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_supplier_id" varchar
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"deal_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_zip" text,
	"notes_from_customer" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"supplier_notes" text,
	"scheduled_delivery_date" timestamp,
	"out_for_delivery_date" timestamp,
	"delivered_date" timestamp,
	"tracking_number" text,
	"carrier" text,
	"shipping_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "needs_shipping" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "shipping_cost" SET NOT NULL;