/**
 * Race a Supabase query against a timeout.
 * Returns the query result or throws on timeout.
 */
export const SUPABASE_TIMEOUT_MS = 5000;

export function withTimeout<T>(promise: PromiseLike<T>, ms = SUPABASE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("SUPABASE_TIMEOUT")), ms)
    ),
  ]);
}
