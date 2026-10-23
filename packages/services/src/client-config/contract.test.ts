import { describe, expect, it, vi } from "vitest";
import { createClientConfigService, IClientConfigService } from "./contract.js";
import { clientConfigModule } from "./module.js";

describe("NCode client-config contract", () => {
  it("保持 RPC 描述符并允许在没有 endpoint/网络能力时完成强刷", async () => {
    const unavailable = vi.fn(() => {
      throw new Error("无外部能力");
    });
    const service = createClientConfigService({
      apiClient: { request: unavailable },
      resolveRequestContext: unavailable,
    });
    expect(await service.getSnapshot({ forceRefresh: true })).toEqual({
      pluginStoreOrder: null,
      zsrcUrl: null,
      uiPluginRecommendations: [],
    });
    expect(unavailable).not.toHaveBeenCalled();
    expect(IClientConfigService.channelName).toBeTruthy();
    expect(clientConfigModule.id).toBe("client-config");
  });
});
