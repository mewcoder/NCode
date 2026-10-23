import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalHome = process.env.HOME;
const originalDataBaseDir = process.env.ZCODE_DATA_BASE_DIR;
const tempHomes: string[] = [];

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile), readdir: vi.fn(actual.readdir) };
});

async function createProviderFixture(prefix: string): Promise<string> {
  const home = await mkdtemp(join(tmpdir(), prefix));
  tempHomes.push(home);
  process.env.HOME = home;
  process.env.ZCODE_DATA_BASE_DIR = home;
  const filePath = join(home, "zcode-builtin.json");
  // 修复原因：只传 {} 会让后台 Provider 初始化读取 undefined 路径并写出错误日志。
  // 使用当前 Release 合同的空配置，让装配测试独立于真实用户配置和发布文件。
  await writeFile(
    filePath,
    JSON.stringify({
      schemaVersion: 1,
      revision: 1,
      config: {
        providerConfigRules: { templateRules: [], providerRules: [] },
        modelConfigRules: {
          modelRules: [],
          modelApiRules: [],
          providerSiteRules: [],
          templateModelRules: [],
          builtinProviderModelRules: [],
        },
      },
    }),
    "utf8",
  );
  return filePath;
}

describe("conversation share service composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 保留真实日志输出，同时让后台初始化错误也能使测试失败。
    vi.spyOn(console, "error");
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({ code: 0, data: { configs: {} } }),
    );
  });

  afterEach(async () => {
    try {
      for (const home of tempHomes.splice(0)) await rm(home, { recursive: true, force: true });
      expect(console.error).not.toHaveBeenCalled();
    } finally {
      if (originalHome === undefined) delete process.env.HOME;
      else process.env.HOME = originalHome;
      if (originalDataBaseDir === undefined) delete process.env.ZCODE_DATA_BASE_DIR;
      else process.env.ZCODE_DATA_BASE_DIR = originalDataBaseDir;
      vi.restoreAllMocks();
      vi.resetModules();
    }
  });

  it("本地 Host 使用分享关闭态，启动不读取分享索引或扫描目录，所有联网入口拒绝", async () => {
    const zcodeBuiltinProviderConfigFilePath = await createProviderFixture(
      "zcode-conversation-share-",
    );
    const [nodeModule, servicesModule] = await Promise.all([
      import("@zcode/services/node"),
      import("@zcode/services"),
    ]);

    const services = nodeModule.createLocalServices({ zcodeBuiltinProviderConfigFilePath });
    try {
      await expect(
        services.get(servicesModule.IModelSelectionService).getView(),
      ).resolves.toMatchObject({
        providers: [],
      });
      const service = services.get(servicesModule.IConversationShareService);
      expect(
        vi
          .mocked(readFile)
          .mock.calls.filter(([path]) => String(path).endsWith(".zcode-share-imports.json")),
      ).toEqual([]);
      expect(
        vi.mocked(readdir).mock.calls.filter(([path]) => String(path).endsWith(".zcode-share")),
      ).toEqual([]);
      const calls = [
        () => service.getCapabilities(),
        () => service.preflight({} as never),
        () => service.publish({} as never, "disabled-publish"),
        () => service.importShare({} as never, "disabled-import"),
        () => service.getPreview("disabled-share"),
        () => service.getContinuation({ shareCode: "disabled-share", clientRequestId: "disabled" }),
      ];
      for (const call of calls) {
        await expect(call()).rejects.toMatchObject({ kind: "feature_disabled" });
      }
      const publishProgress = vi.fn();
      const importProgress = vi.fn();
      const offPublish = service.onDynamicPublishProgress("disabled-publish")(publishProgress);
      const offImport = service.onDynamicImportProgress("disabled-import")(importProgress);
      offPublish.dispose();
      offImport.dispose();
      expect(publishProgress).not.toHaveBeenCalled();
      expect(importProgress).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      // 修复原因：同步 dispose 后删 HOME，会让尚未收口的初始化/释放任务晚到写日志，
      // 与 Vitest worker 关闭日志 RPC 竞争；先等待服务释放，再由 afterEach 清理目录。
      await nodeModule.disposeServiceResourcesAndWait(services);
    }
  });

  it("本地关闭态即使存在分享副本也不读取，且不删除用户数据", async () => {
    const zcodeBuiltinProviderConfigFilePath = await createProviderFixture(
      "zcode-conversation-share-readonly-",
    );
    const home = tempHomes.at(-1)!;
    const workspacePath = join(home, ".zcode", "workspace", "default");
    const importRoot = join(workspacePath, ".zcode-share", "existing-share");
    await mkdir(importRoot, { recursive: true });
    const filePath = join(importRoot, "shared-conversation.json");
    const content = JSON.stringify({
      formatVersion: 1,
      shareId: "existing-share",
      contextId: "existing-context",
      title: "Existing imported conversation",
      rows: [],
      artifacts: [],
    });
    await writeFile(filePath, content);
    const indexPath = join(workspacePath, ".zcode-share-imports.json");
    await writeFile(indexPath, "{}");
    const markerPath = join(importRoot, ".zcode-share-import.json");
    await writeFile(markerPath, "{}");
    const [nodeModule, servicesModule] = await Promise.all([
      import("@zcode/services/node"),
      import("@zcode/services"),
    ]);
    const services = nodeModule.createLocalServices({ zcodeBuiltinProviderConfigFilePath });
    try {
      await services.get(servicesModule.IModelSelectionService).getView();
      const service = services.get(servicesModule.IConversationShareService);
      await expect(
        service.getImportedConversation({ workspacePath, contextId: "existing-context" }),
      ).resolves.toBeNull();
      await expect(
        service.getImportedConversation({ workspacePath, contextId: "missing-context" }),
      ).resolves.toBeNull();
      expect(vi.mocked(readFile).mock.calls.filter(([path]) => String(path) === indexPath)).toEqual(
        [],
      );
      expect(
        vi.mocked(readFile).mock.calls.filter(([path]) => String(path) === markerPath),
      ).toEqual([]);
      expect(vi.mocked(readFile).mock.calls.filter(([path]) => String(path) === filePath)).toEqual(
        [],
      );
      expect(
        vi.mocked(readdir).mock.calls.filter(([path]) => String(path).endsWith(".zcode-share")),
      ).toEqual([]);
      expect(await readFile(filePath, "utf8")).toBe(content);
      expect(await readFile(markerPath, "utf8")).toBe("{}");
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      await nodeModule.disposeServiceResourcesAndWait(services);
    }
  });

  it("keeps desktop-attached remote hosts behind the publishing boundary", async () => {
    const zcodeBuiltinProviderConfigFilePath = await createProviderFixture(
      "zcode-conversation-share-remote-",
    );
    const [nodeModule, servicesModule] = await Promise.all([
      import("@zcode/services/node"),
      import("@zcode/services"),
    ]);

    const services = nodeModule.createLocalServices({
      zcodeBuiltinProviderConfigFilePath,
      serviceAuthorityMode: "desktop-attached-remote",
    });
    try {
      await expect(
        services.get(servicesModule.IModelSelectionService).getView(),
      ).resolves.toMatchObject({
        providers: [],
      });
      await expect(
        services.get(servicesModule.IConversationShareService).getCapabilities(),
      ).rejects.toMatchObject({ kind: "feature_disabled" });
    } finally {
      await nodeModule.disposeServiceResourcesAndWait(services);
    }
  });
});
