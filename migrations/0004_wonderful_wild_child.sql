ALTER TABLE "real_estate_projects" ALTER COLUMN "current_stage" SET DEFAULT 'PRE_REGISTRATION';--> statement-breakpoint
ALTER TABLE "real_estate_projects" ADD COLUMN "early_registration_end" timestamp;--> statement-breakpoint
ALTER TABLE "real_estate_projects" ADD COLUMN "webinar_deadline" timestamp;