import { DEFAULT_PORTFOLIO_DATA } from './portfolio.data';
import { normalizePortfolio } from './portfolio-normalize';

describe('Floating graphic compatibility', () => {
  it('upgrades old text badges without losing them, while respecting explicit removal in new backups', () => {
    const old = structuredClone(DEFAULT_PORTFOLIO_DATA);
    old.schemaVersion = 3;
    old.hero.badges = [
      { label: 'Existing text badge', icon: '✨', positionClass: 'card-top-right' },
    ];
    const upgraded = normalizePortfolio(old);
    expect(upgraded.hero.badges.map((badge) => badge.image).filter(Boolean)).toEqual([
      '/assets/portfolio/hero-figma.png',
      '/assets/portfolio/hero-design.png',
    ]);
    expect(upgraded.hero.badges.at(-1)?.label).toBe('Existing text badge');
    upgraded.hero.badges = [];
    expect(normalizePortfolio(upgraded).hero.badges).toEqual([]);
    const defaults = normalizePortfolio();
    defaults.hero.badges[0].image = '/api/media/custom/file';
    defaults.hero.profileImage = '/another-portrait.png';
    expect(normalizePortfolio(defaults).hero.badges[0].image).toBe('/api/media/custom/file');
  });
});
