import { ZCODE_TELEMETRY_ENABLED, type TelemetryRendererContext } from "@zcode/shared";

interface AppTelemetryBridge {
  syncTelemetryContext(context: TelemetryRendererContext): void;
}

interface AppTelemetryBridgeDependencies {
  bridge: AppTelemetryBridge;
  createRendererContext: () => TelemetryRendererContext;
}

export function syncAppTelemetryContext({
  bridge,
  createRendererContext,
}: AppTelemetryBridgeDependencies): void {
  if (!ZCODE_TELEMETRY_ENABLED) return;
  bridge.syncTelemetryContext(createRendererContext());
}
