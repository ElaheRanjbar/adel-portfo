import type { PortfolioData } from './portfolio.models';

export const ADMIN_PAGES = [
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
] as const;
export type AdminPage = (typeof ADMIN_PAGES)[number];
export function isAdminPage(value: string): value is AdminPage {
  return (ADMIN_PAGES as readonly string[]).includes(value);
}
const paths: Partial<Record<AdminPage, string>> = {
  hero: 'hero',
  header: 'header',
  about: 'about',
  experience: 'experiences',
  testimonials: 'testimonials',
  photos: 'lifePhotos',
  partners: 'partners',
  footer: 'footer',
  content: 'content',
  'home-projects': 'homeProjects',
};

function read(value: any, path: string): any {
  return path.split('.').reduce((item, key) => item?.[key], value);
}
function copy(target: any, source: any, path: string): void {
  const keys = path.split('.');
  const key = keys.pop()!;
  const parent = keys.reduce((item, key) => item[key], target);
  const value = read(source, path);
  if (value === undefined) delete parent[key];
  else parent[key] = structuredClone(value);
}
function removeProjects(data: PortfolioData, ids: Set<string>): void {
  data.caseStudiesList = data.caseStudiesList.filter((project) => !ids.has(project.id));
  for (const id of ids) delete data.detailedCaseStudies[id];
  data.homeProjects = data.homeProjects.filter((project) => !ids.has(project.id));
  const targetId = (link?: string) =>
    new URL(link || '/', 'https://portfolio.local').searchParams.get('id');
  for (const home of data.homeProjects)
    if (ids.has(targetId(home.caseStudyUrl)!)) home.caseStudyUrl = '/projects';
  for (const detail of Object.values(data.detailedCaseStudies))
    if (ids.has(targetId(detail.nextProject?.link)!)) delete detail.nextProject;
}
function tagGroups(data: PortfolioData): string[][] {
  return [
    ...data.homeProjects,
    ...data.caseStudiesList,
    ...Object.values(data.detailedCaseStudies),
    ...Object.values(data.detailedCaseStudies).flatMap((detail) =>
      detail.nextProject ? [detail.nextProject] : [],
    ),
  ].map((item) => item.tags);
}

/** Publish all edits on one sidebar page, starting from the last server snapshot. */
export function pageSnapshot(
  published: PortfolioData,
  draft: PortfolioData,
  page: AdminPage,
  featuredChanges: ReadonlyMap<string, boolean> = new Map(),
): PortfolioData {
  const result = structuredClone(published);
  const path = paths[page];
  if (path) copy(result, draft, path);
  if (page === 'tags') {
    result.tags = structuredClone(draft.tags);
    const valid = new Set(result.tags.map((tag) => tag.id));
    for (const group of tagGroups(result))
      group.splice(0, group.length, ...group.filter((id) => valid.has(id)));
  }
  if (page === 'projects') {
    const wanted = new Set(draft.caseStudiesList.map((project) => project.id));
    removeProjects(
      result,
      new Set(
        published.caseStudiesList
          .filter((project) => !wanted.has(project.id))
          .map((project) => project.id),
      ),
    );
    result.caseStudiesList = structuredClone(draft.caseStudiesList);
    result.detailedCaseStudies = Object.fromEntries(
      result.caseStudiesList.map((project) => [
        project.id,
        structuredClone(draft.detailedCaseStudies[project.id]),
      ]),
    );
    for (const project of result.caseStudiesList) {
      const index = result.homeProjects.findIndex((home) => home.id === project.id);
      const feature = featuredChanges.get(project.id);
      if (feature === false) {
        if (index >= 0) result.homeProjects.splice(index, 1);
        continue;
      }
      const original = published.caseStudiesList.find((item) => item.id === project.id);
      const changed = JSON.stringify(original) !== JSON.stringify(project);
      if ((index >= 0 && changed) || (index < 0 && feature === true)) {
        const home = {
          ...structuredClone(project),
          caseStudyUrl: project.detailUrl || '/project-detail?id=' + project.id,
        };
        if (index >= 0) result.homeProjects[index] = home;
        else result.homeProjects.push(home);
      }
    }
  }
  // Only new tags referenced by this page are dependencies of its save.
  const referenced = new Set(tagGroups(result).flat());
  for (const tag of draft.tags)
    if (referenced.has(tag.id) && !result.tags.some((saved) => saved.id === tag.id))
      result.tags.push(structuredClone(tag));
  return result;
}

/** Adopt server sanitization only where it changed the submitted page, preserving other drafts. */
export function reconcilePage(
  draft: PortfolioData,
  previous: PortfolioData,
  submitted: PortfolioData,
  saved: PortfolioData,
): void {
  const merge = (target: any, before: any, sent: any, accepted: any): any => {
    if (JSON.stringify(before) === JSON.stringify(sent)) return target;
    if (Array.isArray(sent)) {
      if (
        sent.every((item) => item && typeof item === 'object' && typeof item.id === 'string') &&
        Array.isArray(before) &&
        before.every((item) => item && typeof item.id === 'string')
      ) {
        const sentById = new Map(sent.map((item) => [item.id, item]));
        const beforeById = new Map(before.map((item) => [item.id, item]));
        const acceptedById = new Map((accepted || []).map((item: any) => [item.id, item]));
        const next = (target || [])
          .filter((item: any) => !beforeById.has(item.id) || sentById.has(item.id))
          .map((item: any) =>
            sentById.has(item.id)
              ? merge(
                  item,
                  beforeById.get(item.id),
                  sentById.get(item.id),
                  acceptedById.get(item.id),
                )
              : item,
          );
        return next;
      }
      return JSON.stringify(target) === JSON.stringify(sent) ? structuredClone(accepted) : target;
    }
    if (!sent || typeof sent !== 'object')
      return JSON.stringify(target) === JSON.stringify(sent) ? structuredClone(accepted) : target;
    const next = target && typeof target === 'object' ? target : {};
    for (const key of new Set([...Object.keys(before || {}), ...Object.keys(sent)])) {
      if (!(key in sent)) {
        if (JSON.stringify(next[key]) === JSON.stringify(before?.[key])) delete next[key];
      } else next[key] = merge(next[key], before?.[key], sent[key], accepted?.[key]);
    }
    return next;
  };
  merge(draft, previous, submitted, saved);
}
