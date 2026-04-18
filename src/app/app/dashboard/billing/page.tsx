"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/i18n/compat/client";
import { PRICING, PLAN_LIMITS, type Plan } from "@/config/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PaymentMethodDialog } from "@/components/shared/PaymentMethodDialog";

export default function BillingPage() {
  const t = useTranslations("billing");
  const { user, isLoaded, isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<Plan | null>(null);

  // Show success/canceled toasts from redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        toast.success("Payment successful! Your plan has been upgraded.");
      } else if (params.get("canceled") === "true") {
        toast.info("Payment canceled. No changes were made.");
      }
    }
  }, []);

  const currentPlan = user?.plan || "free";

  const handleCheckout = async (plan: Plan) => {
    if (!isSignedIn) {
      toast.error("Please sign in to upgrade");
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Billing & Plans</h1>
        <p className="text-muted-foreground mb-6">
          Sign in to view your subscription and upgrade your plan.
        </p>
      </div>
    );
  }

  const plans: { key: Plan | "free"; data: (typeof PRICING)[keyof typeof PRICING] }[] = [
    { key: "free", data: PRICING.free },
    { key: "pro_monthly", data: PRICING.pro_monthly },
    { key: "pro_yearly", data: PRICING.pro_yearly },
    { key: "lifetime", data: PRICING.lifetime },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground mt-2">
          Current plan:{" "}
          <span className="font-semibold capitalize">
            {currentPlan.replace("_", " ")}
          </span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(({ key, data }) => {
          const isCurrent = key === currentPlan;
          const isPro = key.startsWith("pro");
          const isLifetime = key === "lifetime";
          const isFree = key === "free";

          return (
            <Card
              key={key}
              className={cn(
                "relative flex flex-col",
                isCurrent && "border-primary ring-2 ring-primary/20",
                "popular" in data && data.popular && "border-primary"
              )}
            >
              {"badge" in data && data.badge && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  {data.badge}
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isLifetime && <Sparkles className="h-5 w-5 text-yellow-500" />}
                  {isPro && !isLifetime && <Zap className="h-5 w-5 text-primary" />}
                  {data.name}
                </CardTitle>
                <CardDescription>{data.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    ${data.price}
                  </span>
                  {data.period && (
                    <span className="text-muted-foreground text-sm ml-1">
                      {data.period}
                    </span>
                  )}
                </div>
                {"limited" in data && data.limited && (
                  <p className="text-xs text-orange-500 mt-1">{data.limited}</p>
                )}
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {data.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isFree ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Current Plan" : "Free Forever"}
                  </Button>
                ) : isCurrent && !isFree ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loading !== null}
                  >
                    {loading === "portal" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full",
                      isLifetime && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    )}
                    onClick={() => setPaymentPlan(key as Plan)}
                    disabled={loading !== null || isCurrent}
                  >
                    {isCurrent ? "Current Plan" : isFree ? "Free" : "Upgrade"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {paymentPlan && (
        <PaymentMethodDialog
          open={!!paymentPlan}
          onClose={() => setPaymentPlan(null)}
          plan={paymentPlan}
        />
      )}
    </div>
  );
}
