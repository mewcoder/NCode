import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RootStartupLoading, ZCodeStartupLogoBadge } from "@/root/RootStartupLoading.js";
import { ZCodeWordmarkLogo } from "@/components/ui/ZCodeAboutLogo.js";

describe("NCode 字标", () => {
  it("保留 NCode 文本及调用方样式，不恢复上游 SVG 字标", () => {
    const html = renderToStaticMarkup(
      createElement(ZCodeWordmarkLogo, { className: "brand-label" }),
    );
    expect(html).toContain(">NCode</span>");
    expect(html).toContain("brand-label");
    expect(html).not.toContain("<svg");
  });
});

describe("RootStartupLoading", () => {
  it("静态品牌图标使用内联 N 形标志且不渲染呼吸动画", () => {
    const html = renderToStaticMarkup(createElement(ZCodeStartupLogoBadge, { animated: false }));
    // NCode 标志是内联 SVG（旋转 90° 的 N，fill=currentColor），随 badge 的白色着色；
    // animated=false 时不渲染 <animate>。
    expect(html).toContain("<svg");
    expect(html).toContain("matrix(0 1 -1 0 218 0)");
    expect(html).not.toContain("<animate");
  });
  it("启动阻塞态只展示 NCode 图标与 aria-label，不露出可见 loading 文案", () => {
    const html = renderToStaticMarkup(createElement(RootStartupLoading, { label: "加载中..." }));

    expect(html).toContain('data-testid="root-startup-loading"');
    expect(html).toContain('aria-label="加载中..."');
    // 标志本身是装饰性 SVG，语义由外层 role=status + aria-label 承担。
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("matrix(0 1 -1 0 218 0)");
    expect(html).not.toContain(">加载中...<");
  });
});
