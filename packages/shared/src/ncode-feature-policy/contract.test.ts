import { expect, it } from "vitest";
import { NCODE_FEATURE_POLICY } from "./contract.js";

it("各进程共享不可变策略，不能由运行时修改开启请求或污染默认快照", () => {
  expect(() => Object.assign(NCODE_FEATURE_POLICY, { remoteClientConfigs: true })).toThrow();
  expect(() => Object.assign(NCODE_FEATURE_POLICY.build, { autoUpdateEnabled: true })).toThrow();
  expect(() =>
    Object.assign(NCODE_FEATURE_POLICY.clientConfigDefaults.uiPluginRecommendations, {
      0: { pluginId: "injected", surfaceId: "main" },
    }),
  ).toThrow();
  expect(NCODE_FEATURE_POLICY.remoteClientConfigs).toBe(false);
  expect(NCODE_FEATURE_POLICY.clientConfigDefaults.pluginStoreOrder).toBeNull();
});
