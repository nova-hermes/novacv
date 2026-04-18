import { ClerkProvider, SignIn, SignUp } from "@clerk/tanstack-react-start";
import { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY not set. Auth features will not work."
  );
}

interface ClerkAuthProviderProps {
  children: ReactNode;
}

export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  if (!publishableKey) {
    // No Clerk key — render without auth (development mode)
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

// Re-export Clerk components for convenience
export { SignIn, SignUp };
