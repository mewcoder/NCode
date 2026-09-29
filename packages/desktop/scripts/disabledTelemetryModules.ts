// NCode disables desktop telemetry; tsup aliases the vendor SDKs here so they stay out of app.asar.
const noop = () => undefined;

const armsRum = {
  client: { useReporter: noop },
  getConfig: () => ({ env: "local" }),
  init: async () => undefined,
  sendCustom: noop,
  sendEvent: noop,
  setConfig: noop,
};

export default armsRum;

export const SpanKind = { INTERNAL: 0 };
export const SpanStatusCode = { ERROR: 2, OK: 1, UNSET: 0 };
export const TraceFlags = { SAMPLED: 1 };
export const AggregationTemporality = { DELTA: 1 };
export const AggregationType = { EXPLICIT_BUCKET_HISTOGRAM: "explicit_bucket_histogram" };
export const InstrumentType = { COUNTER: 1, HISTOGRAM: 0 };

export function resourceFromAttributes(attributes: Record<string, unknown>) {
  return { attributes };
}

export class MeterProvider {
  getMeter() {
    return {
      createCounter: () => ({ add: noop }),
      createHistogram: () => ({ record: noop }),
    };
  }

  forceFlush() {
    return Promise.resolve();
  }

  shutdown() {
    return Promise.resolve();
  }
}

export class PeriodicExportingMetricReader {}

export class OTLPMetricExporter {
  export(_metrics: unknown, callback: (result: { code: number }) => void) {
    callback({ code: 1 });
  }

  forceFlush() {
    return Promise.resolve();
  }

  shutdown() {
    return Promise.resolve();
  }
}

export class OTLPTraceExporter extends OTLPMetricExporter {}
