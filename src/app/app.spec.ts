import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { PortfolioStore } from './core/portfolio-store';
import { DEFAULT_PORTFOLIO_DATA } from './core/portfolio.data';
import { portfolioUrl } from './core/portfolio-link';
import { Admin } from './pages/admin/admin';

describe('Portfolio migration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
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
    store.save(draft);
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
      'input[aria-label="نام"]',
    ) as HTMLInputElement;
    input.value = 'Updated Maryam';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    admin.data.caseStudiesList[0].title = 'Edited project';
    admin.addProject();
    admin.removeProject(1);
    expect(admin.data.caseStudiesList[0].title).toBe('Edited project');
    admin.save();
    expect(JSON.parse(localStorage.getItem('maryam_portfolio_store')!).hero.name).toBe(
      'Updated Maryam',
    );
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Updated Maryam',
    );
  });

  it('isolates drafts, restores defaults, and recovers from malformed storage', () => {
    localStorage.setItem('maryam_portfolio_store', '{bad json');
    const store = TestBed.inject(PortfolioStore);
    expect(store.data().hero.name).toBe(DEFAULT_PORTFOLIO_DATA.hero.name);
    const draft = store.draft();
    draft.hero.name = 'Edited';
    expect(store.data().hero.name).toBe('Maryam');
    store.save(draft);
    expect(store.data().hero.name).toBe('Edited');
    store.reset();
    expect(store.data().hero.name).toBe('Maryam');
    expect(localStorage.getItem(store.key)).toBeNull();
  });

  it('renders custom HTML without executing embedded scripts', async () => {
    const store = TestBed.inject(PortfolioStore);
    const draft = store.draft();
    draft.customHtmlEmbed = '<p>Custom content</p><script>alert(1)</script>';
    store.save(draft);
    const harness = await RouterTestingHarness.create('/');
    const mount = harness.routeNativeElement?.querySelector('#custom-html-mount');
    expect(mount?.textContent).toContain('Custom content');
    expect(mount?.querySelector('script')).toBeNull();
  });
});
