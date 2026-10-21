import { RichContent } from '../../shared/rich-content/rich-content';
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
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { PortfolioTag } from '../../shared/portfolio-tag/portfolio-tag';
import { PortfolioLink } from '../../core/portfolio-link';
import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';

@Component({
  selector: 'app-project-detail',
  imports: [RichContent, Icon, MediaUrl, PortfolioTag, SiteHeader, SiteFooter, PortfolioLink],
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
  readonly project = computed(() => {
    const projects = this.store.data().detailedCaseStudies;
    return projects[this.params().get('id') || 'case-1'];
  });
  constructor() {
    effect(() => this.activeSection.set(this.project()?.sections[0]?.id || ''));
    afterNextRender(() => {
      const update = () => {
        const sections = Array.from(
          this.element.nativeElement.querySelectorAll<HTMLElement>(
            '.narrative-block:not(.empty-narrative)',
          ),
        );
        const sidebar = this.element.nativeElement.querySelector<HTMLElement>('.detail-sidebar');
        const threshold =
          window.matchMedia('(max-width: 760px)').matches && sidebar
            ? sidebar.getBoundingClientRect().bottom + 24
            : 160;
        const current =
          sections.filter((section) => section.getBoundingClientRect().top <= threshold).at(-1) ||
          sections[0];
        if (current) this.activeSection.set(current.id);
      };
      let frame = 0;
      const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
      };
      window.addEventListener('scroll', schedule, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', schedule);
        cancelAnimationFrame(frame);
      });
    });
  }
}
