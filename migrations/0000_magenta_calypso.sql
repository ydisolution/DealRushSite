CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"original_price" integer NOT NULL,
	"current_price" integer NOT NULL,
	"cost_price" integer,
	"participants" integer DEFAULT 0 NOT NULL,
	"target_participants" integer NOT NULL,
	"min_participants" integer DEFAULT 1,
	"end_time" timestamp NOT NULL,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb,
	"is_active" text DEFAULT 'true' NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"supplier_id" varchar,
	"supplier_name" text,
	"supplier_stripe_key" text,
	"supplier_bank_account" text,
	"platform_commission" integer DEFAULT 5
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"deal_id" varchar,
	"email_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_paid" integer NOT NULL,
	"position" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"stripe_payment_intent_id" text,
	"stripe_setup_intent_id" text,
	"stripe_payment_method_id" text,
	"card_last4" text,
	"card_brand" text,
	"charged_at" timestamp,
	"charged_amount" integer,
	"tier_at_join" integer,
	"final_tier" integer,
	"needs_shipping" boolean DEFAULT false,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_zip_code" text,
	"shipping_cost" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"deal_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tracking_number" text,
	"shipped_at" timestamp,
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"city" text NOT NULL,
	"cost" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" text,
	"first_name" varchar,
	"last_name" varchar,
	"phone" varchar,
	"profile_image_url" varchar,
	"is_admin" text DEFAULT 'false',
	"is_supplier" text DEFAULT 'false',
	"supplier_company_name" text,
	"supplier_bank_details" text,
	"supplier_stripe_account_id" text,
	"is_email_verified" text DEFAULT 'false',
	"email_verification_token" text,
	"email_verification_expires" timestamp,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");