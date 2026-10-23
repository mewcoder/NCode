import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  NCODE_CLOSED_E2E_NAME_PATTERNS,
  NCODE_CLOSED_E2E_SPECS,
  isNcodeClosedE2ESpec,
} from "../scripts/ncode-e2e-baseline.mjs";
import { listDefaultFormalE2ESpecs } from "../scripts/run-windows-e2e-shards.mjs";

const desktopDir = resolve(process.cwd(), "packages/desktop");
const execFileAsync = promisify(execFile);

function listFormalSpecs(env: Record<string, string | undefined> = {}) {
  return listDefaultFormalE2ESpecs(desktopDir, env);
}

describe("NCode E2E 基线清单", () => {
  it.each(["ncode-help-menu-retained", "ncode-workflow-policy"])(
    "正式用例 %s 进入默认集合并通过标准 case-local 合同校验",
    async (caseName) => {
      const spec = `./test/e2e/ncode/${caseName}.test.ts`;
      expect(listFormalSpecs()).toContain(spec);
      expect(listFormalSpecs()).not.toContain(
        `./test/e2e/ncode/manual-review/pending/${caseName}.test.ts`,
      );
      const { stdout } = await execFileAsync(process.execPath, [
        join(desktopDir, "scripts/check-e2e-fixtures.mjs"),
        "--spec",
        join(desktopDir, spec),
      ]);
      expect(stdout).toContain(`Case: ${caseName}`);
      expect(stdout).toContain("Fixture check passed");
      expect(stdout).toContain(join("fixtures", "cases", "ncode", `${caseName}.json`));
    },
  );

  it("清单条目必须对应磁盘上真实存在的正式 spec", () => {
    const missing = NCODE_CLOSED_E2E_SPECS.filter(
      (entry) => !existsSync(join(desktopDir, entry.spec)),
    ).map((entry) => entry.spec);
    expect(
      missing,
      "上游删除或改名后需同步清理清单（docs/ncode-closure-regression.spec.md）",
    ).toEqual([]);
  });

  it("清单 spec 不进入默认正式集合，即使提供 SSH 环境（NCode 无条件关闭远程工作区）", () => {
    const defaultSpecs = new Set(listFormalSpecs());
    const withSshSpecs = new Set(listFormalSpecs({ ZCODE_E2E_SSH_HOST: "h" }));
    const leaked = NCODE_CLOSED_E2E_SPECS.filter(
      (entry) => defaultSpecs.has(entry.spec) || withSshSpecs.has(entry.spec),
    ).map((entry) => entry.spec);
    expect(leaked).toEqual([]);
  });

  it("保留 spec 仍进入默认正式集合，排除没有误伤", () => {
    const defaultSpecs = listFormalSpecs();
    // smoke 与防御性引用 onboarding helper 的 spec 属于保留基线。
    expect(defaultSpecs).toContain("./test/e2e/smoke.test.ts");
    expect(defaultSpecs).toContain(
      "./test/e2e/conversation-session/conversation-session-guarded.test.ts",
    );
    // highspeed 指示默认关闭属于断言关闭态的保留 spec。
    expect(defaultSpecs).toContain(
      "./test/e2e/conversation-session/conversation-session-v4-composer-toolbar.test.ts",
    );
  });

  it("文件名命中关闭项特征的正式 spec 必须已登记（漂移检测）", () => {
    // listDefaultFormalE2ESpecs 已过滤清单条目；仍命中特征模式的即为未登记的漏网 spec。
    const unregistered = listFormalSpecs().filter((spec) =>
      NCODE_CLOSED_E2E_NAME_PATTERNS.some((pattern) => pattern.test(spec)),
    );
    expect(
      unregistered,
      "上游新增同类 spec 需评估是否登记进 NCODE_CLOSED_E2E_SPECS 或调整特征模式",
    ).toEqual([]);
  });

  it("isNcodeClosedE2ESpec 兼容 Windows 路径分隔符", () => {
    expect(isNcodeClosedE2ESpec("./test/e2e/off-peak-create-manage.test.ts")).toBe(true);
    expect(isNcodeClosedE2ESpec(".\\test\\e2e\\off-peak-create-manage.test.ts")).toBe(true);
    expect(isNcodeClosedE2ESpec("./test/e2e/smoke.test.ts")).toBe(false);
  });
});
