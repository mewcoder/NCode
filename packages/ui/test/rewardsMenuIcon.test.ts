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

it("内嵌网页导航保留顶部和左右间距，移除底部内边距", async () => {
  const source = await readFile("packages/ui/src/components/EmbeddedWebsiteHeader.tsx", "utf8");
  expect(source).toContain('className="bg-background px-6 py-4 pb-0 max-sm:px-4"');
});

it("奖励中心使用礼物图标，账号头像仍使用 User", async () => {
  const source = await readFile("packages/ui/src/WorkspaceSidebarFooter.tsx", "utf8");
  const entry = source.split('data-testid="rewards-menu-item"')[1]?.split("</DropdownMenuItem>")[0];
  expect(entry).toContain('<Gift className="size-4" />');
  expect(entry).toContain("<Badge");
  expect(entry).toContain('id: "rewards.menuTitle"');
  expect(entry).toContain('id: "rewards.menuBadge"');
  expect(source).toMatch(/\{user \? \(\s*<DropdownMenuItem[^\n]*data-testid="rewards-menu-item"/);
  expect(source).toContain('<User className="size-4" />');
});

it("菜单保留邀请好友及奖励徽标，页面标题独立为奖励中心", async () => {
  expect(await readFile("packages/ui/src/i18n/locales/zh-CN.ts", "utf8")).toContain(
    '"rewards.menuTitle": "邀请好友"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/zh-CN.ts", "utf8")).toContain(
    '"rewards.menuBadge": "奖励"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.menuTitle": "Refer a friend"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.menuBadge": "Rewards"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/zh-CN.ts", "utf8")).toContain(
    '"rewards.title": "奖励中心"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.title": "Rewards"',
  );
});
