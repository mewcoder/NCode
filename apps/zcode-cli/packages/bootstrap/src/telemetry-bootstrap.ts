import {
  shutdownPreparedModelTelemetry,
  type PrepareModelTelemetryOptions,
} from "@zcode/telemetry";

/**
 * NCode CLI 入口剥离遥测环境，不初始化遥测 Owner 或生成设备标识。
 */
export async function prepareZCodeTelemetryEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: PrepareModelTelemetryOptions = {},
): Promise<NodeJS.ProcessEnv> {
  // NCode 不创建模型遥测 Owner，也不向工具子进程传播上报配置。
  void options;
  return {
    ...Object.fromEntries(
      Object.entries(env).filter(
        ([key]) => !key.startsWith("OTEL_") && !key.startsWith("ZCODE_TELEMETRY_"),
      ),
    ),
    ZCODE_MODEL_TELEMETRY_ENABLED: "0",
  };
}

/**
 * 与 prepareZCodeTelemetryEnv 对称地关闭当前进程持有的 Telemetry Owner。
 * 单个 App/Session 只允许 flush；只有最外层可执行入口可以调用本函数。
 */
export async function shutdownZCodeTelemetry(): Promise<void> {
  await shutdownPreparedModelTelemetry();
}
