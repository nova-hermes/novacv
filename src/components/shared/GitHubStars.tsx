import { useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "@/lib/navigation";
import { useTranslations } from "@/i18n/compat/client";

export function TryFreeButton() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  return (
    <motion.a
      href={`/${locale}/app/dashboard/resumes`}
      className={cn(
        "relative inline-flex items-center gap-2 h-8 px-4 rounded-full",
        "bg-background/50 dark:bg-background/20 backdrop-blur-md",
        "border border-border/40 dark:border-white/20",
        "hover:border-border/80 dark:hover:border-white/40",
        "shadow-sm hover:shadow-md",
        "cursor-pointer select-none",
        "group overflow-hidden"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-[length:400%_400%] animate-gradient-xy",
          "bg-gradient-to-r from-violet-200/30 via-pink-200/30 to-cyan-200/30",
          "dark:from-violet-500/10 dark:via-pink-500/10 dark:to-cyan-500/10",
          "group-hover:from-violet-200/40 group-hover:via-pink-200/40 group-hover:to-cyan-200/40",
          "dark:group-hover:from-violet-500/15 dark:group-hover:via-pink-500/15 dark:group-hover:to-cyan-500/15",
          "transition-colors duration-500"
        )}
      />

      <motion.div
        className="relative z-10 flex items-center"
        animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Sparkles
          className={cn(
            "h-4 w-4",
            "text-violet-500/70 dark:text-violet-400/70",
            "transition-colors duration-300",
            isHovered && "text-violet-500 dark:text-violet-400"
          )}
        />
      </motion.div>

      <span className="relative z-10 text-sm font-medium">Try it Free</span>
    </motion.a>
  );
}

// Back-compat alias
export { TryFreeButton as GitHubStars };
