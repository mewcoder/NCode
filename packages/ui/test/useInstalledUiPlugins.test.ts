// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useInstalledUiPlugins } from "@/plugin-ui/adapters/useInstalledUiPlugins.js";
import { notifyPluginManagementChange } from "@/store/pluginManagementStoreLoading.js";

const context = vi.hoisted(() => ({ services: {} as Record<string, unknown> }));
vi.mock("@/hooks/useServices.js", () => ({ useServices: () => context.services }));
vi.mock("@/logger.js", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "panel@personal";
const surfaces = ["main", "secondary", "main"].map((id) => ({
  id,
  title: id,
  server: "plugin:panel:server",
  resourceUri: `ui://panel/${id}.html`,
}));
function setup() {
  let enabled = false;
  const plugin = () => ({
    id,
    name: "panel",
    marketplace: "personal",
    enabled,
    uiSurfaces: surfaces,
  });
  const service = {
    listPlugins: vi.fn(async () => ({ plugins: [plugin()], diagnostics: [] })),
    getPluginsOverview: vi.fn(async () => ({
      marketplaces: [],
      availablePlugins: [
        {
          id: "uninstalled@personal",
          name: "uninstalled",
          marketplace: "personal",
          installed: false,
        },
      ],
      installedPlugins: [],
      restorableBuiltins: [],
      diagnostics: [],
    })),
    installPlugin: vi.fn(),
    restoreBuiltin: vi.fn(),
    setPluginEnabled: vi.fn(async () => {
      enabled = true;
      return { diagnostics: [] };
    }),
  };
  const getSnapshot = vi.fn(async () => {
    throw new Error("不应读取远端推荐");
  });
  context.services = {
    pluginManagementService: service,
    skillsService: {},
    clientConfigService: { getSnapshot },
  };
  return { service, getSnapshot };
}
const target = { workspacePath: "/workspace/a", workspaceIdentity: "identity-a", sessionId: "s" };
it("个人/孤立已安装插件的多面板去重，不读推荐；暂停可启用", async () => {
  const { service, getSnapshot } = setup();
  const { result } = renderHook(() => useInstalledUiPlugins(target));
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  expect(result.current.entries.map(({ surfaceId }) => surfaceId)).toEqual(["main", "secondary"]);
  expect(result.current.entries.every(({ item }) => item.installed)).toBe(true);
  await act(async () => result.current.prepare(result.current.entries[0]!.item));
  expect(service.setPluginEnabled).toHaveBeenCalledWith(
    expect.objectContaining({ workspaceIdentity: "identity-a", scope: "workspace", enabled: true }),
  );
  expect(result.current.entries[0]!.item.info?.enabled).toBe(true);
  expect(service.installPlugin).not.toHaveBeenCalled();
  expect(getSnapshot).not.toHaveBeenCalled();
});
it("未安装、缺包、待恢复没有入口，卸载后随 store 更新移除", async () => {
  const { service } = setup();
  const { result } = renderHook(() => useInstalledUiPlugins(target));
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  service.listPlugins.mockResolvedValue({
    plugins: [
      {
        id,
        name: "panel",
        marketplace: "personal",
        enabled: false,
        packageStatus: "missing",
        uiSurfaces: surfaces,
      },
    ],
  } as never);
  const refresh = () =>
    notifyPluginManagementChange({
      workspacePath: target.workspacePath,
      workspaceIdentity: target.workspaceIdentity,
      authorityKey: null,
      scope: "workspace",
    });
  act(refresh);
  await waitFor(() => expect(result.current.entries).toEqual([]));
  service.listPlugins.mockResolvedValue({ plugins: [], diagnostics: [] });
  act(refresh);
  await waitFor(() => expect(result.current.entries).toEqual([]));
});
it("重复启用只写一次，失败保留入口并可重试", async () => {
  const { service } = setup();
  const pending = Promise.withResolvers<{ diagnostics: [] }>();
  service.setPluginEnabled.mockReturnValueOnce(pending.promise);
  const { result } = renderHook(() => useInstalledUiPlugins(target));
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  const item = result.current.entries[0]!.item;
  let first!: Promise<void>;
  act(() => {
    first = result.current.prepare(item);
    void result.current.prepare(item);
  });
  expect(service.setPluginEnabled).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.reject(new Error("denied"));
    await first;
  });
  expect(result.current.error).toBe("denied");
  await act(async () => result.current.prepare(item));
  expect(result.current.entries[0]!.item.info?.enabled).toBe(true);
});
it("切换会话后迟到面板不能打开新目标，包括切回原会话", async () => {
  setup();
  const pending = Promise.withResolvers<never[]>();
  context.services.pluginUiBridgeService = {
    listSurfaces: vi.fn().mockReturnValue(pending.promise),
  };
  const { result, rerender } = renderHook(
    ({ sessionId }) => useInstalledUiPlugins({ ...target, sessionId }),
    { initialProps: { sessionId: "old" } },
  );
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  const request = result.current.resolveSurface(id, "main");
  rerender({ sessionId: "new" });
  expect(result.current.entries).toEqual([]);
  rerender({ sessionId: "old" });
  await act(async () => pending.resolve([]));
  expect(await request).toBeUndefined();
});
it("服务切换隔离旧错误，草稿不加载面板", async () => {
  const { service: old } = setup();
  const pending = Promise.withResolvers<{ diagnostics: [] }>();
  old.setPluginEnabled.mockReturnValueOnce(pending.promise);
  const { result, rerender } = renderHook(
    ({ sessionId }) => useInstalledUiPlugins({ ...target, sessionId }),
    { initialProps: { sessionId: "s" as string | null } },
  );
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.prepare(result.current.entries[0]!.item);
  });
  const { service: next } = setup();
  rerender({ sessionId: "s" });
  expect(result.current.entries).toEqual([]);
  await waitFor(() => expect(next.getPluginsOverview).toHaveBeenCalled());
  await act(async () => {
    pending.reject(new Error("old failure"));
    await operation;
  });
  expect(result.current.error).toBeNull();
  next.listPlugins.mockClear();
  rerender({ sessionId: null });
  expect(result.current.entries).toEqual([]);
  expect(result.current.loading).toBe(false);
  expect(next.listPlugins).not.toHaveBeenCalled();
});

it("面板查询在途期间卸载，迟到的有效运行时响应也不能打开", async () => {
  const { service } = setup();
  const pending = Promise.withResolvers<unknown[]>();
  context.services.pluginUiBridgeService = {
    listSurfaces: vi.fn().mockReturnValue(pending.promise),
  };
  const { result } = renderHook(() => useInstalledUiPlugins(target));
  await waitFor(() => expect(result.current.entries).toHaveLength(2));
  await act(async () => result.current.prepare(result.current.entries[0]!.item));
  const request = result.current.resolveSurface(id, "main");
  service.listPlugins.mockResolvedValue({ plugins: [], diagnostics: [] });
  act(() =>
    notifyPluginManagementChange({
      workspacePath: target.workspacePath,
      workspaceIdentity: target.workspaceIdentity,
      authorityKey: null,
      scope: "workspace",
    }),
  );
  await waitFor(() => expect(result.current.entries).toEqual([]));
  await act(async () => pending.resolve([{ ...surfaces[0], pluginId: id }]));
  expect(await request).toBeNull();
  expect(service.installPlugin).not.toHaveBeenCalled();
});
