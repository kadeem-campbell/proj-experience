-- Add traveler and creator roles to the user_role enum
ALTER TYPE user_role ADD VALUE 'traveler';
ALTER TYPE user_role ADD VALUE 'creator';

-- Update default role for new users to traveler instead of user
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'traveler';