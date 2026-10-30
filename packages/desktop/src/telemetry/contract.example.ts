import { createDisabledTelemetrySink } from "./index.js";

export async function disabledTelemetryExample(): Promise<false> {
  const sink = createDisabledTelemetrySink();
  const admitted = sink.enqueue({ sequence: 1 });
  await sink.shutdown();
  return admitted;
}
