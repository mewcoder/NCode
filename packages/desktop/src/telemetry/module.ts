export const desktopTelemetryModule = {
  id: "desktop-telemetry",
  requires: ["shared"],
  provides: ["desktop-telemetry"],
  publicEntrypoints: ["index.ts", "contract.ts"],
} as const;
