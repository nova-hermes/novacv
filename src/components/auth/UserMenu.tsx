import { useUser, useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "@/lib/link";

export function UserMenu() {
  const { user: clerkUser } = useUser();
  const { user, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  if (!isSignedIn || !clerkUser) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium">
          {clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {user?.plan === "free" ? "Free Plan" : user?.plan?.replace("_", " ")}
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 border rounded-md"
      >
        Sign Out
      </button>
    </div>
  );
}
