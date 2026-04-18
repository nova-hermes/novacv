import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Bitcoin, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Plan } from "@/config/stripe";
import { PRICING } from "@/config/stripe";

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
}

type Step = "method" | "crypto-select" | "crypto-pay";

const CRYPTO_OPTIONS = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", icon: "₿" },
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "Ξ" },
  { id: "usdc", name: "USD Coin", symbol: "USDC", icon: "$" },
  { id: "usdt", name: "Tether", symbol: "USDT", icon: "₮" },
];

interface CryptoPayment {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  expiresAt: number;
  invoiceUrl?: string;
}

export function PaymentMethodDialog({ open, onClose, plan }: PaymentMethodDialogProps) {
  const [step, setStep] = useState<Step>("method");
  const [loading, setLoading] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [copied, setCopied] = useState(false);

  const planInfo = PRICING[plan];

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrypto = () => {
    setStep("crypto-select");
  };

  const handleCryptoSelected = async (crypto: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/crypto/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, crypto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCryptoPayment(data);
      setStep("crypto-pay");
    } catch (error: any) {
      toast.error(error.message || "Failed to create crypto payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (cryptoPayment) {
      navigator.clipboard.writeText(cryptoPayment.payAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep("method");
    setCryptoPayment(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Choose payment method */}
        {step === "method" && (
          <>
            <DialogHeader>
              <DialogTitle>Choose Payment Method</DialogTitle>
              <DialogDescription>
                {planInfo.name} — ${planInfo.price}{planInfo.period}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={handleStripeCheckout}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pay with Card</p>
                    <p className="text-sm text-muted-foreground">
                      Visa, Mastercard, Apple Pay
                    </p>
                  </div>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={handleSelectCrypto}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pay with Crypto</p>
                    <p className="text-sm text-muted-foreground">
                      BTC, ETH, USDC, USDT
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Step 2: Select cryptocurrency */}
        {step === "crypto-select" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Cryptocurrency</DialogTitle>
              <DialogDescription>
                {planInfo.name} — ${planInfo.price}{planInfo.period}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              {CRYPTO_OPTIONS.map((crypto) => (
                <Card
                  key={crypto.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCryptoSelected(crypto.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-bold">
                      {crypto.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("method")}
                className="mt-2"
              >
                ← Back to payment methods
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Crypto payment details */}
        {step === "crypto-pay" && cryptoPayment && (
          <>
            <DialogHeader>
              <DialogTitle>Send Payment</DialogTitle>
              <DialogDescription>
                Send exactly {cryptoPayment.payAmount} {cryptoPayment.payCurrency.toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-lg font-bold font-mono">
                    {cryptoPayment.payAmount} {cryptoPayment.payCurrency.toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ ${cryptoPayment.priceAmount} USD
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Send to this address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                      {cryptoPayment.payAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {cryptoPayment.invoiceUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(cryptoPayment.invoiceUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in NOWPayments
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Your plan will be upgraded automatically after payment is confirmed.
                This usually takes 1-30 minutes depending on the network.
              </p>

              <Button variant="ghost" size="sm" onClick={() => setStep("crypto-select")} className="w-full">
                ← Choose different crypto
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
