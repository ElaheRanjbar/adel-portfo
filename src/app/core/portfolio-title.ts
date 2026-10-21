import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PortfolioStore } from './portfolio-store';
@Injectable()
export class PortfolioTitle extends TitleStrategy {
  private readonly store = inject(PortfolioStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const data = this.store.data();
    if (!data) return;
    const project = data.detailedCaseStudies[snapshot.root.queryParams['id'] || 'case-1'];
    const path = snapshot.url.split('?')[0].split('#')[0];
    const title = path.startsWith('/admin')
      ? 'Portfolio admin'
      : path === '/projects'
        ? `${data.content.listingTitle} — ${data.hero.name}`
        : path === '/project-detail' && project
          ? `${project.title} — ${data.hero.name}`
          : `${data.hero.name} — ${data.hero.badge}`;
    this.title.setTitle(title);
    this.meta.updateTag({
      name: 'description',
      content: path === '/project-detail' && project ? project.leadSummary : data.hero.roleHeadline,
    });
  }
}
