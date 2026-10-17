export interface ProjectCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  image: string;
  caseStudyUrl?: string;
  ctaText?: string;
  detailUrl?: string;
}

export interface CaseSection {
  html?: string;
  id: string;
  title: string;
  navTitle?: string;
  quoteFirst?: boolean;
  paragraphs?: string[];
  quote?: string;
  subsections?: { heading: string; text: string; image: string; caption?: string }[];
}

export interface CaseStudy {
  tags: string[];
  title: string;
  subtitle: string;
  leadSummary: string;
  heroImage: string;
  meta: { label: string; value: string }[];
  sections: CaseSection[];
  nextProject?: {
    tags: string[];
    title: string;
    subtitle: string;
    image: string;
    link: string;
    description?: string;
  };
}

export interface PortfolioData {
  schemaVersion?: number;
  header: {
    logo: string;
    logoImage: string;
    logoAlt: string;
    navLinks: { label: string; href: string }[];
    ctaButton: { text: string; link: string };
  };
  hero: {
    badge: string;
    greeting: string;
    cvFileName: string;
    name: string;
    roleHeadline: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
    profileImage: string;
    badges: { label: string; icon: string; positionClass: string }[];
  };
  partners: string[];
  homeProjects: ProjectCard[];
  caseStudiesList: ProjectCard[];
  detailedCaseStudies: Record<string, CaseStudy>;
  about: {
    bio: string;
    mindsets: string[];
    skills: string[];
    stats: {
      value: string;
      label: string;
      title?: string;
      icon?: string;
      backgroundImage?: string;
    }[];
  };
  experiences: { role: string; company: string; period: string }[];
  testimonials: {
    quote: string;
    name: string;
    role: string;
    initials: string;
    image?: string;
    link?: string;
    fullQuote?: string;
  }[];
  lifePhotos: { image: string; caption: string }[];
  footer: {
    badge: string;
    headline: string;
    subtext: string;
    socials: { label: string; link: string }[];
    copyright: string;
  };
  tags: { id: string; name: string }[];
  content: {
    projectsTitle: string;
    projectsDescription: string;
    allCasesText: string;
    aboutTitle: string;
    mindsetsTitle: string;
    skillsTitle: string;
    experienceTitle: string;
    testimonialsTitle: string;
    photosTitle: string;
    listingTitle: string;
    listingDescription: string;
    overviewTitle: string;
    exploreTitle: string;
    viewCaseText: string;
    topText: string;
    cvTitle?: string;
    cvDescription?: string;
    testimonialMoreText?: string;
  };
  customHtmlEmbed: string;
}
