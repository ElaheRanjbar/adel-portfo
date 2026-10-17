import { AutoSlider } from '../../shared/auto-slider/auto-slider';
import { Component, inject, signal } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-home-community',
  imports: [AutoSlider, MediaUrl, Icon],
  templateUrl: './home-community.html',
  styleUrl: './home-community.css',
})
export class HomeCommunity {
  readonly store = inject(PortfolioStore);
  readonly expanded = signal<number[]>([]);
  expandedParagraphs(index: number): string[] {
    const testimonial = this.store.data().testimonials[index];
    // The seed testimonials are placeholders; preserve their copy in the reference layout.
    return testimonial.fullQuote?.trim()
      ? testimonial.fullQuote.split(/\n+/).filter((paragraph) => paragraph.trim())
      : Array.from({ length: 3 }, () => testimonial.quote);
  }

  toggle(index: number): void {
    this.expanded.update((items) =>
      items.includes(index) ? items.filter((i) => i !== index) : [...items, index],
    );
  }
}
