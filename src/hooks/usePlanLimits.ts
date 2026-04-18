/**
 * Plan limits hook.
 * Returns helpers to check what the current user can do based on their plan.
 */
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PLAN_LIMITS, type Plan } from "@/config/stripe";
import { useResumeStore } from "@/store/useResumeStore";

// Free-tier template IDs (matches PLAN_LIMITS.free.templates)
const FREE_TEMPLATES = ["classic", "modern", "minimalist"];

export function usePlanLimits() {
  const { user, isSignedIn } = useAuth();
  const resumes = useResumeStore((s) => s.resumes);

  const plan: Plan = (user?.plan as Plan) || "free";
  const limits = PLAN_LIMITS[plan];

  const resumeCount = useMemo(() => Object.keys(resumes).length, [resumes]);

  return {
    plan,
    limits,
    isSignedIn,

    // Resume limits
    canCreateResume: resumeCount < limits.maxResumes,
    resumeCount,
    maxResumes: limits.maxResumes,

    // Template limits
    isTemplateFree: (templateId: string) => FREE_TEMPLATES.includes(templateId),
    canUseTemplate: (templateId: string) =>
      limits.templates === "all" || FREE_TEMPLATES.includes(templateId),

    // Feature limits
    canUseAI: limits.aiFeatures,
    canExportPDF: limits.pdfExport,
    canExportMarkdown: limits.markdownExport,
    hasWatermark: limits.watermark,

    // Generic check
    isPro: plan !== "free",
  };
}
