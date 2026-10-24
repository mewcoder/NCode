import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("NCode 关闭奖励中心后，侧栏头像菜单不再渲染奖励入口", async () => {
  const source = await readFile("packages/ui/src/WorkspaceSidebarFooter.tsx", "utf8");

  // 奖励菜单项与徽标已从真实入口移除；这里直接断言源码不再保留该 DOM 契约，
  // 避免上游 JSX 结构变化时测试用字符串切片得出错误结论。
  expect(source).not.toContain('data-testid="rewards-menu-item"');
  expect(source).not.toContain("rewards.menuTitle");
  expect(source).not.toContain("rewards.menuBadge");
});
