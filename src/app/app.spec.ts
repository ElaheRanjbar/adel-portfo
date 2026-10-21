import { MemoryPortfolioApi } from '../testing/portfolio-api';
import { ApiClient } from './core/api-client';
import { AdminAuth } from './core/admin-auth';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { PortfolioStore } from './core/portfolio-store';
import { DEFAULT_PORTFOLIO_DATA } from './core/portfolio.data';
import { portfolioUrl } from './core/portfolio-link';
import { Admin } from './pages/admin/admin';

describe('Portfolio migration', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        MemoryPortfolioApi,
        { provide: ApiClient, useExisting: MemoryPortfolioApi },
      ],
    });
    await TestBed.inject(PortfolioStore).load();
    TestBed.inject(AdminAuth).user.set({ username: 'admin' });
  });

  afterEach(() => localStorage.clear());

  it('renders the supplied home content', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Maryam');
    expect(harness.routeNativeElement?.querySelectorAll('.project-card').length).toBe(4);
  });

  it('renders the listing and updates details when the query changes', async () => {
    const store = TestBed.inject(PortfolioStore);
    const draft = store.draft();
    draft.detailedCaseStudies['case-2'].title = 'Second case detail';
    await store.save(draft);
    const harness = await RouterTestingHarness.create('/projects');
    expect(harness.routeNativeElement?.querySelectorAll('.listing-card').length).toBe(4);
    await harness.navigateByUrl('/project-detail?id=case-1');
    expect(harness.routeNativeElement?.textContent).toContain('May – June 2023');
    await harness.navigateByUrl('/project-detail?id=case-2');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Second case detail',
    );
    await harness.navigateByUrl('/project-detail?id=missing');
    expect(harness.routeNativeElement?.textContent).toContain('Case study not found');
  });

  it('keeps legacy detail URLs working', async () => {
    const harness = await RouterTestingHarness.create('/project-detail.html?id=case-2');
    expect(harness.routeNativeElement?.textContent).toContain('User researcher, Visual designer');
    expect(portfolioUrl('index.html#about')).toBe('/#about');
    expect(portfolioUrl('projects.html')).toBe('/projects');
    expect(portfolioUrl('https://example.com/cv.pdf')).toBe('https://example.com/cv.pdf');
  });

  it('saves admin edits and preserves drafts when adding or removing projects', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin', Admin);
    const input = harness.routeNativeElement?.querySelector(
      'input[aria-label="Name"]',
    ) as HTMLInputElement;
    input.value = 'Updated Maryam';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    admin.data.caseStudiesList[0].title = 'Edited project';
    admin.addProject();
    admin.removeProject(1);
    expect(admin.data.caseStudiesList[0].title).toBe('Edited project');
    await admin.savePage('hero');
    await admin.savePage('projects');
    expect(TestBed.inject(MemoryPortfolioApi).data.hero.name).toBe('Updated Maryam');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Updated Maryam',
    );
  });

  it('isolates drafts, restores server defaults, and ignores obsolete browser storage', async () => {
    localStorage.setItem('maryam_portfolio_store', '{bad json');
    const store = TestBed.inject(PortfolioStore);
    expect(store.data().hero.name).toBe(DEFAULT_PORTFOLIO_DATA.hero.name);
    const draft = store.draft();
    draft.hero.name = 'Edited';
    expect(store.data().hero.name).toBe('Maryam');
    await store.save(draft);
    expect(store.data().hero.name).toBe('Edited');
    await store.reset();
    expect(store.data().hero.name).toBe('Maryam');
    expect(TestBed.inject(MemoryPortfolioApi).data.hero.name).toBe(
      DEFAULT_PORTFOLIO_DATA.hero.name,
    );
  });

  it('does not render removed custom HTML from legacy content', async () => {
    const store = TestBed.inject(PortfolioStore);
    const draft = store.draft();
    draft.customHtmlEmbed = '<p>Custom content</p><script>alert(1)</script>';
    await store.save(draft);
    const harness = await RouterTestingHarness.create('/');
    const mount = harness.routeNativeElement?.querySelector('#custom-html-mount');
    expect(mount).toBeNull();
    expect(harness.routeNativeElement?.textContent).not.toContain('Custom content');
  });
});
