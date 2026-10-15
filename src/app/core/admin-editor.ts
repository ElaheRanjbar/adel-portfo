import { Injectable, inject } from '@angular/core';
import { PortfolioStore } from './portfolio-store';

/** Keeps unsaved form changes when switching between admin pages. */
@Injectable({ providedIn: 'root' })
export class AdminEditor {
  private readonly store = inject(PortfolioStore);
  data = this.store.draft();
  reload(): void {
    this.data = this.store.draft();
  }
}
