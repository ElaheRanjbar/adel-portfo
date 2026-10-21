import { Injectable, inject } from '@angular/core';
import { PortfolioStore } from './portfolio-store';
/** Drafts remain local until their sidebar page is saved. */
@Injectable({ providedIn: 'root' })
export class AdminEditor {
  private readonly store = inject(PortfolioStore);
  data = this.store.draft();
  revision = this.store.revision();
  readonly featuredChanges = new Map<string, boolean>();
  reload(): void {
    this.data = this.store.draft();
    this.revision = this.store.revision();
    this.featuredChanges.clear();
  }
}
