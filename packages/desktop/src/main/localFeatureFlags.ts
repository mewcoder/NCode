import {
  DISABLED_RENDERER_ACTION_TRACE_CONFIG,
  ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED_ENV,
  type RendererActionTraceConfigV1,
} from "@zcode/shared";

type EnvRecord = Record<string, string | undefined>;

export function resolveLocalDesktopContextPromptEnabled(env: EnvRecord): boolean {
  return isEnabled(env[ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED_ENV]);
}

export function resolveLocalRendererActionTraceConfig(env: EnvRecord): RendererActionTraceConfigV1 {
  const localTtftEnabled = isEnabled(env.ZCODE_LOCAL_TTFT_ENABLED);
  if (!isEnabled(env.ZCODE_RENDERER_ACTION_TRACE_ENABLED)) {
    return {
      ...DISABLED_RENDERER_ACTION_TRACE_CONFIG,
      ...(localTtftEnabled ? { localTtftEnabled: true } : {}),
    };
  }
  return {
    enabled: true,
    localTtftEnabled,
    sampleRatio: 1,
    enabledGroups: ["core", "settings"],
    configVersion: "local-explicit",
  } as RendererActionTraceConfigV1;
}

function isEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
