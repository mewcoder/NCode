import { NCODE_FEATURE_POLICY } from "./contract.js";

/** 消费方把策略值传给现有开关；关闭态在发起 IO 前裁决。 */
export function desktopHostPresentation() {
  return { desktopContextPromptEnabled: () => NCODE_FEATURE_POLICY.desktopContextPrompt };
}
