/** 纯本地策略，无 IO、进程或服务依赖；与架构登记同步。 */
export const ncodeFeaturePolicyModule = {
  id: "ncode-feature-policy",
  requires: [],
  provides: ["ncode-feature-policy"],
  publicEntrypoints: ["index.ts", "contract.ts", "policy.js"],
} as const;
