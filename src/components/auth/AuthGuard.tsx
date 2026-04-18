import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "@/lib/link";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Auth guard component — wraps content that requires authentication.
 * Shows loading spinner while auth state loads,
 * redirects to sign-in if not authenticated.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to access your resumes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/sign-in"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-2 border border-input rounded-md hover:bg-accent"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
