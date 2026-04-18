/**
 * Export trial counter.
 * Free users get 3 frictionless exports, then hit upgrade wall.
 */
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const TRIAL_LIMIT = 3;
const STORAGE_KEY = "novacv_export_count";

function getExportCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementExportCount(): void {
  try {
    const count = getExportCount();
    localStorage.setItem(STORAGE_KEY, String(count + 1));
  } catch {}
}

export function useExportTrial() {
  const { user } = useAuth();
  const plan = (user?.plan as string) || "free";
  const isPro = plan !== "free";

  /** Returns remaining free exports (Infinity for Pro). */
  const remainingExports = isPro ? Infinity : TRIAL_LIMIT - getExportCount();

  /** Try to export. Returns true if allowed, false if blocked. */
  const tryExport = useCallback((): boolean => {
    if (isPro) return true;
    if (getExportCount() < TRIAL_LIMIT) {
      incrementExportCount();
      return true;
    }
    return false;
  }, [isPro]);

  return { tryExport, remainingExports, isPro };
}
