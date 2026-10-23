/** 进程间共享只读值，不提供运行时修改、持久化或远端覆盖入口。 */
export { NCODE_FEATURE_POLICY } from "./policy.js";
export type NCodeFeaturePolicy = typeof import("./policy.js").NCODE_FEATURE_POLICY;
