import { TestBed } from '@angular/core/testing';
import { MediaStore } from './media-store';
import { normalizePortfolio } from './portfolio-normalize';
import { LEGACY_PORTFOLIO_DATA } from './portfolio.legacy';
import { DEFAULT_PORTFOLIO_DATA } from './portfolio.data';

describe('Media and existing data compatibility', () => {
  it('upgrades untouched demo sections to the screenshot design while preserving edited content', () => {
    const old = structuredClone(LEGACY_PORTFOLIO_DATA);
    expect(normalizePortfolio(old).caseStudiesList.length).toBe(4);
    old.hero.name = 'Custom name';
    old.hero.profileImage = 'asset:existing-photo';
    old.caseStudiesList[0].title = 'Custom project';
    const migrated = normalizePortfolio(old);
    expect(migrated.hero.name).toBe('Custom name');
    expect(migrated.hero.profileImage).toBe('asset:existing-photo');
    expect(migrated.caseStudiesList[0].title).toBe('Custom project');
    expect(migrated.footer.copyright).toContain('Maryam Adel');
  });
  it('rejects unsupported uploads and large files before storing anything', async () => {
    const media = TestBed.inject(MediaStore);
    await expect(
      media.upload(new File(['<svg/>'], 'test.svg', { type: 'image/svg+xml' }), 'image'),
    ).rejects.toThrow('JPG');
    await expect(media.upload(new File(['test'], 'test.exe'), 'document')).rejects.toThrow('PDF');
    const large = new File(['test'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(large, 'size', { value: 9 * 1024 * 1024 });
    await expect(media.upload(large, 'image')).rejects.toThrow('8 MB');
    expect(media.pending()).toBe(0);
  });

  it('migrates original tags to shared references while keeping default content intact', () => {
    const data = normalizePortfolio(structuredClone(DEFAULT_PORTFOLIO_DATA));
    expect(data.hero.name).toBe('Maryam');
    expect(data.hero.greeting).toBe("Hi, I'm");
    const projectTag = data.caseStudiesList[0].tags[0];
    expect(data.tags.find((tag) => tag.id === projectTag)?.name).toBe('Design Thinking');
    expect(data.detailedCaseStudies['case-1'].tags[0]).toBe(projectTag);
    expect(normalizePortfolio(structuredClone(data)).tags).toEqual(data.tags);
    expect(DEFAULT_PORTFOLIO_DATA.caseStudiesList[0].tags[0]).toBe('Design Thinking');
  });
});
