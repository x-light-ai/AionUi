/**
 * HTTP client factory for communicating with remote market APIs.
 */

import { readXaiworkRemoteAuth, redirectToXaiworkRemoteLogin } from '../xaiworkRemoteAuth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown
  ) {
    super(`API error ${status}: ${statusText}`);
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function isRemoteTokenExpired(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { code?: unknown }).code === '401.10';
}

async function request<T>(
  baseURL: string,
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${baseURL}${path}`;
  const headers: Record<string, string> = { ...options?.headers };
  const remoteAuth = readXaiworkRemoteAuth();
  if (remoteAuth?.accessToken && !headers.Authorization) headers.Authorization = `Bearer ${remoteAuth.accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (!response.ok) {
    const rawText = await response.text().catch(() => '');
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(rawText);
    } catch {
      errorBody = rawText;
    }
    if (isRemoteTokenExpired(errorBody)) {
      redirectToXaiworkRemoteLogin();
    }
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    const responseBody = (await response.json()) as T;
    if (isRemoteTokenExpired(responseBody)) {
      redirectToXaiworkRemoteLogin();
      throw new ApiError(response.status, response.statusText, responseBody);
    }
    return responseBody;
  }
  return undefined as T;
}

export function createApiClient(baseURL: string) {
  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(baseURL, 'GET', path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(baseURL, 'POST', path, body, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(baseURL, 'PUT', path, body, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(baseURL, 'PATCH', path, body, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(baseURL, 'DELETE', path, undefined, options),
  };
}
