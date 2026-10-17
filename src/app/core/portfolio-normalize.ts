import { createId } from './create-id';
import { DEFAULT_PORTFOLIO_DATA } from './portfolio.data';
import { LEGACY_PORTFOLIO_DATA } from './portfolio.legacy';
import { PortfolioData } from './portfolio.models';

/** Upgrades existing browser data without discarding the original content. */
export function normalizePortfolio(value: Partial<PortfolioData> = {}): PortfolioData {
  value = structuredClone(value);
  if (value.schemaVersion !== 3) {
    // Only replace untouched demo sections. User-edited content and uploaded media survive.
    const names = new Map((value.tags || []).map((tag) => [tag.id, tag.name]));
    const canonical = (item: unknown): string =>
      JSON.stringify(item, (key, current) => {
        if (
          (key === 'paragraphs' || key === 'subsections') &&
          Array.isArray(current) &&
          !current.length
        )
          return undefined;
        if (key === 'tags' && Array.isArray(current))
          return current.map((tag) => names.get(tag) || tag);
        return current;
      });
    for (const key of Object.keys(
      LEGACY_PORTFOLIO_DATA,
    ) as (keyof typeof LEGACY_PORTFOLIO_DATA)[]) {
      if (canonical(value[key]) === canonical(LEGACY_PORTFOLIO_DATA[key])) {
        (value as unknown as Record<string, unknown>)[key] = structuredClone(
          DEFAULT_PORTFOLIO_DATA[key],
        );
      }
    }
  }
  const defaults = structuredClone(DEFAULT_PORTFOLIO_DATA);
  const data = { ...defaults, ...value };
  data.header = { ...defaults.header, ...value.header };
  data.hero = { ...defaults.hero, ...value.hero };
  data.schemaVersion = 3;
  data.content = { ...defaults.content, ...value.content };
  data.tags = structuredClone(value.tags ?? []);
  for (const tags of tagCollections(data)) {
    for (let i = 0; i < tags.length; i++) {
      const existing = data.tags.find((t) => t.id === tags[i] || t.name === tags[i]);
      if (existing) tags[i] = existing.id;
      else {
        const tag = { id: `tag-${data.tags.length + 1}-${createId()}`, name: tags[i] };
        data.tags.push(tag);
        tags[i] = tag.id;
      }
    }
  }
  for (const detail of Object.values(data.detailedCaseStudies)) {
    for (const section of detail.sections) {
      section.paragraphs ??= [];
      section.subsections ??= [];
    }
  }
  return data;
}

export function tagCollections(data: PortfolioData): string[][] {
  return [
    ...data.homeProjects.map((p) => p.tags),
    ...data.caseStudiesList.map((p) => p.tags),
    ...Object.values(data.detailedCaseStudies).flatMap((p) => [
      p.tags,
      ...(p.nextProject ? [p.nextProject.tags] : []),
    ]),
  ];
}
