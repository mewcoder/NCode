# NCode 桌面构建期能力

ARMS RUM、事件上报和应用内自动更新在 NCode 中固定关闭。

`scripts/build-time-config.mjs` 返回空上报端点及 `autoUpdateEnabled: false`，不读取环境变量或私有默认文件。Desktop tsup/vite 将结果通过既有 define 交给 Main、Host、Renderer；运行时读取共享常量，不另设启用开关。CLI 准备环境时移除 `OTEL_*`、`ZCODE_TELEMETRY_*` 并设置 `ZCODE_MODEL_TELEMETRY_ENABLED=0`。

详细范围和页面验收见根目录 [ncode-feature.md](../../ncode-feature.md)。

运行 `node --test scripts/test/build-time-config.test.mjs` 验证：无配置、存在私有配置、环境变量启用及无效私有文件时均保持关闭；define 仍使用 JSON 字面量。
