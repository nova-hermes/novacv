import { createFileRoute } from "@tanstack/react-router";
import BillingPage from "@/app/app/dashboard/billing/page";

export const Route = createFileRoute("/app/dashboard/billing")({
  component: BillingPage,
});
