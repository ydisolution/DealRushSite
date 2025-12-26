CREATE TABLE "ai_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"project_id" varchar,
	"page_context" text,
	"user_question" text NOT NULL,
	"ai_response" text NOT NULL,
	"model_used" text,
	"tokens_used" integer,
	"was_helpful" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_faq_knowledge" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"keywords" text[] DEFAULT ARRAY[]::text[],
	"priority" integer DEFAULT 1,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"description" text,
	"contact_email" text,
	"contact_phone" text,
	"website" text,
	"user_id" varchar,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"performed_by" varchar,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"event_time" text,
	"location" text,
	"join_link" text,
	"description" text,
	"speakers_dealrush" text,
	"speakers_developer" text,
	"speakers_attorney" text DEFAULT 'עו"ד ספיר',
	"max_attendees" integer,
	"current_attendees" integer DEFAULT 0,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"developer_id" varchar NOT NULL,
	"user_id" varchar,
	"full_name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"city_preference" text,
	"unit_type_interests" text[] DEFAULT ARRAY[]::text[],
	"budget_min" integer,
	"budget_max" integer,
	"equity_estimate" integer,
	"has_mortgage_pre_approval" text DEFAULT 'false',
	"notes" text,
	"source" text,
	"funnel_status" text DEFAULT 'PRE_REGISTERED',
	"queue_position" integer,
	"selected_apartment_type" text,
	"webinar_invite_sent" text DEFAULT 'false',
	"webinar_invite_sent_at" timestamp,
	"webinar_reminder_sent" text DEFAULT 'false',
	"webinar_reminder_sent_at" timestamp,
	"confirmation_window_notified" text DEFAULT 'false',
	"confirmation_window_notified_at" timestamp,
	"updated_offer_approved" text,
	"updated_offer_approved_at" timestamp,
	"consent_marketing" text DEFAULT 'false',
	"consent_data_transfer" text DEFAULT 'false',
	"early_registered_at" timestamp,
	"event_rsvp_at" timestamp,
	"event_attended_at" timestamp,
	"final_registered_at" timestamp,
	"transferred_at" timestamp,
	"signed_at" timestamp,
	"dropped_at" timestamp,
	"admin_notes" text,
	"drop_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"threshold_registrants" integer NOT NULL,
	"from_price" integer NOT NULL,
	"savings" integer NOT NULL,
	"savings_percent" integer NOT NULL,
	"benefits" text[] DEFAULT ARRAY[]::text[],
	"is_active" text DEFAULT 'true',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"developer_id" varchar NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"address_text" text,
	"cover_image" text,
	"gallery" text[] DEFAULT ARRAY[]::text[],
	"description" text,
	"highlights" text[] DEFAULT ARRAY[]::text[],
	"property_types" jsonb DEFAULT '[]'::jsonb,
	"expected_delivery_date" timestamp,
	"total_capacity" integer DEFAULT 0,
	"waiting_list_capacity" integer DEFAULT 0,
	"current_registrant_count" integer DEFAULT 0,
	"current_waiting_list_count" integer DEFAULT 0,
	"early_registration_start" timestamp,
	"presentation_event_date" timestamp,
	"final_registration_start" timestamp,
	"final_registration_end" timestamp,
	"current_stage" text DEFAULT 'EARLY_REGISTRATION',
	"market_price_baseline" integer NOT NULL,
	"status" text DEFAULT 'open',
	"internal_status" text,
	"updated_offer_details" text,
	"legal_disclaimer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "real_estate_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "priority" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expected_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coordination_required" text DEFAULT 'false';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "last_contact_date" timestamp;