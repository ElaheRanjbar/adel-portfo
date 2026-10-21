import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon } from '../../shared/icon/icon';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { PortfolioTag } from '../../shared/portfolio-tag/portfolio-tag';
import { PortfolioLink } from '../../core/portfolio-link';

import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';

@Component({
  selector: 'app-projects',
  imports: [Icon, MediaUrl, PortfolioTag, SiteHeader, SiteFooter, PortfolioLink],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeFilter(true)',
  },
})
export class Projects {
  readonly store = inject(PortfolioStore);
  readonly filterOpen = signal(false);
  private readonly filterMenu = viewChild<ElementRef<HTMLElement>>('filterMenu');
  private readonly filterButton = viewChild<ElementRef<HTMLButtonElement>>('filterButton');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly projects = computed(() => {
    const data = this.store.data();
    const knownTags = new Set(data.tags.map((tag) => tag.id));
    return data.caseStudiesList.map((project) => ({
      ...project,
      // Older content stored listing tags separately from the case study's assigned tags.
      tags: [...new Set(data.detailedCaseStudies[project.id]?.tags ?? project.tags)].filter((id) =>
        knownTags.has(id),
      ),
    }));
  });
  readonly assignedTagIds = computed(
    () => new Set(this.projects().flatMap((project) => project.tags)),
  );
  readonly selectedTags = computed(() => {
    const ids = new Set(this.params().getAll('tag'));
    return this.store.data().tags.filter((tag) => ids.has(tag.id));
  });
  readonly filterTags = computed(() =>
    this.store.data().tags.filter((tag) => this.assignedTagIds().has(tag.id)),
  );
  readonly oldestFirst = computed(() => this.params().get('sort') === 'oldest');
  readonly filteredProjects = computed(() => {
    const ids = new Set(this.selectedTags().map((tag) => tag.id));
    const projects = this.projects().filter(
      (project) => !ids.size || project.tags.some((id) => ids.has(id)),
    );
    // Projects are appended on creation; the saved order runs from oldest to newest.
    return this.oldestFirst() ? projects : projects.reverse();
  });
  isSelected(id: string): boolean {
    return this.selectedTags().some((tag) => tag.id === id);
  }
  toggleTag(id: string): void {
    if (this.isSelected(id)) this.removeTag(id);
    else this.setTags([...this.selectedTags().map((tag) => tag.id), id]);
  }
  toggleSort(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: this.oldestFirst() ? null : 'oldest' },
      queryParamsHandling: 'merge',
    });
  }
  onDocumentClick(event: MouseEvent): void {
    if (!this.filterMenu()?.nativeElement.contains(event.target as Node)) this.closeFilter();
  }
  closeFilter(restoreFocus = false): void {
    if (!this.filterOpen()) return;
    this.filterOpen.set(false);
    if (restoreFocus) this.filterButton()?.nativeElement.focus();
  }
  removeTag(id: string): void {
    this.setTags(
      this.selectedTags()
        .filter((tag) => tag.id !== id)
        .map((tag) => tag.id),
    );
  }
  clearTags(): void {
    this.setTags([]);
  }
  private setTags(tags: string[]): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag: tags.length ? tags : null },
      queryParamsHandling: 'merge',
    });
  }
}
