import type { LocalTtftContext } from "@zcode/shared";

/**
 * Renderer-only send metadata used by the local TTFT observer.
 *
 * This deliberately contains no remote reporting fields. The command path can
 * keep carrying the local observation handle without recreating the removed
 * official telemetry payload.
 */
export interface LocalTtftSendSeed {
  localTtft?: LocalTtftContext;
}
