import type {
  AccountAccessIdentityInput,
  AccountRequestAuthInput,
  AccountRequestAuthMaterial,
  AccountRequestAuthResolver,
} from "./accountProviderRequestAuthService.js";
import type { ZCodeAccountAccess, ZCodeProviderAccountAccess } from "@zcode/shared";

/**
 * 请求期 Account 鉴权边界。
 *
 * 服务按 Active Model 的静态 family/mode 约束，从当前账号连接解析请求材料。
 * 它不保存 Provider Config，也不提供 Registry fallback。
 */
export interface IAccountRequestAuthService {
  resolveAccessCurrent(access: ZCodeProviderAccountAccess): Promise<ZCodeAccountAccess | null>;
  resolveCurrent(input: AccountRequestAuthInput): Promise<AccountRequestAuthMaterial>;
  assertCurrent(input: AccountAccessIdentityInput): Promise<void>;
}

export function createAccountRequestAuthService(
  resolver: AccountRequestAuthResolver,
): IAccountRequestAuthService {
  return {
    resolveAccessCurrent(access) {
      return resolver.resolveAccessCurrent(access);
    },
    resolveCurrent(input) {
      return resolver.resolveCurrent(input);
    },
    assertCurrent(input) {
      return resolver.assertCurrent(input);
    },
  };
}

/**
 * 账号 Provider 已被移出运行时；保留一个 fail-closed 适配器，避免旧 RPC/测试 double
 * 因服务接口形状变化而重新接回 OAuth 或套餐凭据。
 */
export function createDisabledAccountRequestAuthService(): IAccountRequestAuthService {
  return {
    resolveAccessCurrent: async () => null,
    resolveCurrent: async (input) => {
      throw new Error(`账号 Provider 已禁用: ${input.providerId}`);
    },
    assertCurrent: async (input) => {
      throw new Error(`账号 Provider 已禁用: ${input.providerId}`);
    },
  };
}

export type {
  AccountRequestAuthInput,
  AccountAccessIdentityInput,
  AccountRequestAuthMaterial,
  AccountRequestAuthResolver,
} from "./accountProviderRequestAuthService.js";
