import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button.js";

/**
 * 购买/升级弹窗链路已下线（CodingPlanUpgradeDialogProvider 已删除）。
 * 历史上这里通过 Provider 的套餐库存查询做 loading/error 守卫；现库存守卫不再可用，
 * 恒返回就绪态以保持既有调用点编译与运行行为不变。
 */
export function useCodingPlanEntryGate() {
  return { status: "ready" as const, label: undefined, retry: undefined };
}

/** 兼容历史签名；升级链路下线后守卫恒为就绪，bypassGate 不再有意义。 */
export function CodingPlanEntryButton({
  children,
  disabled,
  onClick,
  bypassGate = false,
  ...props
}: ComponentProps<typeof Button> & { bypassGate?: boolean }) {
  void bypassGate;
  return (
    <Button {...props} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}
