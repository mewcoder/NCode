import { cn } from "@/components/lib/utils.js";

export function ZCodeAboutLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="118"
      fill="none"
      viewBox="0 0 218 256"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="matrix(0 1 -1 0 218 0)">
        <path
          fill="currentColor"
          d="M134.4 0.130152L116.48 25.6022C113.665 29.5699 109.054 32.0019 104.064 32.0019H6.3999V0C6.3999 0.130149 134.4 0.130152 134.4 0.130152Z"
        />
        <path fill="currentColor" d="M256 0.130127L102.401 217.732H0L153.599 0.130127H256Z" />
        <path
          fill="currentColor"
          d="M121.601 217.732L139.65 192.134C142.465 188.166 147.076 185.734 152.067 185.734H249.604V217.736H121.601V217.732Z"
        />
      </g>
    </svg>
  );
}

export function ZCodeWordmarkLogo({ className }: { className?: string }) {
  // 修复原因：替换 N 形图标时误恢复了上游 ZCODE 字标；文字品牌应继续使用 NCode。
  return <span className={cn("shrink-0 font-semibold", className)}>NCode</span>;
}
