import { Component, computed, inject, input } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { PortfolioLink } from '../../core/portfolio-link';

@Component({
  selector: 'app-portfolio-tag',
  imports: [PortfolioLink],
  host: { style: 'display: contents' },
  template: `
    <a [class]="variant()" [portfolioLink]="'/projects?tag=' + encodedId()">{{
      tag()?.name || id()
    }}</a>
  `,
})
export class PortfolioTag {
  private readonly store = inject(PortfolioStore);
  readonly id = input.required<string>();
  readonly encodedId = computed(() => encodeURIComponent(this.id()));
  readonly variant = input('tag');
  readonly tag = computed(() => this.store.data().tags.find((tag) => tag.id === this.id()));
}
