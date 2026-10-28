import { NCODE_FEATURE_POLICY } from "@zcode/shared";
import { withPluginTelemetry } from "@zcode/services";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServices } from "@/hooks/useServices.js";
import { useScopedPluginManagementStore } from "@/store/pluginManagementStore.js";
import {
  buildStoreItems,
  isItemBusy,
  type StorePluginItem,
} from "@/settings/pluginStoreListing.js";
import { logger } from "@/logger.js";

/** NCode 只投影已安装清单；插件管理 store 是安装和启停状态的唯一所有者。 */
export function useInstalledUiPlugins(target: {
  workspacePath: string;
  workspaceIdentity?: string;
  sessionId: string | null;
  remoteSessionId?: string | null;
}) {
  const { pluginManagementService: service, pluginUiBridgeService: bridge } = useServices();
  const enabled = target.sessionId !== null && NCODE_FEATURE_POLICY.pluginPanels === "installed";
  const store = useScopedPluginManagementStore(service, "inventory-only");
  const state = store();
  const key = JSON.stringify([
    target.workspacePath,
    target.workspaceIdentity?.trim() || target.workspacePath,
    target.sessionId,
    target.remoteSessionId,
  ]);
  const context = useMemo(() => ({ key, service }), [key, service]);
  const current = useRef<typeof context | null>(context);
  current.current = context;
  const [ready, setReady] = useState<typeof context>();
  const [failure, setFailure] = useState<{
    context: typeof context;
    message: string;
  }>();
  useEffect(() => {
    let active = true;
    current.current = context;
    setReady(undefined);
    if (service && enabled) {
      void store
        .getState()
        .initialize({
          workspacePath: target.workspacePath,
          workspaceIdentity: target.workspaceIdentity,
          pluginService: service,
        })
        .then(() => {
          if (active) setReady(context);
        });
    }
    return () => {
      active = false;
      current.current = null;
    };
  }, [context, service, store, target.workspaceIdentity, target.workspacePath, enabled]);
  const items = enabled && ready === context ? buildStoreItems(state) : [];
  // 远端推荐会漏掉个人/开发安装，还会展示未安装插件；以实际安装清单派生全部面板。
  const seen = new Set<string>();
  const entries = items.flatMap((item) => {
    if (!item.installed || item.info?.packageStatus === "missing") return [];
    return (item.info?.uiSurfaces ?? []).flatMap((surface) => {
      const key = JSON.stringify([item.id, surface.id]);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ pluginId: item.id, surfaceId: surface.id, item }];
    });
  });
  const isCurrent = () => current.current === context;
  const prepare = async (item: StorePluginItem) => {
    // 读取 store 的即时状态，同插件重复点击被拦截，其他插件不受影响。
    if (!isCurrent() || !service || isItemBusy(item, store.getState())) return;
    // 卸载与点击可能相邻发生，必须从唯一 store 确认仍已安装，不能用旧入口触发安装。
    const installed = store.getState().plugins.find((plugin) => plugin.id === item.id);
    if (!installed || installed.packageStatus === "missing") return;
    setFailure(undefined);
    try {
      const management = store.getState();
      const operationService = withPluginTelemetry(service, {
        entry: "recommended_ui",
        client_kind: "desktop",
      });
      const succeeded = await management.setEnabled(item.id, true, operationService, "workspace");
      if (!succeeded) {
        const message = store.getState().error;
        if (message && isCurrent()) setFailure({ context, message });
        return;
      }
      // 成功只刷新安装/启用态，不替用户打开面板；旧目标完成也不能打开新会话。
    } catch (error) {
      if (isCurrent()) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn("[plugin-ui] 已安装插件启用失败", { pluginId: item.id, message });
        setFailure({ context, message });
      }
    }
  };
  const resolveSurface = async (pluginId: string, surfaceId: string) => {
    if (!bridge) return null;
    try {
      const surfaces = await bridge.listSurfaces({
        workspacePath: target.workspacePath,
        workspaceIdentity: target.workspaceIdentity,
      });
      if (!isCurrent()) return undefined;
      // 查询在途时可能已卸载/暂停；运行时旧响应不能越过当前安装事实重新打开面板。
      const installed = store.getState().plugins.find((plugin) => plugin.id === pluginId);
      if (
        !installed?.enabled ||
        installed.packageStatus === "missing" ||
        !installed.uiSurfaces?.some((surface) => surface.id === surfaceId)
      )
        return null;
      return (
        surfaces.find((surface) => surface.pluginId === pluginId && surface.id === surfaceId) ??
        null
      );
    } catch (error) {
      if (!isCurrent()) return undefined;
      logger.warn("[plugin-ui] 已安装面板读取失败", { pluginId, message: String(error) });
      return null;
    }
  };
  return {
    entries,
    loading: enabled && Boolean(service) && ready !== context,
    resolveSurface,
    prepare,
    isBusy: (item: StorePluginItem) => isItemBusy(item, state),
    error: failure?.context === context ? failure.message : null,
  };
}
