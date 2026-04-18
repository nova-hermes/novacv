import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook that wraps callbacks with an auth gate.
 * If user is signed in, the callback runs normally.
 * If not, it opens the sign-in dialog instead.
 *
 * Usage:
 *   const { gated, showDialog, closeDialog } = useAuthGate();
 *   <button onClick={gated(handleExport)}>Export</button>
 *   <SignInDialog open={showDialog} onClose={closeDialog} />
 */
export function useAuthGate() {
  const { isSignedIn } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const closeDialog = useCallback(() => setShowDialog(false), []);

  const gated = useCallback(
    <T extends (...args: any[]) => any>(fn: T): T => {
      return ((...args: Parameters<T>) => {
        if (isSignedIn) {
          return fn(...args);
        }
        setShowDialog(true);
        return undefined;
      }) as T;
    },
    [isSignedIn]
  );

  return { gated, showDialog, closeDialog };
}
