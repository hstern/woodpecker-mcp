import { AsyncLocalStorage } from "node:async_hooks";
import { Err, Ok, type Result } from "ts-results";
import { env } from "@/env";
import { ApiError } from "@/utils/error";

const URL_REGEX = /\/$/;

/**
 * Per-request context for the HTTP transport. The bearer token sent on each
 * request is stored here so the shared `apiClient` can act as the caller
 * (multi-user, secretless server) without threading the token through every
 * tool. Empty in stdio mode, where the client falls back to env.WOODPECKER_TOKEN.
 */
export const requestContext = new AsyncLocalStorage<{ token: string }>();

export type WoodpeckerApiResponse<T> = {
  data?: T;
  error?: string;
};

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RequestOptions = {
  readonly method: HttpMethod;
  readonly body?: string;
  readonly headers?: Record<string, string>;
};

type Response<T> = Promise<Result<T, ApiError>>;

/**
 * Woodpecker API client for making authenticated requests
 */

export class WoodpeckerApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${env.WOODPECKER_URL.replace(URL_REGEX, "")}/api`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions
  ): Response<T> {
    // HTTP mode: the caller's bearer token (per request). stdio mode: env.
    const token = requestContext.getStore()?.token ?? env.WOODPECKER_TOKEN;
    if (!token) {
      return Err(
        new ApiError(
          401,
          "No Woodpecker token: set WOODPECKER_TOKEN (stdio) or send an Authorization: Bearer token (HTTP)."
        )
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });

      if (!response.ok) {
        return Err(new ApiError(response.status, await response.text()));
      }

      const res = await response.json().catch(() => response.text());

      return Ok(res as T);
    } catch (error) {
      return Err(
        new ApiError(
          500,
          error instanceof Error ? error.message : "Unknown Error"
        )
      );
    }
  }

  get<T>(endpoint: string): Response<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body: unknown): Response<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Response<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  patch<T>(endpoint: string, body: unknown): Response<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new WoodpeckerApiClient();
