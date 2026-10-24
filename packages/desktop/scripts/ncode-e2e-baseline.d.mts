export interface NcodeClosedE2ESpecEntry {
  spec: string;
  feature: string;
  /** 部分引用：spec 同时覆盖保留行为，替代 spec 待后续补充。 */
  partial?: boolean;
}

export const NCODE_CLOSED_E2E_SPECS: NcodeClosedE2ESpecEntry[];

export const NCODE_CLOSED_E2E_NAME_PATTERNS: RegExp[];

export function isNcodeClosedE2ESpec(spec: string): boolean;

export const NCODE_CLOSED_E2E_EXCLUDE_SPECS: string[];
