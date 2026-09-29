-- Lock each account to the role chosen at sign-up.
--
-- Background: users.role is `user_role NOT NULL DEFAULT 'player'` in the live DB
-- (the Drizzle schema said nullable varchar — that drift is corrected in
-- shared/models/auth.ts). Because the column is never null, `role IS NULL`
-- cannot mean "hasn't chosen yet", so a write-once rule keyed on the role value
-- alone would freeze every new account as 'player' before the user ever picks.
--
-- This adds an explicit marker instead: role_selected_at is set the moment a
-- user confirms their role. Role is locked iff role_selected_at IS NOT NULL.
-- Existing rows stay NULL — they were defaulted, never chosen, so those users
-- still get their one selection.
--
-- Reversible: DROP COLUMN users.role_selected_at.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_selected_at timestamp;

COMMENT ON COLUMN users.role_selected_at IS
  'When the user confirmed their account role at sign-up. NOT NULL => role is locked; only an admin may change it.';

COMMIT;
