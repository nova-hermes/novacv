import { toast } from "sonner";

import { normalizeFontFamily } from "@/utils/fonts";
import { ResumeData } from "@/types/resume";
import { generateResumeMarkdown, ResumeMarkdownOptions } from "@/utils/markdown";

const INVALID_FILE_NAME_CHAR_REGEX = /[\\/:*?"<>|]/g;

const getSafeFileName = (title?: string) => {
  const normalized = (title || "resume")
    .trim()
    .replace(INVALID_FILE_NAME_CHAR_REGEX, "_")
    .replace(/\s+/g, " ");

  return normalized || "resume";
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
};

export const getOptimizedStyles = () => {
  const styleCache = new Map();
  const startTime = performance.now();

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => {
            const ruleText = rule.cssText;
            const normalizedRuleText = ruleText.toLowerCase();
            if (styleCache.has(ruleText)) return false;
            styleCache.set(ruleText, true);

            if (rule instanceof CSSFontFaceRule) return false;
            if (rule instanceof CSSImportRule) return false;
            if (normalizedRuleText.includes("fonts.googleapis.com")) return false;
            if (normalizedRuleText.includes("fonts.gstatic.com")) return false;
            if (ruleText.includes("font-family")) return false;
            if (ruleText.includes("@keyframes")) return false;
            if (ruleText.includes("animation")) return false;
            if (ruleText.includes("transition")) return false;
            if (ruleText.includes("hover")) return false;
            return true;
          })
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        console.warn("Style processing error:", e);
        return "";
      }
    })
    .join("\n");

  console.log(`Style processing took ${performance.now() - startTime}ms`);
  return styles;
};

export const optimizeImages = async (element: HTMLElement) => {
  const startTime = performance.now();
  const images = element.getElementsByTagName("img");

  const imagePromises = Array.from(images)
    .filter((img) => !img.src.startsWith("data:"))
    .map(async (img) => {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Image conversion error:", error);
        return Promise.resolve();
      }
    });

  await Promise.all(imagePromises);
  console.log(`Image processing took ${performance.now() - startTime}ms`);
};

export interface ExportToPdfOptions {
  elementId: string;
  title: string;
  pagePadding: number;
  fontFamily?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

interface ExportResumeFileOptions {
  resume?: ResumeData | null;
  title?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

interface ExportResumeMarkdownOptions extends ExportResumeFileOptions {
  markdownOptions?: ResumeMarkdownOptions;
}

export const exportResumeAsJson = ({
  resume,
  title,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportResumeFileOptions) => {
  onStart?.();

  try {
    if (!resume) {
      throw new Error("No active resume");
    }

    const json = JSON.stringify(resume, null, 2);
    const fileName = `${getSafeFileName(title || resume.title)}.json`;
    downloadTextFile(json, fileName, "application/json;charset=utf-8");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("JSON export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};

export const exportResumeAsMarkdown = ({
  resume,
  title,
  onStart,
  onEnd,
  successMessage,
  errorMessage,
  markdownOptions
}: ExportResumeMarkdownOptions) => {
  onStart?.();

  try {
    if (!resume) {
      throw new Error("No active resume");
    }

    const markdown = generateResumeMarkdown(resume, markdownOptions);
    const fileName = `${getSafeFileName(title || resume.title)}.md`;
    downloadTextFile(markdown, fileName, "text/markdown;charset=utf-8");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("Markdown export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};

export const exportToPdf = async ({
  elementId,
  title,
  pagePadding,
  fontFamily,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportToPdfOptions) => {
  const exportStartTime = performance.now();
  onStart?.();

  try {
    const pdfElement = document.querySelector<HTMLElement>(`#${elementId}`);
    if (!pdfElement) {
      throw new Error(`PDF element #${elementId} not found`);
    }

    const selectedFontFamily = normalizeFontFamily(fontFamily);

    // Clone and prepare the element for rendering
    const clonedElement = pdfElement.cloneNode(true) as HTMLElement;
    const transformValue = clonedElement.style.transform || "";
    const scaleMatch = transformValue.match(/scale\(([\d.]+)\)/);

    if (scaleMatch) {
      const scale = Number(scaleMatch[1]);
      if (Number.isFinite(scale) && scale > 0 && scale < 1) {
        clonedElement.style.removeProperty("transform");
        clonedElement.style.removeProperty("transform-origin");
        clonedElement.style.setProperty("width", "100%", "important");
        clonedElement.style.setProperty("zoom", String(scale));
      }
    }

    clonedElement.style.setProperty("width", "100%", "important");
    clonedElement.style.setProperty("padding", "0", "important");
    clonedElement.style.setProperty("box-sizing", "border-box");
    clonedElement.style.setProperty("font-family", selectedFontFamily, "important");

    // Hide page break lines
    const pageBreakLines = clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
    pageBreakLines.forEach((line) => {
      line.style.display = "none";
    });

    // Optimize images
    await optimizeImages(clonedElement);

    // html2pdf.js — client-side PDF generation (no server needed)
    const html2pdf = (await import("html2pdf.js")).default;
    const marginInches = pagePadding > 0 ? pagePadding / 96 : 0.4;

    await html2pdf()
      .set({
        margin: marginInches,
        filename: `${getSafeFileName(title)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(clonedElement)
      .save();

    if (successMessage) toast.success(successMessage);
    console.log(`Total export took ${performance.now() - exportStartTime}ms`);
  } catch (error) {
    console.error("Export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};
