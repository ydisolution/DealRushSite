-- Migration: Add multi-stage funnel support to real estate module
-- Date: 2025-12-18

-- Add new columns to real_estate_projects for stage dates
ALTER TABLE real_estate_projects 
ADD COLUMN IF NOT EXISTS early_registration_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS presentation_event_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS final_registration_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS final_registration_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'EARLY_REGISTRATION';

-- Add new columns to project_registrations for full funnel tracking
ALTER TABLE project_registrations
ADD COLUMN IF NOT EXISTS equity_estimate INTEGER,
ADD COLUMN IF NOT EXISTS funnel_status TEXT DEFAULT 'EARLY_REGISTERED',
ADD COLUMN IF NOT EXISTS consent_data_transfer TEXT DEFAULT 'false',
ADD COLUMN IF NOT EXISTS early_registered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS event_rsvp_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS event_attended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS final_registered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dropped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS drop_reason TEXT;

-- Create project_events table
CREATE TABLE IF NOT EXISTS project_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_time TEXT,
  location TEXT,
  join_link TEXT,
  description TEXT,
  speakers_dealrush TEXT,
  speakers_developer TEXT,
  speakers_attorney TEXT DEFAULT 'עו"ד ספיר',
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR,
  session_id VARCHAR,
  project_id VARCHAR,
  page_context TEXT,
  user_question TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  was_helpful TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create ai_faq_knowledge table
CREATE TABLE IF NOT EXISTS ai_faq_knowledge (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 1,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_date ON project_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_faq_category ON ai_faq_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_project_registrations_funnel_status ON project_registrations(funnel_status);
CREATE INDEX IF NOT EXISTS idx_real_estate_projects_current_stage ON real_estate_projects(current_stage);

-- Update existing registrations to have early_registered_at based on created_at
UPDATE project_registrations 
SET early_registered_at = created_at 
WHERE early_registered_at IS NULL;

COMMENT ON TABLE project_events IS 'Events for real estate projects (presentations, webinars)';
COMMENT ON TABLE ai_conversations IS 'Log of AI assistant conversations for analytics';
COMMENT ON TABLE ai_faq_knowledge IS 'FAQ knowledge base for AI assistant';
COMMENT ON COLUMN real_estate_projects.current_stage IS 'EARLY_REGISTRATION | PRESENTATION | FINAL_REGISTRATION | POST_REGISTRATION';
COMMENT ON COLUMN project_registrations.funnel_status IS 'EARLY_REGISTERED | EVENT_RSVP | EVENT_ATTENDED | FINAL_REGISTERED | TRANSFERRED_TO_DEVELOPER | IN_LEGAL_PROCESS | SIGNED | DROPPED';
