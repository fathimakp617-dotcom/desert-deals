/**
 * Creates an AbortSignal that fires after the given ms.
 * Use with `.abortSignal(signal)` on Supabase queries to
 * prevent the UI from hanging when the backend is down.
 */
export const createTimeoutSignal = (ms = 5000): { signal: AbortSignal; clear: () => void } => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
};
