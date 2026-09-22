import { ApiError, type ApiClient, type ApiRequestInit } from "@zcode/shared";
import { createServiceLogger } from "#src/logger/serviceLogger.js";
import { withRequestIdHeader } from "./requestIdHeaders.js";

const log = createServiceLogger("node-api-client");

interface NodeApiClientOptions {
  fetchImpl?: typeof fetch;
  onZcodeJwtInvalid?: (input: string | URL, headers: Headers) => void;
  isZcodeJwtRequest?: (input: string | URL, headers: Headers) => boolean | Promise<boolean>;
}

function resolveMethod(init?: ApiRequestInit): string {
  return (init?.method ?? "GET").toUpperCase();
}

function resolveUrl(input: string | URL): string {
  return typeof input === "string" ? input : input.toString();
}

export class NodeApiClient implements ApiClient {
  private readonly fetchImpl?: typeof fetch;
  private readonly onZcodeJwtInvalid?: (input: string | URL, headers: Headers) => void;
  private readonly isZcodeJwtRequest?: NodeApiClientOptions["isZcodeJwtRequest"];

  constructor(options: NodeApiClientOptions = {}) {
    this.fetchImpl = options.fetchImpl;
    this.onZcodeJwtInvalid = options.onZcodeJwtInvalid;
    this.isZcodeJwtRequest = options.isZcodeJwtRequest;
  }

  async request(input: string | URL, init?: ApiRequestInit): Promise<Response> {
    const requestInput = input;
    const url = resolveUrl(requestInput);
    const method = resolveMethod(init);
    const timeoutMs = init?.timeoutMs;
    const controller = timeoutMs && timeoutMs > 0 ? new AbortController() : null;
    let didTimeout = false;
    const timer =
      controller && timeoutMs
        ? setTimeout(() => {
            didTimeout = true;
            controller.abort();
          }, timeoutMs)
        : null;

    try {
      const signal = controller
        ? init?.signal
          ? AbortSignal.any([init.signal, controller.signal])
          : controller.signal
        : init?.signal;
      if (signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }
      const fetchImpl = this.fetchImpl ?? globalThis.fetch;
      const requestHeaders = withRequestIdHeader(init?.headers);
      const response = await fetchImpl(requestInput, {
        ...init,
        headers: requestHeaders,
        ...(signal ? { signal } : {}),
      });
      if (response.status === 401) {
        try {
          if (await this.isZcodeJwtRequest?.(requestInput, new Headers(requestHeaders))) {
            this.onZcodeJwtInvalid?.(requestInput, new Headers(requestHeaders));
          }
        } catch (error) {
          log.warn("zcode jwt invalid response observation failed", { error });
        }
      }
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError({
          message:
            didTimeout && timeoutMs ? `Request timed out after ${timeoutMs}ms` : error.message,
          url,
          method,
          cause: error,
        });
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new ApiError({
        message,
        url,
        method,
        cause: error,
      });
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}

export function createNodeApiClient(options: NodeApiClientOptions = {}): ApiClient {
  return new NodeApiClient(options);
}
