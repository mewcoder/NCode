import { NCODE_FEATURE_POLICY } from "../packages/shared/src/ncode-feature-policy/policy.js";

/** 构建与 Runtime 使用同一份本地策略，不读取环境变量或私有远端配置。 */
export async function resolveBuildTimeConfig() {
  return { ...NCODE_FEATURE_POLICY.build };
}

export function createBuildTimeConfigDefines(config) {
  return {
    __ZCODE_ARMS_RUM_ENDPOINT__: JSON.stringify(config.armsRumEndpoint),
    __ZCODE_TELEMETRY_REPORT_ENDPOINT__: JSON.stringify(config.telemetryReportEndpoint),
    __ZCODE_AUTO_UPDATE_ENABLED__: JSON.stringify(config.autoUpdateEnabled),
  };
}
