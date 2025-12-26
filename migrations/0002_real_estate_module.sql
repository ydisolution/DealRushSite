-- Real Estate Module Migration
-- Creates tables for developers, projects, tiers, and registrations

-- Developers (Contractors)
CREATE TABLE IF NOT EXISTS "developers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Real Estate Projects
CREATE TABLE IF NOT EXISTS "real_estate_projects" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "developer_id" varchar NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
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
  "registration_open_date" timestamp,
  "market_price_baseline" integer NOT NULL,
  "status" text DEFAULT 'open',
  "legal_disclaimer" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Project Discount Tiers
CREATE TABLE IF NOT EXISTS "project_tiers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Project Registrations (Leads)
CREATE TABLE IF NOT EXISTS "project_registrations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" varchar NOT NULL,
  "developer_id" varchar NOT NULL,
  "user_id" varchar,
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "city_preference" text,
  "unit_type_interests" text[] DEFAULT ARRAY[]::text[],
  "budget_min" integer,
  "budget_max" integer,
  "has_mortgage_pre_approval" text DEFAULT 'false',
  "notes" text,
  "source" text,
  "status" text DEFAULT 'new',
  "consent_marketing" text DEFAULT 'false',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_projects_developer" ON "real_estate_projects"("developer_id");
CREATE INDEX IF NOT EXISTS "idx_projects_city" ON "real_estate_projects"("city");
CREATE INDEX IF NOT EXISTS "idx_projects_region" ON "real_estate_projects"("region");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "real_estate_projects"("status");
CREATE INDEX IF NOT EXISTS "idx_projects_slug" ON "real_estate_projects"("slug");

CREATE INDEX IF NOT EXISTS "idx_tiers_project" ON "project_tiers"("project_id");
CREATE INDEX IF NOT EXISTS "idx_tiers_sort" ON "project_tiers"("sort_order");

CREATE INDEX IF NOT EXISTS "idx_registrations_project" ON "project_registrations"("project_id");
CREATE INDEX IF NOT EXISTS "idx_registrations_developer" ON "project_registrations"("developer_id");
CREATE INDEX IF NOT EXISTS "idx_registrations_status" ON "project_registrations"("status");
CREATE INDEX IF NOT EXISTS "idx_registrations_email" ON "project_registrations"("email");

-- Foreign key constraints (optional, add if you want strict referential integrity)
-- ALTER TABLE "real_estate_projects" ADD CONSTRAINT "fk_projects_developer" FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE CASCADE;
-- ALTER TABLE "project_tiers" ADD CONSTRAINT "fk_tiers_project" FOREIGN KEY ("project_id") REFERENCES "real_estate_projects"("id") ON DELETE CASCADE;
-- ALTER TABLE "project_registrations" ADD CONSTRAINT "fk_registrations_project" FOREIGN KEY ("project_id") REFERENCES "real_estate_projects"("id") ON DELETE CASCADE;
