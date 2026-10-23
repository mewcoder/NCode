import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NCODE_FEATURE_POLICY } from "@zcode/shared";
import {
  EXPECTED_NCODE_FEATURE_POLICY,
  NCODE_CLOSURE_ANCHORS,
} from "../scripts/ncode-closure-registry.mjs";

// NCode 关闭项静态锚点：数据登记在 ncode-closure-registry.mjs（单一事实源），
// 本文件负责在 vitest 入口执行断言；影响映射脚本消费同一份登记。
// 上游更新命中锚点时，失败信息指向对应关闭项；不得为通过测试删除锚点或放宽匹配。

function readRepoFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("NCode 关闭项策略值", () => {
  it("NCODE_FEATURE_POLICY 关闭值保持冻结，不得被上游同步或误改翻转", () => {
    expect(NCODE_FEATURE_POLICY).toEqual(EXPECTED_NCODE_FEATURE_POLICY);
  });
});

describe("NCode 关闭项静态锚点", () => {
  for (const anchor of NCODE_CLOSURE_ANCHORS) {
    it(`${anchor.kind} ${anchor.file} :: ${anchor.pattern}${anchor.note ? `（${anchor.note}）` : ""}`, () => {
      let content: string;
      try {
        content = readRepoFile(anchor.file);
      } catch {
        if (anchor.upstreamIntroducedIn) {
          // 上游新增文件的锚点：当前版本树没有该文件说明功能面尚未引入，跳过
          // （与 scripts/ncode-closure-impact.mjs 的 validate 语义一致）。
          return;
        }
        throw new Error(
          `锚点文件不存在：${anchor.file}（${anchor.section}）。上游移动或改名后沿当前调用链更新锚点登记，不得删除锚点。`,
        );
      }
      if (anchor.requiresPattern && !anchor.requiresPattern.test(content)) {
        // 机制尚未引入时主 pattern 不适用（与 impact 工具同语义）。
        return;
      }
      const matched = anchor.pattern.test(content);
      const expectation = anchor.kind === "require" ? matched : !matched;
      expect(
        expectation,
        `${anchor.section}：${anchor.kind === "require" ? "关闭接线缺失" : "已关闭入口回流"} — ${anchor.file} ${anchor.kind === "require" ? "应包含" : "不得包含"} /${anchor.pattern.source}/`,
      ).toBe(true);
    });
  }

  it("锚点登记覆盖 ncode-feature.md 全部关闭项章节", () => {
    const sections = new Set(NCODE_CLOSURE_ANCHORS.map((anchor) => anchor.section.split(" · ")[0]));
    expect([...sections].sort()).toEqual(["一、关闭功能", "二、定制修改"]);
  });

  it("分享装配锚点同时拦截工厂和构造器，不能再漏过 new 写法", () => {
    const anchor = NCODE_CLOSURE_ANCHORS.find(
      (item) =>
        item.section.endsWith("7 会话分享") && item.file === "packages/services/src/node.ts",
    );
    expect(anchor).toBeDefined();
    for (const source of [
      "createConversationShareService({})",
      "new ConversationShareService({})",
      "new ConversationShareHttpClient({})",
    ]) {
      expect(anchor!.pattern.test(source), source).toBe(true);
    }
    expect(anchor!.pattern.test("createUnsupportedConversationShareService({})")).toBe(false);
    expect(anchor!.pattern.test("getImportedConversation: readImportedConversation")).toBe(false);
  });
});
