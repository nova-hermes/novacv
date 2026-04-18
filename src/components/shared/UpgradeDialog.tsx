import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { useRouter } from "@/lib/navigation";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function UpgradeDialog({ open, onClose, title, description }: UpgradeDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => {
              onClose();
              router.push("/app/dashboard/billing");
            }}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
