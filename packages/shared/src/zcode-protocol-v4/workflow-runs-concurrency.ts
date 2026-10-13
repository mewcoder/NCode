// ============================================================
// workflowRuns 归约里的自适应并发部分
// ============================================================
// 从 workflow-runs-reducer.ts 拆出（max-lines 门）：主归约只剩 switch 的分派，
// `concurrency-changed` 的规则住在这里。与主归约同一条纪律：纯函数、无时钟——事件上的
// `cooldownMs` 是相对量，deadline 由 UI 按收到状态的时刻推算。

import {
  WORKFLOW_RUNS_LIMITS,
  type WorkflowRunConcurrency,
  type WorkflowRunState,
} from "./workflow-runs.js";

/** 桶空闲重置回默认并发；不是冷却，收到即清掉旧的 cooldown。 */
const CONCURRENCY_IDLE_RESET_REASON = "idle_reset";

/**
 * `concurrency-changed` → `run.concurrency`。
 * `ceiling` 优先取 run-started 记录的默认并发 `run.concurrencyCeiling`。
 * 新版共享桶可增长到默认值之上，历史 previous/next 最大值不能代替默认并发；
 * 仅对不发该字段的旧 CLI，才从只降不升的桶读数推导退路。
 * Retry-After 可附带 cooldownMs，idle_reset 清掉冷却；无合法 next 时保留原状态。
 * `limit` 是用户为本 run 设置的界，与共享桶涨落无关，始终原样保留。
 */
export function reduceConcurrencyChanged(
  run: WorkflowRunState,
  payload: Record<string, unknown>,
): WorkflowRunState {
  const next = positiveInteger(payload.next);
  if (next === undefined) return run;
  const previous = positiveInteger(payload.previous) ?? next;
  const ceiling = run.concurrencyCeiling ?? Math.max(run.concurrency?.ceiling ?? 0, previous, next);
  const key = nonEmptyString(payload.key);
  const limit = run.concurrency?.limit;
  const cooldownMs =
    payload.reason === CONCURRENCY_IDLE_RESET_REASON
      ? undefined
      : nonNegativeInteger(payload.cooldownMs);
  const concurrency: WorkflowRunConcurrency = {
    ...(key === undefined || key.length > WORKFLOW_RUNS_LIMITS.maxConcurrencyKeyLength
      ? {}
      : { key }),
    cap: next,
    ceiling,
    ...(limit === undefined ? {} : { limit }),
    ...(cooldownMs === undefined ? {} : { cooldownMs }),
  };
  return { ...run, concurrency };
}

/**
 * `run-started` → `run.concurrency.limit`：本 run **自己的**那条界。载荷带引擎的
 * `caps.maxConcurrency` 与 CLI 在铸载荷那一刻算出的 `concurrencyCeiling`（天花板是进程事实，
 * 不是引擎事实，所以它由 CLI 拼进载荷，与 `resumedFrom` 同一先例）。
 *
 * 只在 `maxConcurrency !== ceiling` 时记：跑在天花板上的 run 与从前逐字节相同，一个键都不多。
 * 老 CLI 不发 `concurrencyCeiling`，读不出天花板就无从判断这个 run 是否被压低——什么都不改。
 *
 * 共享桶那一侧（`cap` / `key` / `cooldownMs`）原样留着：resume 会为同一个 runId 再发一条
 * `run-started`，而那时进程里很可能已经学到了一个被限流压低的 cap，用天花板把它盖掉就是把
 * 读数抬回一个假值。显式 `concurrencyCeiling` 优先于共享桶历史读数。
 */
export function reduceRunStartedConcurrency(
  run: WorkflowRunState,
  payload: Record<string, unknown>,
): WorkflowRunState {
  const limit = positiveInteger(plainRecord(payload.caps)?.maxConcurrency);
  const readCeiling = positiveInteger(payload.concurrencyCeiling);
  const ceiling =
    readCeiling !== undefined && readCeiling <= WORKFLOW_RUNS_LIMITS.maxConcurrencyCeiling
      ? readCeiling
      : undefined;
  // 默认并发独立保存在 run 上：等于默认值的 run 可能没有 concurrency 投影。
  // 老事件未携带该字段时保留已知值。
  const withCeiling =
    ceiling === undefined || run.concurrencyCeiling === ceiling
      ? run
      : { ...run, concurrencyCeiling: ceiling };
  if (limit === undefined || ceiling === undefined || limit === ceiling) return withCeiling;
  const existing = withCeiling.concurrency;
  const concurrency: WorkflowRunConcurrency = {
    // 没有共享桶读数时，cap 从默认并发起步——桶从该默认值开始（同 reduceConcurrencyChanged
    // 推导 ceiling 的那条依据）。
    ...(existing ?? { cap: ceiling }),
    ceiling,
    limit,
  };
  return { ...withCeiling, concurrency };
}

/**
 * `run-caps-changed` → `run.concurrency.limit`：run **在飞时**它自己的那条界被改了。只改 `max_concurrency` 的修订就地生效——不停这次 run、
 * 不另起一次——引擎改完 caps 发这条事件，载荷与 `run-started` 同形（引擎的 `caps.maxConcurrency`
 * 加 CLI 拼进来的 `concurrencyCeiling`）。所以这里与 `reduceRunStartedConcurrency` 读同两个字段、
 * 守同一条「只在不等于天花板时记」：同一个数经两条路进来不能得出两份读数。
 *
 * 天花板按「载荷 → 本 run 已知值」取。它是进程的默认并发，`run-started` 已经把它记在
 * `run.concurrencyCeiling` 上了，所以这条事件比 `run-started` 多一层退路；两个都没有才无从判断
 * 这个数是否被压低，什么都不改。`caps` 读不动同理。
 *
 * 升回天花板要把 `limit` **摘掉**而不是写成天花板：跑在天花板上的 run 按协议没有自己的界。摘完
 * 若共享桶那一侧也无话可说（cap 在水位上、不在冷却），整个 `concurrency` 键随之缺席——与一个
 * 从没被压低过的 run 逐字节相同。本来就没有 `limit` 时一个字不动（幂等的支点）。
 */
export function reduceRunCapsChanged(
  run: WorkflowRunState,
  payload: Record<string, unknown>,
): WorkflowRunState {
  const maxConcurrency = positiveInteger(plainRecord(payload.caps)?.maxConcurrency);
  const readCeiling = positiveInteger(payload.concurrencyCeiling);
  const payloadCeiling =
    readCeiling !== undefined && readCeiling <= WORKFLOW_RUNS_LIMITS.maxConcurrencyCeiling
      ? readCeiling
      : undefined;
  const withCeiling =
    payloadCeiling === undefined || run.concurrencyCeiling === payloadCeiling
      ? run
      : { ...run, concurrencyCeiling: payloadCeiling };
  const ceiling = payloadCeiling ?? withCeiling.concurrencyCeiling;
  if (maxConcurrency === undefined || ceiling === undefined) return withCeiling;
  const existing = withCeiling.concurrency;
  if (maxConcurrency !== ceiling) {
    const concurrency: WorkflowRunConcurrency = {
      // 没有共享桶读数时 cap 从默认并发起步——与 reduceRunStartedConcurrency 同一条依据。
      ...(existing ?? { cap: ceiling }),
      ceiling,
      limit: maxConcurrency,
    };
    return { ...withCeiling, concurrency };
  }
  if (existing?.limit === undefined) return withCeiling;
  const { limit: _lifted, ...rest } = existing;
  const shared: WorkflowRunConcurrency = { ...rest, ceiling };
  return shared.cooldownMs === undefined && shared.cap >= shared.ceiling
    ? withoutConcurrency(withCeiling)
    : { ...withCeiling, concurrency: shared };
}

/** 摘掉整个 `concurrency` 键（不是留一个空对象）：协议上「跑在天花板上」就是这个键不在。 */
function withoutConcurrency(run: WorkflowRunState): WorkflowRunState {
  const { concurrency: _cleared, ...rest } = run;
  return rest;
}

/**
 * 摘掉 `concurrency.cooldownMs`（run 终态：不再派发任何东西，冷却没有对象）。没有可摘的就
 * 原样返回——幂等重放的支点，与主归约的 withoutPendingQuestions 同理。cap / ceiling 照留：
 * 它们是这次 run 跑在什么并发下的历史事实。
 */
export function withoutCooldown(run: WorkflowRunState): WorkflowRunState {
  if (run.concurrency?.cooldownMs === undefined) return run;
  const { cooldownMs: _expired, ...rest } = run.concurrency;
  return { ...run, concurrency: rest };
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
