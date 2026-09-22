/**
 * 旧账号 Provider 兼容层的业务鉴权头构造。
 *
 * 购买/套餐 Provider 已被禁用；这里仅保留仍可能被旧配置解析代码引用的纯函数，
 * 不负责读取凭据，也不发起请求。
 */
export function createBigModelLoginAuthHeaders(token: string): Record<string, string> {
  return {
    // 业务接口要求 Authorization 直接传 accessToken，不能套 Bearer。
    Authorization: token,
    "Content-Type": "application/json",
  };
}

export function createZaiLoginAuthHeaders(token: string): Record<string, string> {
  return {
    // 业务 JWT 直接作为 Authorization，不能使用模型 API Key 或 Bearer 前缀。
    Authorization: token,
    "Content-Type": "application/json",
  };
}
