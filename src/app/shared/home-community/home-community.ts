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
  toggle(index: number): void {
    this.expanded.update((items) =>
      items.includes(index) ? items.filter((i) => i !== index) : [...items, index],
    );
  }
}
