import { Injectable } from '@angular/core';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
@Injectable({ providedIn: 'root' })
export class ApiClient {
  async request<T>(
    path: string,
    options: { method?: string; body?: unknown; revision?: number } = {},
  ): Promise<T> {
    const method = options.method || 'GET';
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (method !== 'GET') headers['X-Portfolio-Request'] = '1';
    if (options.revision !== undefined) headers['If-Match'] = String(options.revision);
    const multipart = options.body instanceof FormData;
    if (options.body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
    let response: Response;
    try {
      response = await fetch(`/api${path}`, {
        method,
        headers,
        credentials: 'same-origin',
        signal: AbortSignal.timeout(multipart ? 120000 : 20000),
        body:
          options.body === undefined
            ? undefined
            : multipart
              ? (options.body as FormData)
              : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(result?.message) ? result.message.join(' ') : result?.message;
      const details = result?.errors
        ?.slice(0, 3)
        .map((issue: any) => `${issue.path}: ${issue.message}`)
        .join(' ');
      throw new ApiError(
        [typeof message === 'string' ? message : `Request failed (${response.status}).`, details]
          .filter(Boolean)
          .join(' '),
        response.status,
      );
    }
    if (!result) throw new ApiError('The server returned an invalid response.', response.status);
    return result as T;
  }
}
