
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "@/i18n/compat/client";
import { ClerkAuthProvider } from "@/components/auth/ClerkAuthProvider";
import { AuthProvider } from "@/hooks/useAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  return (
    <ClerkAuthProvider>
      <AuthProvider>
        <HeroUIProvider locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            storageKey="novacv-theme"
          >
            {children}
          </ThemeProvider>
        </HeroUIProvider>
      </AuthProvider>
    </ClerkAuthProvider>
  );
}
