import { sanitizePortfolio } from './content-sanitizer';
import { Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PortfolioData, ProjectCard, CaseStudy } from '../../shared/portfolio.models';
import { DEFAULT_PORTFOLIO_DATA } from '../../shared/portfolio.seed';
import { Database } from './database';
import { validatePortfolio } from './portfolio.schema';

type Fields = Record<string, string>;
const card: Fields = {
  title: 'title',
  subtitle: 'subtitle',
  description: 'description',
  image: 'image',
  ctaText: 'cta_text',
  detailUrl: 'detail_url',
  caseStudyUrl: 'case_study_url',
};
const caseFields: Fields = {
  title: 'title',
  subtitle: 'subtitle',
  leadSummary: 'lead_summary',
  heroImage: 'hero_image',
};
const nextFields: Fields = {
  title: 'title',
  subtitle: 'subtitle',
  description: 'description',
  image: 'image',
  link: 'link',
};
export const COLLECTIONS: Record<
  string,
  { path: string; table: string; fields: Fields; strings?: boolean }
> = {
  navigation: {
    path: 'header.navLinks',
    table: 'navigation_links',
    fields: { label: 'label', href: 'href' },
  },
  badges: {
    path: 'hero.badges',
    table: 'hero_badges',
    fields: { label: 'label', icon: 'icon', positionClass: 'position_class', image: 'image' },
  },
  partners: { path: 'partners', table: 'partners', fields: { value: 'value' }, strings: true },
  mindsets: {
    path: 'about.mindsets',
    table: 'about_mindsets',
    fields: { value: 'value' },
    strings: true,
  },
  skills: {
    path: 'about.skills',
    table: 'about_skills',
    fields: { value: 'value' },
    strings: true,
  },
  stats: {
    path: 'about.stats',
    table: 'about_stats',
    fields: {
      value: 'value',
      label: 'label',
      title: 'title',
      icon: 'icon',
      backgroundImage: 'background_image',
    },
  },
  experiences: {
    path: 'experiences',
    table: 'experiences',
    fields: { role: 'role', company: 'company', period: 'period' },
  },
  testimonials: {
    path: 'testimonials',
    table: 'testimonials',
    fields: {
      quote: 'quote',
      name: 'name',
      role: 'role',
      initials: 'initials',
      image: 'image',
      link: 'link',
      fullQuote: 'full_quote',
    },
  },
  photos: {
    path: 'lifePhotos',
    table: 'life_photos',
    fields: { image: 'image', caption: 'caption' },
  },
  socials: {
    path: 'footer.socials',
    table: 'footer_socials',
    fields: { label: 'label', link: 'link', image: 'image', icon: 'icon' },
  },
};
export function atPath(data: any, path: string): any {
  return path.split('.').reduce((value, key) => value[key], data);
}
function setPath(data: any, path: string, value: any): void {
  const parts = path.split('.');
  const key = parts.pop()!;
  atPath(data, parts.join('.') || '')[key] = value;
}

@Injectable()
export class PortfolioRepository {
  constructor(private readonly database: Database) {
    if (!this.database.sql.prepare('SELECT 1 FROM settings LIMIT 1').get())
      this.replace(this.defaults(), 0);
  }
  defaults(): PortfolioData {
    const seed = structuredClone(DEFAULT_PORTFOLIO_DATA);
    const tags = new Map<string, string>();
    const groups = [
      ...seed.caseStudiesList,
      ...seed.homeProjects,
      ...Object.values(seed.detailedCaseStudies),
      ...Object.values(seed.detailedCaseStudies).flatMap((item) =>
        item.nextProject ? [item.nextProject] : [],
      ),
    ];
    for (const group of groups)
      group.tags = group.tags.map((name) => {
        if (!tags.has(name)) tags.set(name, `tag-${randomUUID()}`);
        return tags.get(name)!;
      });
    const modern = (url: string) =>
      url.replace(/^index\.html(?=[?#]|$)/, '/').replace(/^projects\.html(?=[?#]|$)/, '/projects');
    seed.header.navLinks = seed.header.navLinks.map((link) => ({
      ...link,
      href: modern(link.href),
    }));
    seed.header.ctaButton.link = modern(seed.header.ctaButton.link);
    seed.tags = [...tags].map(([name, id]) => ({ id, name }));
    return seed;
  }
  revision(): number {
    return Number(
      this.database.sql.prepare('SELECT version FROM portfolio_revision WHERE id=1').get()!.version,
    );
  }
  snapshot() {
    return { data: this.read(), revision: this.revision() };
  }
  private rows(table: string, where = '', ...args: string[]): any[] {
    return this.database.sql
      .prepare(`SELECT * FROM ${table} ${where} ORDER BY position`)
      .all(...args);
  }
  private decode(row: any, fields: Fields): any {
    return Object.fromEntries(
      Object.entries(fields)
        .filter(([, column]) => row[column] !== null)
        .map(([key, column]) => [key, row[column]]),
    );
  }
  private insert(table: string, value: any, fields: Fields, extra: Record<string, any> = {}): void {
    const record = {
      ...extra,
      ...Object.fromEntries(
        Object.entries(fields).map(([key, column]) => [column, value[key] ?? null]),
      ),
    };
    const keys = Object.keys(record);
    this.database.sql
      .prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
      .run(...Object.values(record));
  }
  private tags(table: string, owner: string): string[] {
    return this.rows(table, 'WHERE owner_id=?', owner).map((row) => row.tag_id);
  }
  private writeTags(table: string, owner: string, tags: string[]): void {
    tags.forEach((tag, position) =>
      this.database.sql.prepare(`INSERT INTO ${table} VALUES(?,?,?)`).run(owner, tag, position),
    );
  }
  read(): PortfolioData {
    const settings = Object.fromEntries(
      this.database.sql
        .prepare('SELECT * FROM settings')
        .all()
        .map((row) => [row.section, JSON.parse(row.data as string)]),
    );
    const data: any = {
      ...settings.site,
      customHtmlEmbed: '',
      header: settings.header,
      hero: settings.hero,
      about: settings.about,
      footer: settings.footer,
      content: settings.content,
    };
    for (const { table, path, fields, strings } of Object.values(COLLECTIONS)) {
      const value = this.rows(table).map((row) => (strings ? row.value : this.decode(row, fields)));
      if (!path.includes('.')) data[path] = value;
      else setPath(data, path, value);
    }
    data.tags = this.database.sql
      .prepare('SELECT * FROM tags ORDER BY rowid')
      .all()
      .map((row) => this.decode(row, { id: 'id', name: 'name', link: 'link' }));
    data.caseStudiesList = this.rows('projects').map((row) => ({
      id: row.id,
      ...this.decode(row, card),
      tags: this.tags('project_tags', row.id),
    }));
    data.homeProjects = this.rows('home_projects').map((row) => ({
      id: row.id,
      ...this.decode(row, card),
      tags: this.tags('home_project_tags', row.id),
    }));
    data.detailedCaseStudies = {};
    for (const row of this.database.sql.prepare('SELECT * FROM case_studies').all()) {
      const id = row.id as string;
      const detail: any = { ...this.decode(row, caseFields), tags: this.tags('case_tags', id) };
      detail.meta = this.rows('case_metadata', 'WHERE case_id=?', id).map((meta) => ({
        label: meta.label,
        value: meta.value,
      }));
      detail.sections = this.rows('case_sections', 'WHERE case_id=?', id).map((section) => ({
        id: section.id,
        ...this.decode(section, {
          title: 'title',
          navTitle: 'nav_title',
          html: 'html',
          quote: 'quote',
        }),
        ...(section.quote_first === null ? {} : { quoteFirst: !!section.quote_first }),
        paragraphs: JSON.parse(section.paragraphs),
        subsections: this.rows(
          'case_subsections',
          'WHERE case_id=? AND section_id=?',
          id,
          section.id,
        ).map((sub) =>
          this.decode(sub, {
            heading: 'heading',
            text: 'text',
            image: 'image',
            caption: 'caption',
          }),
        ),
      }));
      const next = this.database.sql.prepare('SELECT * FROM next_projects WHERE case_id=?').get(id);
      if (next)
        detail.nextProject = {
          ...this.decode(next, nextFields),
          tags: this.tags('next_project_tags', id),
        };
      data.detailedCaseStudies[id] = detail;
    }
    return data;
  }
  private target(link: string | undefined, projects: Set<string>): string | null {
    if (!link) return null;
    try {
      const id = new URL(link, 'https://portfolio.local').searchParams.get('id');
      return id && projects.has(id) ? id : null;
    } catch {
      return null;
    }
  }
  replace(input: unknown, expected: number): { data: PortfolioData; revision: number } {
    const data = sanitizePortfolio(validatePortfolio(input));
    return this.database.transaction(() => {
      if (expected !== this.revision())
        throw new ConflictException(
          'Content changed on the server. Reload before saving to avoid overwriting another edit.',
        );
      // All content updates commit together; auth and media are independent and survive resets.
      for (const table of [
        'home_projects',
        'projects',
        'tags',
        'settings',
        ...Object.values(COLLECTIONS).map((item) => item.table),
      ])
        this.database.sql.exec(`DELETE FROM ${table}`);
      const { navLinks, ...header } = data.header;
      const { badges, ...hero } = data.hero;
      const { mindsets, skills, stats, ...about } = data.about;
      const { socials, ...footer } = data.footer;
      for (const [section, value] of Object.entries({
        header,
        hero,
        about,
        footer,
        content: data.content,
        site: { schemaVersion: 4, customHtmlEmbed: data.customHtmlEmbed },
      }))
        this.database.sql
          .prepare('INSERT INTO settings VALUES(?,?)')
          .run(section, JSON.stringify(value));
      for (const collection of Object.values(COLLECTIONS))
        atPath(data, collection.path).forEach((item: any, position: number) =>
          this.insert(
            collection.table,
            collection.strings ? { value: item } : item,
            collection.fields,
            { position },
          ),
        );
      data.tags.forEach((tag) =>
        this.insert('tags', tag, { id: 'id', name: 'name', link: 'link' }),
      );
      const projectIds = new Set(data.caseStudiesList.map((item) => item.id));
      data.caseStudiesList.forEach((project, position) => {
        this.insert('projects', project, card, { id: project.id, position });
        this.writeTags('project_tags', project.id, project.tags);
      });
      data.homeProjects.forEach((project, position) => {
        this.insert('home_projects', project, card, {
          id: project.id,
          position,
          linked_project_id: projectIds.has(project.id)
            ? project.id
            : this.target(project.caseStudyUrl, projectIds),
        });
        this.writeTags('home_project_tags', project.id, project.tags);
      });
      for (const [id, detail] of Object.entries(data.detailedCaseStudies)) {
        this.insert('case_studies', detail, caseFields, { id });
        this.writeTags('case_tags', id, detail.tags);
        detail.meta.forEach((meta, position) =>
          this.insert(
            'case_metadata',
            meta,
            { label: 'label', value: 'value' },
            { case_id: id, position },
          ),
        );
        detail.sections.forEach((section, position) => {
          this.insert(
            'case_sections',
            section,
            { id: 'id', title: 'title', navTitle: 'nav_title', html: 'html', quote: 'quote' },
            {
              case_id: id,
              position,
              quote_first: section.quoteFirst === undefined ? null : Number(section.quoteFirst),
              paragraphs: JSON.stringify(section.paragraphs || []),
            },
          );
          section.subsections?.forEach((sub, position) =>
            this.insert(
              'case_subsections',
              sub,
              { heading: 'heading', text: 'text', image: 'image', caption: 'caption' },
              { case_id: id, section_id: section.id, position },
            ),
          );
        });
        if (detail.nextProject) {
          this.insert('next_projects', detail.nextProject, nextFields, {
            case_id: id,
            target_project_id: this.target(detail.nextProject.link, projectIds),
          });
          this.writeTags('next_project_tags', id, detail.nextProject.tags);
        }
      }
      this.database.sql
        .prepare('UPDATE portfolio_revision SET version=version+1, updated_at=? WHERE id=1')
        .run(new Date().toISOString());
      return this.snapshot();
    });
  }
}
