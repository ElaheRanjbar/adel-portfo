import { MemoryPortfolioApi } from '../../../testing/portfolio-api';
import { ApiClient } from '../../core/api-client';
import { AdminAuth } from '../../core/admin-auth';
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

  it('opens Persian field help from an English editor without changing the draft', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/hero', Admin);
    const root = harness.routeNativeElement!;
    const before = JSON.stringify(admin.data);
    expect(root.querySelector('.admin-body')?.getAttribute('dir')).toBe('ltr');
    expect(root.querySelector('input[aria-label="Name"]')).toBeTruthy();
    const button = root.querySelector('button[aria-label="Help: Name"]') as HTMLButtonElement;
    button.click();
    await harness.fixture.whenStable();
    const dialog = root.querySelector('#admin-help-dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('h2')?.textContent).toBe('Name');
    expect(dialog.querySelector('p')?.getAttribute('lang')).toBe('fa');
    expect(dialog.querySelector('p')?.textContent).toContain('نمایش داده می‌شود');
    expect(JSON.stringify(admin.data)).toBe(before);
    (dialog.querySelector('button[aria-label="Close help"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('has one Save per sidebar page and publishes all of that page without other drafts', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/hero', Admin);
    admin.data.hero.name = 'Saved introduction';
    admin.data.hero.ctaSecondaryLink = '/resume.pdf';
    admin.data.hero.cvFileName = 'Resume.pdf';
    admin.data.hero.badges[0].label = 'Saved badge';
    admin.data.footer.headline = 'Unpublished footer';
    admin.data.footer.socials = [{ label: 'Pending platform', link: 'https://example.com' }];
    const root = harness.routeNativeElement!;
    expect(root.querySelector('.menu-item[href="/admin/html"]')).toBeNull();
    const buttons = root.querySelectorAll('app-admin-save .page-save > button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Save page');
    (buttons[0] as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    const store = TestBed.inject(PortfolioStore);
    expect(store.data().hero.ctaSecondaryLink).toBe('/resume.pdf');
    expect(store.data().hero.name).toBe('Saved introduction');
    expect(store.data().hero.badges[0].label).toBe('Saved badge');
    expect(store.data().footer.headline).not.toBe('Unpublished footer');
    expect(admin.data.footer.headline).toBe('Unpublished footer');
    expect(admin.editor.revision).toBe(store.revision());
    const footer = await harness.navigateByUrl('/admin/footer', Admin);
    await footer.savePage();
    expect(store.data().footer.headline).toBe('Unpublished footer');
    expect(store.data().footer.socials[0].label).toBe('Pending platform');
    for (const page of [
      'hero',
      'header',
      'projects',
      'tags',
      'home-projects',
      'about',
      'experience',
      'testimonials',
      'photos',
      'partners',
      'footer',
      'content',
    ]) {
      await harness.navigateByUrl('/admin/' + page, Admin);
      expect(
        harness.routeNativeElement!.querySelectorAll('app-admin-save .page-save > button').length,
      ).toBe(1);
    }
  });

  it('ignores invalid drafts on other pages and keeps the draft when a save fails', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/hero', Admin);
    const detail = admin.data.detailedCaseStudies['case-1'];
    detail.sections[1].id = detail.sections[0].id;
    admin.data.hero.ctaSecondaryLink = '/resume.pdf';
    await admin.savePage();
    expect(TestBed.inject(PortfolioStore).data().hero.ctaSecondaryLink).toBe('/resume.pdf');
    admin.data.hero.name = 'Keep failed draft';
    const revision = admin.editor.revision;
    TestBed.inject(MemoryPortfolioApi).fail = true;
    await admin.savePage();
    expect(admin.data.hero.name).toBe('Keep failed draft');
    expect(admin.editor.revision).toBe(revision);
    expect(admin.toast()).toContain('unavailable');
  });

  it('creates an independent full case study and renders all of its details', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.addProject();
    harness.detectChanges();
    setField(harness.routeNativeElement!, 'Title', 'New banking case');
    setField(harness.routeNativeElement!, 'Detail page title', 'Banking redesign');
    setField(harness.routeNativeElement!, 'Introduction / summary', 'A full new product story.');
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
    await admin.savePage('projects');
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
    await admin.savePage('projects');
    await harness.navigateByUrl('/project-detail?id=case-1');
    const content = harness.routeNativeElement!.querySelector('.narrative-block app-rich-content')!;
    expect(content.querySelector('strong')?.textContent).toBe('clear');
    expect(content.querySelector('p')?.style.textAlign).toBe('center');
    expect(content.querySelector('img')?.getAttribute('src')).toBe('/design.png');
    expect(content.querySelector('a')?.hasAttribute('download')).toBe(true);
    expect(
      TestBed.inject(MemoryPortfolioApi).data.detailedCaseStudies['case-1'].sections[0].html,
    ).toContain('A rich story');
  });

  it('keeps drafts across admin pages without publishing until saving that section', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin', Admin);
    setField(harness.routeNativeElement!, 'Name', 'Draft name');
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/admin/tags', Admin);
    const again = await harness.navigateByUrl('/admin/hero', Admin);
    expect(again.data.hero.name).toBe('Draft name');
    expect(TestBed.inject(PortfolioStore).data().hero.name).toBe('Maryam');
    await again.savePage('hero');
    expect(TestBed.inject(PortfolioStore).data().hero.name).toBe('Draft name');
  });

  it('reuses tags across cards and details and propagates renames and deletions', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/tags', Admin);
    admin.newTag = 'Research';
    admin.newTagLink = 'https://example.com/research';
    admin.addTag();
    const tag = admin.data.tags.at(-1)!;
    admin.data.caseStudiesList[0].tags = [tag.id];
    admin.data.detailedCaseStudies['case-1'].tags = [tag.id];
    admin.data.homeProjects[0].tags = [tag.id];
    tag.name = 'User Research';
    await admin.savePage('projects');
    await harness.navigateByUrl('/projects?sort=oldest');
    expect(harness.routeNativeElement?.querySelector('.pill-tag')?.textContent).toContain(
      'User Research',
    );
    expect(harness.routeNativeElement?.querySelector('a.pill-tag')?.getAttribute('href')).toBe(
      '/projects?tag=' + tag.id,
    );
    await harness.navigateByUrl('/project-detail?id=case-1');
    expect(harness.routeNativeElement?.querySelector('a.detail-tag')?.getAttribute('href')).toBe(
      '/projects?tag=' + tag.id,
    );
    expect(harness.routeNativeElement?.querySelector('.detail-tag')?.textContent).toContain(
      'User Research',
    );
    const editor = await harness.navigateByUrl('/admin/tags', Admin);
    expect(editor.data.tags.find((item) => item.id === tag.id)?.link).toBe(
      'https://example.com/research',
    );
    editor.deleteTag(tag.id);
    await editor.savePage('tags');
    await harness.navigateByUrl('/');
    expect(
      harness.routeNativeElement?.querySelector('.project-card .project-tags')?.textContent,
    ).not.toContain('User Research');
  });

  it('shows and filters only tags assigned to each case study, including explicitly empty assignments', async () => {
    const store = TestBed.inject(PortfolioStore);
    const data = store.draft();
    data.tags.push(
      { id: 'tag-assigned', name: 'Assigned research' },
      { id: 'tag-unused', name: 'Unused library tag' },
    );
    for (const detail of Object.values(data.detailedCaseStudies)) detail.tags = [];
    data.detailedCaseStudies['case-1'].tags = ['tag-assigned', 'tag-assigned'];
    // Listing cards still contain old demo assignments. They must not override actual case tags.
    await store.save(data);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?sort=oldest');
    const cards = harness.routeNativeElement!.querySelectorAll('.listing-card');
    expect(
      [...cards[0].querySelectorAll('.pill-tag')].map((tag) => tag.textContent?.trim()),
    ).toEqual(['Assigned research']);
    expect(cards[1].querySelectorAll('.pill-tag').length).toBe(0);
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.filter-toggle')!.click();
    harness.detectChanges();
    const options = harness.routeNativeElement!.querySelectorAll('.filter-option');
    expect([...options].map((option) => option.textContent?.trim())).toEqual(['Assigned research']);
    await harness.navigateByUrl('/projects?tag=tag-assigned');
    expect(harness.routeNativeElement!.querySelectorAll('.listing-card').length).toBe(1);
    await harness.navigateByUrl('/projects?tag=tag-unused');
    expect(harness.routeNativeElement!.querySelectorAll('.listing-card').length).toBe(0);
  });

  it('keeps listing, detail and featured tags in sync when either case editor picker changes', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.data.tags.push({ id: 'tag-sync', name: 'Assigned tag' });
    admin.addProject();
    const project = admin.currentProject!;
    admin.toggleFeatured(project);
    harness.detectChanges();
    const detailPicker = harness.routeNativeElement!.querySelectorAll('app-tag-picker')[1];
    const detailCheckbox = [...detailPicker.querySelectorAll('label')]
      .find((label) => label.textContent?.includes('Assigned tag'))!
      .querySelector('input')!;
    detailCheckbox.click();
    await harness.fixture.whenStable();
    expect(project.tags).toEqual(['tag-sync']);
    expect(admin.currentDetail!.tags).toEqual(['tag-sync']);
    expect(admin.data.homeProjects.find((item) => item.id === project.id)!.tags).toEqual([
      'tag-sync',
    ]);
    const listingPicker = harness.routeNativeElement!.querySelector('app-tag-picker')!;
    const listingCheckbox = [...listingPicker.querySelectorAll('label')]
      .find((label) => label.textContent?.includes('Assigned tag'))!
      .querySelector('input')!;
    listingCheckbox.click();
    await harness.fixture.whenStable();
    expect(project.tags).toEqual([]);
    expect(admin.currentDetail!.tags).toEqual([]);
    expect(admin.data.homeProjects.find((item) => item.id === project.id)!.tags).toEqual([]);
    await admin.savePage('projects');
    const saved = TestBed.inject(PortfolioStore).data();
    expect(saved.caseStudiesList.find((item) => item.id === project.id)!.tags).toEqual([]);
    expect(saved.detailedCaseStudies[project.id].tags).toEqual([]);
  });

  it('deletes the detail, featured card and recommendations for a removed case', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    admin.data.detailedCaseStudies['case-2'].nextProject!.link = '/project-detail?id=case-1';
    admin.removeProject(0);
    await admin.savePage('projects');
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
    for (const scope of [
      'header',
      'hero',
      'about',
      'experience',
      'testimonials',
      'photos',
      'partners',
      'footer',
      'content',
    ] as const)
      await admin.savePage(scope);
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

  it('asks in English before deleting a case and respects cancel or confirm', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    const count = admin.data.caseStudiesList.length;
    const id = admin.currentProject!.id;
    admin.deleteCurrent();
    expect(admin.confirmation()?.title).toBe('Delete case study');
    expect(admin.data.caseStudiesList.length).toBe(count);
    admin.cancelPending();
    expect(admin.confirmation()).toBeNull();
    expect(admin.currentProject!.id).toBe(id);
    admin.deleteCurrent();
    await admin.confirmPending();
    expect(admin.data.caseStudiesList.length).toBe(count - 1);
    expect(admin.data.detailedCaseStudies[id]).toBeUndefined();
  });

  it('rejects duplicate section anchors and duplicate tag names without saving', async () => {
    const harness = await RouterTestingHarness.create();
    const admin = await harness.navigateByUrl('/admin/projects', Admin);
    const detail = admin.currentDetail!;
    detail.sections[1].id = detail.sections[0].id;
    await admin.savePage('projects');
    expect(admin.toast()).toContain('duplicate or invalid section IDs');
    expect(TestBed.inject(MemoryPortfolioApi).writes).toBe(0);
    detail.sections[1].id = 'unique-role';
    admin.newTag = 'Extra tag';
    admin.addTag();
    admin.data.tags[1].name = admin.data.tags[0].name;
    await admin.savePage('tags');
    expect(admin.toast()).toContain('unique');
    expect(TestBed.inject(MemoryPortfolioApi).writes).toBe(0);
  });
});
