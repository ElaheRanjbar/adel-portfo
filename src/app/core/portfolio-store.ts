import { Injectable, inject, signal } from '@angular/core';
import { PortfolioData } from './portfolio.models';
import { ApiClient } from './api-client';
export interface PortfolioSnapshot {
  data: PortfolioData;
  revision: number;
}
@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly api = inject(ApiClient);
  private readonly state = signal<PortfolioData>(null!);
  readonly data = this.state.asReadonly();
  readonly revision = signal(0);
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  private accept(snapshot: PortfolioSnapshot): void {
    if (!snapshot.data?.hero || !snapshot.data?.header || !Number.isInteger(snapshot.revision))
      throw new Error('The server returned invalid portfolio content.');
    this.state.set(snapshot.data);
    this.revision.set(snapshot.revision);
    this.loaded.set(true);
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.accept(await this.api.request<PortfolioSnapshot>('/portfolio'));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load portfolio.');
    } finally {
      this.loading.set(false);
    }
  }
  draft(): PortfolioData {
    return structuredClone(this.data());
  }
  async save(data: PortfolioData, expected = this.revision()): Promise<void> {
    if (this.saving()) throw new Error('A save is already in progress.');
    this.saving.set(true);
    try {
      this.accept(
        await this.api.request<PortfolioSnapshot>('/portfolio', {
          method: 'PUT',
          body: data,
          revision: expected,
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }
  async reset(expected = this.revision()): Promise<void> {
    this.saving.set(true);
    try {
      this.accept(
        await this.api.request<PortfolioSnapshot>('/portfolio/reset', {
          method: 'POST',
          revision: expected,
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }
}
