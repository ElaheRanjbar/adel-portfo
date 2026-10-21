import { normalizePortfolio } from './portfolio-normalize';
import { pageSnapshot, reconcilePage } from './admin-page-save';

describe('independent sidebar page publishing', () => {
  it('saves introduction, resume and badges together while preserving other page drafts', () => {
    const published = normalizePortfolio();
    const draft = structuredClone(published);
    draft.hero.name = 'New name';
    draft.hero.badges[0].label = 'New badge';
    draft.hero.ctaSecondaryLink = '/resume.pdf';
    draft.hero.cvFileName = 'My CV.pdf';
    draft.footer.headline = 'Unpublished footer';
    draft.tags.push({ id: 'tag-invalid', name: '' });
    const saved = pageSnapshot(published, draft, 'hero');
    expect(saved.hero).toEqual(draft.hero);
    expect(saved.footer).toEqual(published.footer);
    expect(saved.tags).toEqual(published.tags);
    reconcilePage(draft, published, saved, saved);
    expect(draft.footer.headline).toBe('Unpublished footer');
    expect(draft.tags.at(-1)?.name).toBe('');
  });

  it('saves every case and its stories, tags and metadata without publishing other pages', () => {
    const published = normalizePortfolio();
    const draft = structuredClone(published);
    draft.tags.push(
      { id: 'tag-used', name: 'Used tag' },
      { id: 'tag-draft', name: 'Unpublished tag' },
    );
    draft.caseStudiesList[0].tags = ['tag-used'];
    draft.detailedCaseStudies['case-1'].tags = ['tag-used'];
    draft.detailedCaseStudies['case-1'].title = 'New introduction';
    draft.detailedCaseStudies['case-1'].sections[0].html = '<p>New story</p>';
    draft.detailedCaseStudies['case-1'].meta[0].value = 'New metadata';
    draft.caseStudiesList[1].title = 'Second edited case';
    draft.detailedCaseStudies['case-2'].sections.reverse();
    draft.footer.headline = 'Pending footer';
    draft.homeProjects[1].title = 'Pending home card';
    const saved = pageSnapshot(published, draft, 'projects');
    expect(saved.caseStudiesList).toEqual(draft.caseStudiesList);
    expect(saved.detailedCaseStudies).toEqual(draft.detailedCaseStudies);
    expect(saved.footer).toEqual(published.footer);
    expect(saved.tags.some((tag) => tag.id === 'tag-used')).toBe(true);
    expect(saved.tags.some((tag) => tag.id === 'tag-draft')).toBe(false);
    expect(saved.homeProjects[1].title).not.toBe('Pending home card');
    const accepted = structuredClone(saved);
    accepted.detailedCaseStudies['case-1'].sections[0].html = '<p>Sanitized story</p>';
    reconcilePage(draft, published, saved, accepted);
    expect(draft.detailedCaseStudies['case-1'].sections[0].html).toBe('<p>Sanitized story</p>');
    expect(draft.footer.headline).toBe('Pending footer');
    expect(draft.homeProjects[1].title).toBe('Pending home card');
    expect(draft.tags.some((tag) => tag.id === 'tag-draft')).toBe(true);
  });

  it('saves complete Header, About and Footer pages including their nested collections', () => {
    const published = normalizePortfolio();
    const draft = structuredClone(published);
    draft.header.logo = 'New logo';
    draft.header.ctaButton.text = 'New CTA';
    draft.header.navLinks = [{ label: 'Home', href: '/' }];
    draft.about.bio = 'New bio';
    draft.about.stats = [{ value: '42', label: 'Projects' }];
    draft.about.skills = ['New skill'];
    draft.footer.headline = 'New headline';
    draft.footer.socials = [{ label: 'Platform', link: 'https://example.com' }];
    for (const page of ['header', 'about', 'footer'] as const) {
      const saved = pageSnapshot(published, draft, page);
      expect(saved[page]).toEqual(draft[page]);
      expect(saved.hero).toEqual(published.hero);
      for (const other of ['header', 'about', 'footer'] as const)
        if (other !== page) expect(saved[other]).toEqual(published[other]);
    }
  });

  it('publishes deletions and related cleanup alongside other edits on the Cases page', () => {
    const published = normalizePortfolio();
    published.detailedCaseStudies['case-2'].nextProject!.link = '/project-detail?id=case-1';
    const draft = structuredClone(published);
    draft.caseStudiesList.shift();
    delete draft.detailedCaseStudies['case-1'];
    delete draft.detailedCaseStudies['case-2'].nextProject;
    draft.caseStudiesList[0].title = 'Edited second card';
    const saved = pageSnapshot(published, draft, 'projects');
    expect(saved.homeProjects.some((project) => project.id === 'case-1')).toBe(false);
    expect(saved.detailedCaseStudies['case-1']).toBeUndefined();
    expect(saved.detailedCaseStudies['case-2'].nextProject).toBeUndefined();
    expect(saved.caseStudiesList[0].title).toBe('Edited second card');
  });

  it('does not publish Home page membership edits through the Cases page', () => {
    const published = normalizePortfolio();
    const draft = structuredClone(published);
    draft.homeProjects = [];
    draft.caseStudiesList[0].title = 'Edited case card';
    const pageSaved = pageSnapshot(published, draft, 'projects');
    expect(pageSaved.homeProjects.map((project) => project.id)).toEqual(
      published.homeProjects.map((project) => project.id),
    );
    expect(pageSaved.homeProjects[0].title).toBe('Edited case card');
    reconcilePage(draft, published, pageSaved, pageSaved);
    expect(draft.homeProjects).toEqual([]);
    const saved = pageSnapshot(published, draft, 'projects', new Map([['case-1', false]]));
    expect(saved.homeProjects.some((project) => project.id === 'case-1')).toBe(false);
    expect(saved.homeProjects.some((project) => project.id === 'case-2')).toBe(true);
  });

  it('does not overwrite typing made while a save is in flight', () => {
    const published = normalizePortfolio();
    const draft = structuredClone(published);
    draft.hero.name = 'Sent name';
    const sent = pageSnapshot(published, draft, 'hero');
    draft.hero.name = 'New unsaved typing';
    reconcilePage(draft, published, sent, sent);
    expect(draft.hero.name).toBe('New unsaved typing');
  });
});
