import { SignIn } from "@clerk/tanstack-react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "@/i18n/compat/client";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SignInDialog({ open, onClose, title, description }: SignInDialogProps) {
  const t = useTranslations("authGate");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title || t("signIn.title")}</DialogTitle>
          <DialogDescription>
            {description || t("signIn.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="px-2 pb-6">
          <SignIn
            routing="virtual"
            signUpUrl="/sign-up"
            afterSignInUrl={window.location.href}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border-0",
              },
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
