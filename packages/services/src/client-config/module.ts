/** NCode 本地客户端配置；与 architecture-policy.yaml 同步。 */
export const clientConfigModule = {
  id: "client-config",
  requires: ["services", "shared"],
  provides: ["client-config"],
  publicEntrypoints: ["contract.ts", "clientConfig.ts", "clientConfigService.ts"],
} as const;
