/**
 * Demo mode runs when forced, or when the Lambda API base URL is missing.
 * Production data lives in MongoDB Atlas via Lambda — never in demo fixtures.
 */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !process.env.NEXT_PUBLIC_API_BASE_URL;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
}
