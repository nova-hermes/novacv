/**
 * Stripe & plan configuration.
 * Price IDs come from Stripe dashboard — replace after creating products.
 */

// Stripe price IDs (replace with real IDs after creating products in Stripe dashboard)
export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  lifetime: process.env.STRIPE_PRICE_LIFETIME || "",
};

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxResumes: 1,
    templates: ["classic", "modern", "minimalist"],
    aiFeatures: false,
    pdfExport: false,
    markdownExport: false,
    watermark: true,
  },
  pro_monthly: {
    maxResumes: Infinity,
    templates: "all",
    aiFeatures: true,
    pdfExport: true,
    markdownExport: true,
    watermark: false,
  },
  pro_yearly: {
    maxResumes: Infinity,
    templates: "all",
    aiFeatures: true,
    pdfExport: true,
    markdownExport: true,
    watermark: false,
  },
  lifetime: {
    maxResumes: Infinity,
    templates: "all",
    aiFeatures: true,
    pdfExport: true,
    markdownExport: true,
    watermark: false,
  },
} as const;

// Pricing display data
export const PRICING = {
  free: {
    name: "Free",
    price: 0,
    period: "",
    description: "Get started with the basics",
    features: [
      "1 resume",
      "3 basic templates",
      "JSON export",
      "Local storage",
    ],
  },
  pro_monthly: {
    name: "Pro",
    price: 9,
    period: "/month",
    description: "Everything you need to land your dream job",
    features: [
      "Unlimited resumes",
      "All templates",
      "AI text polishing",
      "AI grammar check",
      "PDF export (no watermark)",
      "Markdown export",
      "Cloud sync",
      "Priority support",
    ],
    popular: true,
  },
  pro_yearly: {
    name: "Pro",
    price: 59,
    period: "/year",
    description: "Save 45% with annual billing",
    features: [
      "Everything in Pro Monthly",
      "45% savings",
      "Cloud sync",
      "Priority support",
    ],
    badge: "Save 45%",
  },
  lifetime: {
    name: "Lifetime",
    price: 149,
    period: "one-time",
    description: "Pay once, use forever. Early bird pricing.",
    features: [
      "Everything in Pro, forever",
      "All future templates",
      "Early adopter badge",
      "No recurring fees",
    ],
    badge: "Early Bird",
    limited: "Only 500 available",
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
