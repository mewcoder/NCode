/** SDK 仅用于现有上报器的类型检查及显式启用的回归夹具，不进入 NCode 运行时。 */
export type DesktopRumClient = (typeof import("@arms/rum-electron"))["default"];

/** 关闭出口不持有批次或导出器，不创建定时器。 */
export interface DisabledTelemetrySink {
  enqueue(batch: unknown): false;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}
