import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { PortfolioStore } from '../../core/portfolio-store';
import { Admin } from './admin';

function setField(root: HTMLElement, label: string, value: string): void {
  const field = root.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
  expect(field).toBeTruthy();
  field.value = value;
  field.dispatchEvent(new Event('input'));
}

describe('Portfolio content management', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });
  afterEach(() => localStorage.clear());

  it('creates an independent full case study and renders all of its details', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.addProject();
    harness.detectChanges();
    setField(harness.routeNativeElement!, 'عنوان', 'New banking case');
    setField(harness.routeNativeElement!, 'عنوان صفحهٔ جزئیات', 'Banking redesign');
    setField(harness.routeNativeElement!, 'معرفی و توضیحات', 'A full new product story.');
    await harness.fixture.whenStable();
    const project = admin.currentProject!;
    const detail = admin.currentDetail!;
    detail.meta[0].value = '6 months';
    admin.addSection(detail);
    detail.sections[0].title = 'The new challenge';
    detail.sections[0].navTitle = 'Short sidebar label';
    detail.sections[0].quoteFirst = true;
    detail.sections[0].paragraphs = ['First paragraph', 'Second paragraph'];
    detail.sections[0].quote = 'A research insight';
    detail.sections[0].subsections!.push({
      heading: 'Decision one',
      text: 'Decision rationale',
      image: 'https://example.com/design.png',
      caption: 'Editable showcase caption',
    });
    admin.toggleFeatured(project);
    admin.save();
    expect(project.detailUrl).toBe(`/project-detail?id=${project.id}`);
    await harness.navigateByUrl('/projects');
    expect(harness.routeNativeElement?.textContent).toContain('New banking case');
    await harness.navigateByUrl(`/project-detail?id=${project.id}`);
    const text = harness.routeNativeElement!.textContent;
    for (const value of [
      'Banking redesign',
      'A full new product story.',
      '6 months',
      'The new challenge',
      'First paragraph',
      'Second paragraph',
      'A research insight',
      'Decision one',
      'Decision rationale',
      'Short sidebar label',
      'Editable showcase caption',
    ])
      expect(text).toContain(value);
    expect(
      harness.routeNativeElement?.querySelector('.showcase-image-box img')?.getAttribute('src'),
    ).toBe('https://example.com/design.png');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelectorAll('.project-card').length).toBe(5);
  });

  it('saves rich case study HTML and renders formatted content instead of the old paragraphs', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.currentDetail!.sections[0].html =
      '<h3>A rich story</h3><p style="text-align:center">A <strong>clear</strong> result.</p><a href="/brief.pdf" download>Download brief</a><img src="/design.png" alt="Design">';
    admin.save();
    await harness.navigateByUrl('/project-detail?id=case-1');
    const content = harness.routeNativeElement!.querySelector('.narrative-block app-rich-content')!;
    expect(content.querySelector('strong')?.textContent).toBe('clear');
    expect(content.querySelector('p')?.style.textAlign).toBe('center');
    expect(content.querySelector('img')?.getAttribute('src')).toBe('/design.png');
    expect(content.querySelector('a')?.hasAttribute('download')).toBe(true);
    expect(
      JSON.parse(localStorage.getItem('maryam_portfolio_store')!).detailedCaseStudies['case-1']
        .sections[0].html,
    ).toContain('A rich story');
  });

  it('keeps drafts across admin pages without publishing until Save All', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin', Admin);
    setField(harness.routeNativeElement!, 'نام', 'Draft name');
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/admin/tags', Admin);
    const again = await harness.navigateByUrl('/admin/hero', Admin);
    expect(again.data.hero.name).toBe('Draft name');
    expect(TestBed.inject(PortfolioStore).data().hero.name).toBe('Maryam');
    again.save();
    expect(TestBed.inject(PortfolioStore).data().hero.name).toBe('Draft name');
  });

  it('reuses tags across cards and details and propagates renames and deletions', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/tags', Admin);
    admin.newTag = 'Research';
    admin.addTag();
    const tag = admin.data.tags.at(-1)!;
    admin.data.caseStudiesList[0].tags = [tag.id];
    admin.data.detailedCaseStudies['case-1'].tags = [tag.id];
    admin.data.homeProjects[0].tags = [tag.id];
    tag.name = 'User Research';
    admin.save();
    await harness.navigateByUrl('/projects');
    expect(harness.routeNativeElement?.querySelector('.pill-tag')?.textContent).toContain(
      'User Research',
    );
    await harness.navigateByUrl('/project-detail?id=case-1');
    expect(harness.routeNativeElement?.querySelector('.detail-tag')?.textContent).toContain(
      'User Research',
    );
    const editor = await harness.navigateByUrl('/admin/tags', Admin);
    editor.deleteTag(tag.id);
    editor.save();
    await harness.navigateByUrl('/');
    expect(
      harness.routeNativeElement?.querySelector('.project-card .project-tags')?.textContent,
    ).not.toContain('User Research');
  });

  it('deletes the detail, featured card and recommendations for a removed case', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.data.detailedCaseStudies['case-2'].nextProject!.link = '/project-detail?id=case-1';
    admin.removeProject(0);
    admin.save();
    expect(admin.data.detailedCaseStudies['case-1']).toBeUndefined();
    expect(admin.data.homeProjects.some((p) => p.id === 'case-1')).toBe(false);
    expect(admin.data.detailedCaseStudies['case-2'].nextProject).toBeUndefined();
    await harness.navigateByUrl('/project-detail?id=case-1');
    expect(harness.routeNativeElement?.textContent).toContain('Case study not found');
    await harness.navigateByUrl('/projects');
    expect(harness.routeNativeElement?.querySelectorAll('.listing-card').length).toBe(3);
  });

  it('renders edited content from every home section and the logo', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin', Admin);
    admin.data.header.logoImage = 'https://example.com/logo.png';
    admin.data.header.logoAlt = 'Custom logo';
    admin.data.hero.greeting = 'Hello from';
    admin.data.hero.ctaSecondaryLink = '/files/resume.pdf';
    admin.data.hero.cvFileName = 'Maryam-CV.pdf';
    admin.data.about.bio = 'Updated biography';
    admin.data.about.mindsets = ['A new mindset'];
    admin.data.about.skills = ['A new skill'];
    admin.data.about.stats = [{ value: '50', label: 'New statistic' }];
    admin.data.experiences = [{ role: 'New role', company: 'New company', period: '2026' }];
    admin.data.testimonials = [
      { name: 'New author', role: 'Client', initials: 'NA', quote: 'New feedback' },
    ];
    admin.data.lifePhotos = [{ image: 'https://example.com/photo.png', caption: 'New life photo' }];
    admin.data.partners = ['New partner'];
    admin.data.footer.headline = 'New footer';
    admin.data.footer.socials = [{ label: 'New social', link: 'https://example.com' }];
    admin.data.content.aboutTitle = 'An editable heading';
    admin.save();
    await harness.navigateByUrl('/');
    const root = harness.routeNativeElement!;
    for (const text of [
      'Hello from',
      'Updated biography',
      'A new mindset',
      'A new skill',
      'New statistic',
      'New role',
      'New company',
      'New author',
      'New feedback',
      'New life photo',
      'New partner',
      'New footer',
      'New social',
      'An editable heading',
    ])
      expect(root.textContent).toContain(text);
    expect(root.querySelector('.site-logo')?.getAttribute('src')).toBe(
      'https://example.com/logo.png',
    );
    const cv = root.querySelector('.hero-actions a[download]');
    expect(cv?.getAttribute('href')).toBe('/files/resume.pdf');
    expect(cv?.getAttribute('download')).toBe('Maryam-CV.pdf');
  });

  it('asks in Persian before deleting a case and respects cancel or confirm', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    const count = admin.data.caseStudiesList.length;
    const id = admin.currentProject!.id;
    admin.deleteCurrent();
    expect(admin.confirmation()?.title).toBe('حذف مطالعهٔ موردی');
    expect(admin.data.caseStudiesList.length).toBe(count);
    admin.cancelPending();
    expect(admin.confirmation()).toBeNull();
    expect(admin.currentProject!.id).toBe(id);
    admin.deleteCurrent();
    admin.confirmPending();
    expect(admin.data.caseStudiesList.length).toBe(count - 1);
    expect(admin.data.detailedCaseStudies[id]).toBeUndefined();
  });

  it('rejects duplicate section anchors and duplicate tag names without saving', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    const detail = admin.currentDetail!;
    detail.sections[1].id = detail.sections[0].id;
    admin.save();
    expect(admin.toast()).toContain('شناسه‌های تکراری');
    expect(localStorage.getItem('maryam_portfolio_store')).toBeNull();
    detail.sections[1].id = 'unique-role';
    admin.newTag = 'Extra tag';
    admin.addTag();
    admin.data.tags[1].name = admin.data.tags[0].name;
    admin.save();
    expect(admin.toast()).toContain('تکراری');
    expect(localStorage.getItem('maryam_portfolio_store')).toBeNull();
  });
});
