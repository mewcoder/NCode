/** NCode 构建期固定关闭遥测与应用内更新，运行时统一读取这些 define。 */
export async function resolveBuildTimeConfig() {
  return {
    armsRumEndpoint: "",
    telemetryReportEndpoint: "",
    autoUpdateEnabled: false,
  };
}

export function createBuildTimeConfigDefines(config) {
  return {
    __ZCODE_ARMS_RUM_ENDPOINT__: JSON.stringify(config.armsRumEndpoint),
    __ZCODE_TELEMETRY_REPORT_ENDPOINT__: JSON.stringify(config.telemetryReportEndpoint),
    __ZCODE_AUTO_UPDATE_ENABLED__: JSON.stringify(config.autoUpdateEnabled),
  };
}
