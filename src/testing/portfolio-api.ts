import { Injectable } from '@angular/core';
import { ApiClient, ApiError } from '../app/core/api-client';
import { normalizePortfolio } from '../app/core/portfolio-normalize';
import { PortfolioData } from '../app/core/portfolio.models';

/** Deterministic API substitute; production never reads this fixture. */
@Injectable()
export class MemoryPortfolioApi extends ApiClient {
  data: PortfolioData = normalizePortfolio();
  revision = 1;
  writes = 0;
  fail = false;
  calls: string[] = [];
  override async request<T>(
    path: string,
    options: { method?: string; body?: unknown; revision?: number } = {},
  ): Promise<T> {
    this.calls.push(`${options.method || 'GET'} ${path}`);
    if (this.fail) throw new ApiError('Server unavailable.', 503);
    if (path === '/auth/session') return { user: { username: 'admin' } } as T;
    if (path === '/media') return [] as T;
    if (options.method === 'PUT' || path === '/portfolio/reset') {
      if (options.revision !== this.revision)
        throw new ApiError('Content changed on the server.', 409);
      this.data =
        path === '/portfolio/reset'
          ? normalizePortfolio()
          : structuredClone(options.body as PortfolioData);
      this.revision++;
      this.writes++;
    }
    return { data: structuredClone(this.data), revision: this.revision } as T;
  }
}
