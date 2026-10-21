import { SmoothScroller } from './smooth-scroller';
import { Directive, HostBinding, HostListener, inject, input } from '@angular/core';
import { MediaStore } from './media-store';
import { Router } from '@angular/router';

export function portfolioUrl(value: string): string {
  return value
    .replace(/^(?:\.\/)?index\.html(?=[?#]|$)/, '/')
    .replace(/^(?:\.\/)?projects\.html(?=[?#]|$)/, '/projects')
    .replace(/^(?:\.\/)?project-detail\.html(?=[?#]|$)/, '/project-detail')
    .replace(/^(?:\.\/)?admin-portal\.html(?=[?#]|$)/, '/admin');
}

@Directive({ selector: 'a[portfolioLink]' })
export class PortfolioLink {
  private readonly router = inject(Router);
  private readonly media = inject(MediaStore);
  private readonly scroller = inject(SmoothScroller);
  readonly portfolioLink = input.required<string>();
  @HostBinding('attr.href') get href(): string {
    return this.media.url(portfolioUrl(this.portfolioLink()));
  }

  @HostListener('click', ['$event'])
  navigate(event: MouseEvent): void {
    const anchor = event.currentTarget as HTMLAnchorElement;
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target === '_blank' ||
      anchor.hasAttribute('download')
    )
      return;
    const href = this.href;
    if (
      /^\/(?:projects|project-detail|admin(?:\/[^/?#]+)?|)(?:[?#]|$)/.test(href) ||
      href.startsWith('#')
    ) {
      event.preventDefault();
      const url = href.startsWith('#') ? this.router.url.split('#')[0] + href : href;
      if (url === this.router.url && url.includes('#')) {
        this.scroller.scrollToAnchor(decodeURIComponent(url.slice(url.indexOf('#') + 1)));
      } else void this.router.navigateByUrl(url);
    }
  }
}
