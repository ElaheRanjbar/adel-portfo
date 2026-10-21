import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from './api-client';
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly api = inject(ApiClient);
  readonly user = signal<{ username: string } | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  async restore(): Promise<void> {
    try {
      const response = await this.api.request<{ user: { username: string } | null }>(
        '/auth/session',
      );
      this.user.set(response.user);
    } catch {
      this.user.set(null);
    }
  }
  async login(username: string, password: string): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      this.user.set(
        await this.api.request('/auth/login', { method: 'POST', body: { username, password } }),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      this.busy.set(false);
    }
  }
  async logout(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.request('/auth/logout', { method: 'POST' });
      this.user.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign out failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
