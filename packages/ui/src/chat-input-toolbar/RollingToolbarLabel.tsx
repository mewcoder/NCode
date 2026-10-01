import { cn } from "@/components/lib/utils.js";

// 全局停用标签滚动动画，保留原实现以便后续需要时恢复。
/*
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LABEL_ROLL_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
} as const;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setPrefersReducedMotion(query.matches);
    };
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => {
        query.removeEventListener("change", update);
      };
    }

    query.addListener(update);
    return () => {
      query.removeListener(update);
    };
  }, []);

  return prefersReducedMotion;
}
*/

export function RollingToolbarLabel({
  label,
  className,
  prefix,
  prefixClassName,
  value,
}: {
  label: string;
  className?: string;
  prefix?: string;
  prefixClassName?: string;
  value?: string;
}) {
  const content =
    prefix !== undefined && value !== undefined ? (
      <>
        <span className={prefixClassName}>{prefix}</span>
        <span>{value}</span>
      </>
    ) : (
      label
    );

  return (
    <span
      className={cn(
        "relative inline-flex h-[1.3em] min-w-0 items-center overflow-hidden leading-[1.25]",
        className,
      )}
      title={label}
    >
      <span className="inline-flex min-w-0 whitespace-nowrap leading-[1.25]">{content}</span>
      {/* 全局停用滚动动画，保留原标签动效实现：
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={label}
          className="inline-flex min-w-0 whitespace-nowrap leading-[1.25]"
          initial={{ y: "0.75em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.75em", opacity: 0 }}
          transition={LABEL_ROLL_TRANSITION}
        >
          {content}
        </motion.span>
      </AnimatePresence>
      */}
    </span>
  );
}
