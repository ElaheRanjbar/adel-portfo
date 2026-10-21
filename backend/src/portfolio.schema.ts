import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import type { PortfolioData } from '../../shared/portfolio.models';

const text = z.string().max(20000);
const short = z.string().max(500);
const rich = z.string().max(1000000);
const id = z.string().regex(/^[a-zA-Z][\w-]{0,149}$/);
const url = z
  .string()
  .max(4000)
  .refine((value) => {
    if (!value) return true;
    if (/[\u0000-\u0020]/.test(value)) return false;
    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value);
        return !!parsed.hostname && ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }
    return /^(?:mailto:|tel:|\/(?!\/)|#|\.\/)/i.test(value);
  }, 'Use a valid HTTP(S) URL, mailto/tel link or a local path.');
const list = <T extends z.ZodType>(schema: T) => z.array(schema).max(1000);
const object = z.strictObject;
const tagIds = list(id);
const project = object({
  id,
  title: text,
  subtitle: text,
  description: text,
  tags: tagIds,
  image: url,
  caseStudyUrl: url.optional(),
  ctaText: short.optional(),
  detailUrl: url.optional(),
});
const next = object({
  tags: tagIds,
  title: text,
  subtitle: text,
  image: url,
  link: url,
  description: text.optional(),
});
export const sectionSchema = object({
  id,
  title: text,
  navTitle: short.optional(),
  html: rich.optional(),
  quoteFirst: z.boolean().optional(),
  paragraphs: list(text).optional(),
  quote: text.optional(),
  subsections: list(
    object({ heading: text, text, image: url, caption: text.optional() }),
  ).optional(),
});
export const caseSchema = object({
  tags: tagIds,
  title: text,
  subtitle: text,
  leadSummary: text,
  heroImage: url,
  meta: list(object({ label: short, value: text })),
  sections: list(sectionSchema),
  nextProject: next.optional(),
});
export const portfolioSchema = object({
  schemaVersion: z.number().int().optional(),
  header: object({
    logo: short,
    logoImage: url,
    logoAlt: short,
    navLinks: list(object({ label: short, href: url })),
    ctaButton: object({ text: short, link: url }),
  }),
  hero: object({
    badge: short,
    greeting: short,
    cvFileName: short,
    name: short,
    roleHeadline: text,
    ctaPrimaryText: short,
    ctaPrimaryLink: url,
    ctaSecondaryText: short,
    ctaSecondaryLink: url,
    profileImage: url,
    badges: list(
      object({
        label: short,
        icon: short,
        positionClass: z.enum(['card-top-right', 'card-bottom-left']),
        image: url.optional(),
      }),
    ),
  }),
  partners: list(short),
  homeProjects: list(project),
  caseStudiesList: list(project),
  detailedCaseStudies: z.record(id, caseSchema),
  about: object({
    bio: text,
    mindsets: list(text),
    skills: list(short),
    stats: list(
      object({
        value: short,
        label: text,
        title: short.optional(),
        icon: short.optional(),
        backgroundImage: url.optional(),
      }),
    ),
  }),
  experiences: list(object({ role: short, company: short, period: short })),
  testimonials: list(
    object({
      quote: text,
      name: short,
      role: short,
      initials: short,
      image: url.optional(),
      link: url.optional(),
      fullQuote: text.optional(),
    }),
  ),
  lifePhotos: list(object({ image: url, caption: text })),
  footer: object({
    badge: short,
    headline: text,
    subtext: text,
    socials: list(
      object({
        label: short,
        link: url,
        image: url.optional(),
        icon: z.enum(['', 'email', 'linkedin', 'telegram', 'dribbble', 'link']).optional(),
      }),
    ),
    copyright: text,
  }),
  tags: list(object({ id, name: short.trim().min(1), link: url.optional() })),
  content: object(
    Object.fromEntries(
      [
        'projectsTitle',
        'projectsDescription',
        'allCasesText',
        'aboutTitle',
        'mindsetsTitle',
        'skillsTitle',
        'experienceTitle',
        'testimonialsTitle',
        'photosTitle',
        'listingTitle',
        'listingDescription',
        'overviewTitle',
        'exploreTitle',
        'viewCaseText',
        'topText',
      ].map((key) => [key, text]),
    ) as Record<string, typeof text>,
  ).extend({
    cvTitle: text.optional(),
    cvDescription: text.optional(),
    testimonialMoreText: text.optional(),
  }),
  customHtmlEmbed: rich,
});

export function validatePortfolio(input: unknown): PortfolioData {
  const result = portfolioSchema.safeParse(input);
  if (!result.success)
    throw new BadRequestException({
      message: 'Invalid portfolio content.',
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  const data = result.data as unknown as PortfolioData;
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length)
      throw new BadRequestException(`${label} must be unique.`);
  };
  unique(
    data.tags.map((tag) => tag.id),
    'Tag IDs',
  );
  unique(
    data.tags.map((tag) => tag.name.trim().toLowerCase()),
    'Tag names',
  );
  unique(
    data.caseStudiesList.map((item) => item.id),
    'Project IDs',
  );
  unique(
    data.homeProjects.map((item) => item.id),
    'Home project IDs',
  );
  const ids = new Set(data.tags.map((tag) => tag.id));
  const groups = [
    ...data.caseStudiesList,
    ...data.homeProjects,
    ...Object.values(data.detailedCaseStudies),
    ...Object.values(data.detailedCaseStudies).flatMap((detail) =>
      detail.nextProject ? [detail.nextProject] : [],
    ),
  ];
  if (groups.some((item) => item.tags.some((tag) => !ids.has(tag))))
    throw new BadRequestException('A project references an unknown tag.');
  const projects = new Set(data.caseStudiesList.map((project) => project.id));
  for (const [key, detail] of Object.entries(data.detailedCaseStudies)) {
    if (!projects.has(key))
      throw new BadRequestException('A case study must belong to an existing project.');
    unique(
      detail.sections.map((section) => section.id),
      `Section IDs in ${key}`,
    );
  }
  return data;
}
