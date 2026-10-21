import { Directive, HostBinding, HostListener, inject, signal } from '@angular/core';
import { PortfolioStore } from './portfolio-store';

/** Download a file without allowing missing, hash, or external links to navigate the page. */
@Directive({ selector: 'a[resumeDownload]', exportAs: 'resumeDownload' })
export class ResumeDownload {
  private readonly store = inject(PortfolioStore);
  readonly busy = signal(false);
  readonly error = signal('');

  private fileUrl(): URL | null {
    const value = this.store.data().hero.ctaSecondaryLink.trim();
    if (!value || value.startsWith('#')) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) && !url.hash ? url : null;
    } catch {
      return null;
    }
  }
  @HostBinding('attr.href') get href(): string | null {
    return this.fileUrl() ? this.store.data().hero.ctaSecondaryLink : null;
  }
  @HostBinding('attr.download') get filename(): string {
    return (
      this.store.data().hero.cvFileName ||
      this.fileUrl()?.pathname.match(/[^/]+\.(?:pdf|docx?)$/i)?.[0] ||
      'resume.pdf'
    );
  }
  @HostBinding('attr.aria-disabled') get disabled(): string {
    return String(!this.fileUrl() || this.busy());
  }
  @HostBinding('attr.aria-busy') get loading(): string {
    return String(this.busy());
  }
  @HostBinding('attr.title') get title(): string {
    return !this.fileUrl() ? 'Resume is not available yet.' : 'Download resume';
  }
  @HostBinding('attr.role') readonly role = 'button';
  @HostBinding('attr.tabindex') readonly tabIndex = '0';
  @HostListener('keydown.space', ['$event']) onSpace(event: Event): void {
    void this.download(event);
  }
  @HostListener('keydown.enter', ['$event']) onEnter(event: Event): void {
    void this.download(event);
  }
  @HostListener('click', ['$event'])
  async download(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.error.set('');
    const url = this.fileUrl();
    if (!url) {
      this.error.set('Resume is not available yet.');
      return;
    }
    this.busy.set(true);
    let objectUrl = '';
    try {
      const response = await fetch(url.href, {
        credentials: url.origin === location.origin ? 'same-origin' : 'omit',
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      if (!blob.size || /(?:text\/html|application\/json)/i.test(blob.type))
        throw new Error('Invalid resume file');
      objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = this.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      this.error.set('Could not download the resume. Please try again later.');
    } finally {
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      this.busy.set(false);
    }
  }
}
