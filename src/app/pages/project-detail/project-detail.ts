import { Icon } from '../../shared/icon/icon';
import {
  Component,
  computed,
  inject,
  signal,
  effect,
  afterNextRender,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { TagName } from '../../core/tag-name';
import { PortfolioLink } from '../../core/portfolio-link';
import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';

@Component({
  selector: 'app-project-detail',
  imports: [Icon, MediaUrl, TagName, SiteHeader, SiteFooter, PortfolioLink, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail {
  readonly store = inject(PortfolioStore);
  readonly activeSection = signal('challenge');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly fragment = toSignal(this.route.fragment);
  readonly project = computed(() => {
    const projects = this.store.data().detailedCaseStudies;
    return projects[this.params().get('id') || 'case-1'];
  });
  constructor() {
    effect(() => this.activeSection.set(this.fragment() || this.project()?.sections[0]?.id || ''));
    afterNextRender(() => {
      const update = () => {
        const sections = Array.from(
          this.element.nativeElement.querySelectorAll<HTMLElement>(
            '.narrative-block:not(.empty-narrative)',
          ),
        );
        const current =
          sections.filter((section) => section.getBoundingClientRect().top <= 160).at(-1) ||
          sections[0];
        if (current) this.activeSection.set(current.id);
      };
      window.addEventListener('scroll', update, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', update));
    });
  }
}
