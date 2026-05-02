// Maps raw backend errors to safe, user-friendly messages.
// Avoids leaking schema names, constraint identifiers, or internal details to the UI.
// Original errors should still be logged via console for debugging.

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = (error as { message?: string } | null)?.message ?? "";
  const msg = raw.toLowerCase();

  if (!msg) return fallback;

  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Invalid email or password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (msg.includes("already registered") || msg.includes("user already")) {
    return "This email is already registered. Try logging in instead.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "This value is already in use.";
  }
  if (msg.includes("permission denied") || msg.includes("not authorized") || msg.includes("rls")) {
    return "You don't have permission to do that.";
  }
  if (msg.includes("foreign key")) {
    return "Related data is missing or invalid.";
  }
  if (msg.includes("not found")) {
    return "The requested item could not be found.";
  }
  if (msg.includes("violates check constraint") || msg.includes("invalid input")) {
    return "Some of the information provided is invalid.";
  }
  if (msg.includes("password")) {
    // Password validation messages are generally safe and useful.
    return raw;
  }

  return fallback;
}
