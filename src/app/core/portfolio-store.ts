import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { PortfolioData } from './portfolio.models';
import { normalizePortfolio } from './portfolio-normalize';

@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  readonly key = 'maryam_portfolio_store';
  private readonly state = signal<PortfolioData>(this.load());
  readonly data = this.state.asReadonly();

  constructor() {
    const listener = (event: StorageEvent) => {
      if (event.key === this.key || event.key === null) this.state.set(this.load());
    };
    window.addEventListener('storage', listener);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', listener));
  }

  draft(): PortfolioData {
    return structuredClone(this.data());
  }

  save(data: PortfolioData): void {
    const normalized = normalizePortfolio(structuredClone(data));
    localStorage.setItem(this.key, JSON.stringify(normalized));
    this.state.set(normalized);
  }

  reset(): void {
    localStorage.removeItem(this.key);
    this.state.set(normalizePortfolio());
  }

  private load(): PortfolioData {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        const data: unknown = JSON.parse(stored);
        if (data && typeof data === 'object' && !Array.isArray(data))
          return normalizePortfolio(data);
      }
    } catch {
      /* Recover from unavailable storage or an invalid backup. */
    }
    return normalizePortfolio();
  }
}
