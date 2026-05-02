/**
 * Translate raw Supabase/Postgres errors into human-friendly messages.
 * Used by the AdminEntityEditor primitive so users never see raw SQL noise.
 */
export const friendlyError = (err: unknown): string => {
  if (!err) return 'Something went wrong';
  const msg = (err as any)?.message || String(err);

  if (/row-level security|violates row-level security|permission denied/i.test(msg)) {
    return "You don't have permission to do that. Sign in as an admin.";
  }
  if (/duplicate key|already exists|unique constraint/i.test(msg)) {
    return 'That value is already in use — try a different name or slug.';
  }
  if (/foreign key|violates foreign key/i.test(msg)) {
    return "Can't do that — this record is still referenced elsewhere. Remove links first.";
  }
  if (/not-null|null value/i.test(msg)) {
    return 'A required field is missing.';
  }
  if (/check constraint/i.test(msg)) {
    return 'One of the values is outside the allowed set.';
  }
  if (/network|fetch|failed to fetch/i.test(msg)) {
    return 'Network error — check your connection and try again.';
  }
  return msg.length > 180 ? msg.slice(0, 180) + '…' : msg;
};
