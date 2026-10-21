import { AutoSlider } from '../../shared/auto-slider/auto-slider';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
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
  readonly activePhoto = signal<{ image: string; caption: string } | null>(null);
  readonly photoDialog = viewChild.required<ElementRef<HTMLDialogElement>>('photoDialog');
  private previousOverflow: string | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.restoreScrolling());
  }

  openPhoto(photo: { image: string; caption: string }): void {
    this.activePhoto.set(photo);
    this.photoDialog().nativeElement.showModal();
    this.previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }

  closePhoto(): void {
    this.photoDialog().nativeElement.close();
    this.activePhoto.set(null);
    this.restoreScrolling();
  }

  private restoreScrolling(): void {
    if (this.previousOverflow === undefined) return;
    document.documentElement.style.overflow = this.previousOverflow;
    this.previousOverflow = undefined;
  }

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
