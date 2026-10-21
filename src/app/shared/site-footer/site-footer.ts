import { MediaUrl } from '../../core/media-url';
import { SmoothScroller } from '../../core/smooth-scroller';
import { Icon } from '../../shared/icon/icon';
import { Component, inject, input } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';

@Component({
  selector: 'app-site-footer',
  imports: [Icon, MediaUrl],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  readonly store = inject(PortfolioStore);
  readonly tallBottom = input(false);
  private readonly scroller = inject(SmoothScroller);

  scrollToTop(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    this.scroller.scrollToAnchor('top');
  }

  socialIcon(label: string): string {
    const name = label.toLowerCase();
    if (name.includes('link')) return 'linkedin';
    if (name.includes('telegram')) return 'telegram';
    if (name.includes('dribb')) return 'dribbble';
    if (name.includes('mail')) return 'email';
    return 'link';
  }
}
