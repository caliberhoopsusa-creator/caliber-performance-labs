-- Recreate recruiter_profiles to match shared/schema.ts.
-- The live table was an obsolete version (uuid id; institution/edu_email/
-- conference_affiliation columns) that broke /api/colleges/:id/recruiters
-- ("column school_name does not exist") and /api/players/:id/whos-watching
-- ("operator does not exist: integer = uuid" — integer recruiter_id joined
-- against the uuid PK). All affected tables verified empty before running.
-- Approved by operator 2026-07-14.
BEGIN;

DROP TABLE recruiter_profiles;

CREATE TABLE recruiter_profiles (
  id serial PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  school_name text NOT NULL,
  division text NOT NULL,
  title text NOT NULL,
  school_email text NOT NULL,
  phone text,
  school_logo_url text,
  bio text,
  state text,
  conference text,
  sport text NOT NULL DEFAULT 'basketball',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE INDEX recruiter_profiles_user_id_idx ON recruiter_profiles (user_id);

ALTER TABLE recruiter_profile_views
  ADD CONSTRAINT recruiter_profile_views_recruiter_id_fkey
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE;
ALTER TABLE recruiter_interest_signals
  ADD CONSTRAINT recruiter_interest_signals_recruiter_id_fkey
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE;
ALTER TABLE recruiter_blocks
  ADD CONSTRAINT recruiter_blocks_recruiter_id_fkey
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE;
ALTER TABLE recruiter_bookmarks
  ADD CONSTRAINT recruiter_bookmarks_recruiter_id_fkey
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE;

COMMIT;
