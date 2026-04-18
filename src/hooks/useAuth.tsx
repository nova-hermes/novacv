import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/tanstack-react-start";
import { supabase } from "@/lib/supabase";
import { setSyncUserId } from "@/lib/serverSyncBridge";

interface AuthUser {
  id: string; // Supabase user ID (UUID)
  clerkId: string;
  email: string;
  plan: "free" | "pro_monthly" | "pro_yearly" | "lifetime";
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshUser = async () => {
    if (!clerkUser) {
      setUser(null);
      setIsLoaded(true);
      return;
    }

    try {
      // Check if user exists in Supabase
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id, email, plan, clerk_id")
        .eq("clerk_id", clerkUser.id)
        .single();

      if (error && error.code === "PGRST116") {
        // User doesn't exist — create them
        const email =
          clerkUser.primaryEmailAddress?.emailAddress || "";
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            clerk_id: clerkUser.id,
            email,
          })
          .select("id, email, plan, clerk_id")
          .single();

        if (insertError) {
          console.error("Failed to create user:", insertError);
          setIsLoaded(true);
          return;
        }

        setUser({
          id: newUser.id,
          clerkId: newUser.clerk_id,
          email: newUser.email,
          plan: newUser.plan,
        });
      } else if (existingUser) {
        setUser({
          id: existingUser.id,
          clerkId: existingUser.clerk_id,
          email: existingUser.email,
          plan: existingUser.plan,
        });
      }
    } catch (err) {
      console.error("Auth refresh error:", err);
    }

    setIsLoaded(true);
  };

  useEffect(() => {
    if (clerkLoaded) {
      refreshUser();
    }
  }, [clerkLoaded, clerkUser?.id]);

  // Sync user ID to server sync bridge
  useEffect(() => {
    setSyncUserId(user?.id ?? null);
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!clerkUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
