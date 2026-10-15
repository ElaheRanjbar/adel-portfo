import { Pipe, PipeTransform, inject } from '@angular/core';
import { PortfolioStore } from './portfolio-store';

@Pipe({ name: 'tagName', pure: false })
export class TagName implements PipeTransform {
  private readonly store = inject(PortfolioStore);
  transform(id: string): string {
    return this.store.data().tags.find((tag) => tag.id === id)?.name || id;
  }
}
