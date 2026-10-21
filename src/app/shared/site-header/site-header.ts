import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { PortfolioLink, portfolioUrl } from '../../core/portfolio-link';
import { MediaUrl } from '../../core/media-url';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-site-header',
  imports: [PortfolioLink, MediaUrl],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  host: { '(window:resize)': 'onResize()' },
})
export class SiteHeader {
  readonly store = inject(PortfolioStore);
  readonly router = inject(Router);
  readonly menuOpen = signal(false);
  private readonly mobileMenu = viewChild<ElementRef<HTMLDialogElement>>('mobileMenu');
  private previousOverflow = '';

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.closeMenu();
    });
    inject(DestroyRef).onDestroy(() => this.closeMenu());
  }
  openMenu(): void {
    const dialog = this.mobileMenu()?.nativeElement;
    if (!dialog || dialog.open) return;
    this.previousOverflow = document.body.style.overflow;
    dialog.showModal();
    this.menuOpen.set(true);
    document.body.style.overflow = 'hidden';
  }
  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.mobileMenu()?.nativeElement.close();
    this.onMenuClosed();
  }
  onMenuClosed(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    document.body.style.overflow = this.previousOverflow;
  }
  onResize(): void {
    if (window.innerWidth > 760) this.closeMenu();
  }
  active(href: string): boolean {
    const target = portfolioUrl(href);
    if (target === '/projects')
      return (
        this.router.url.startsWith('/projects') || this.router.url.startsWith('/project-detail')
      );
    return this.router.url === target;
  }
}
