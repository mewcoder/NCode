import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";

/**
 * 修复原因：8276d4a7 引入 policy.js 时没有配对的 policy.d.ts，而 `@zcode/shared` 的 exports 指向
 * `src/index.ts`；未开启 allowJs 的下游（apps/zcode-cli/packages/contracts）直接编译 shared 源码树，
 * 解析 `./policy.js` 报 TS7016，中断 agent-cli 构建与桌面 dev。根 typecheck 只覆盖 packages/ 与
 * apps/dev-docs，verify:pre-push 也不含 typecheck，两条链都不经过 CLI，所以问题直到实际启动才暴露。
 * 修复依据：docs/ncode-local-client-config.spec.md「统一本地功能策略」与验收场景 NC-CFG-09。
 *
 * 守卫的不变量：字段路径集合完全一致，且 policy.js 的每个取值都落在 policy.d.ts 声明的字面量集合内。
 * 不比对原始文本相等——d.ts 对枚举字段声明的是取值集合（如 "disabled" | "onDemand"），JS 存的是当前
 * 选中的单个值。只改 JS 不改声明、或声明多写/漏写字段都会失败，不依赖人工记忆对齐。
 */

const policyUrl = (name: string) => new URL(`../src/ncode-feature-policy/${name}`, import.meta.url);

/** 去掉注释后，取最外层对象字面量的花括号内容。 */
function objectBody(source: string): string {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const start = code.indexOf("{");
  if (start < 0) throw new Error("未找到对象字面量");
  let depth = 0;
  for (let i = start; i < code.length; i += 1) {
    const char = code[i];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return code.slice(start + 1, i);
    }
  }
  throw new Error("对象字面量花括号未闭合");
}

/** 按同层分隔符切分条目；括号、花括号内部的逗号/分号不参与切分。 */
function splitEntries(body: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "{" || char === "(" || char === "[") depth += 1;
    else if (char === "}" || char === ")" || char === "]") depth -= 1;
    if ((char === "," || char === ";") && depth === 0) {
      if (current.trim()) entries.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) entries.push(current.trim());
  return entries;
}

/** 递归展开成 `路径 -> 取值文本`，只保留叶子；容器（值中含嵌套对象）由叶子覆盖，不重复登记。 */
function leafPaths(
  source: string,
  prefix = "",
  out = new Map<string, string>(),
): Map<string, string> {
  for (const entry of splitEntries(objectBody(source))) {
    const separator = entry.indexOf(":");
    if (separator < 0) throw new Error(`条目缺少键名：${entry}`);
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    const path = prefix ? `${prefix}.${key}` : key;
    if (value.includes("{")) leafPaths(value, path, out);
    else out.set(path, value);
  }
  return out;
}

async function readLeaves(name: string): Promise<Map<string, string>> {
  return leafPaths(await readFile(policyUrl(name), "utf8"));
}

it("policy.d.ts 与 policy.js 字段路径集合一致，缺失或多余字段都会让下游类型失真", async () => {
  const js = await readLeaves("policy.js");
  const dts = await readLeaves("policy.d.ts");
  expect([...dts.keys()].sort()).toEqual([...js.keys()].sort());
});

it("policy.js 的每个取值都落在 policy.d.ts 声明的字面量集合内", async () => {
  const js = await readLeaves("policy.js");
  const dts = await readLeaves("policy.d.ts");
  for (const [path, value] of js) {
    const declared = dts.get(path);
    expect(declared, `policy.d.ts 缺少 ${path}`).toBeDefined();
    // 冻结空数组：JS 写 Object.freeze([])，声明用 readonly never[] 表示不可追加元素。
    if (value === "Object.freeze([])") {
      expect(declared, `${path} 应声明为 readonly never[]`).toBe("readonly never[]");
      continue;
    }
    const literals = [...(declared as string).matchAll(/"[^"]*"|\bfalse\b|\btrue\b|\bnull\b/g)].map(
      (match) => match[0],
    );
    // 声明没有字面量集合时按单值相等比较（例如 string 类型标注不该出现在本模块）。
    if (literals.length === 0) {
      expect(declared, `${path} 的声明必须可比较`).toBe(value);
      continue;
    }
    expect(literals, `${path} 的 JS 取值不在声明集合内`).toContain(value);
  }
});

it("策略入口仍是冻结的 JS 常量，未回退成 TS 源文件而破坏构建脚本免构建导入", async () => {
  const js = await readFile(policyUrl("policy.js"), "utf8");
  const dts = await readFile(policyUrl("policy.d.ts"), "utf8");
  expect(js).toContain("export const NCODE_FEATURE_POLICY = Object.freeze({");
  expect(dts).toContain("export const NCODE_FEATURE_POLICY: Readonly<{");
});
