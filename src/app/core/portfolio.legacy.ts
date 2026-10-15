import { PortfolioData } from './portfolio.models';

export const LEGACY_PORTFOLIO_DATA: Omit<PortfolioData, 'schemaVersion'> = {
  header: {
    logo: 'MK',
    logoImage: '',
    logoAlt: 'Maryam portfolio',
    navLinks: [
      { label: 'Home', href: 'index.html' },
      { label: 'Case Studies', href: 'projects.html' },
      { label: 'About', href: 'index.html#about' },
      { label: 'Projects', href: 'index.html#projects' },
      { label: 'Experience', href: 'index.html#experience' },
      { label: 'Testimonials', href: 'index.html#testimonials' },
    ],
    ctaButton: { text: 'Contact Me', link: 'index.html#contact' },
  },
  hero: {
    badge: '✦ UX/UI & Product Designer',
    name: 'Maryam',
    greeting: "Hi, I'm",
    cvFileName: '',
    roleHeadline:
      'I build intuitive, scalable digital products and design systems that bridge business strategy and user delight.',
    ctaPrimaryText: 'View Projects ➔',
    ctaPrimaryLink: 'projects.html',
    ctaSecondaryText: 'Download CV ⬇',
    ctaSecondaryLink: '#contact',
    profileImage:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    badges: [
      { label: 'Product Strategy', icon: '✨', positionClass: 'card-top-right' },
      { label: 'UI/UX System', icon: '🎨', positionClass: 'card-bottom-left' },
    ],
  },
  partners: ['FintechX', 'NextGen', 'CloudSphere', 'Digikala', 'NovaLabs'],
  homeProjects: [
    {
      id: 'case-1',
      title: 'Project One',
      subtitle: 'Global Fintech Banking Platform',
      description:
        'A multi-currency banking system with streamlined end-to-end user journeys, payment flows, and responsive analytics.',
      tags: ['FinTech', 'Dashboard', 'Web App'],
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      caseStudyUrl: 'project-detail.html?id=case-1',
    },
    {
      id: 'case-2',
      title: 'Project Two',
      subtitle: 'HealthSync Telemedicine App',
      description:
        'Simplified patient-doctor booking flows, encrypted digital health records, and integrated video consult interfaces.',
      tags: ['Mobile App', 'HealthTech', 'iOS & Android'],
      image:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
      caseStudyUrl: 'project-detail.html?id=case-2',
    },
    {
      id: 'case-3',
      title: 'Project Three',
      subtitle: 'Cloud Analytics Enterprise Console',
      description:
        'Complex real-time monitoring graphs, customizable metric cards, and modular design token configurations.',
      tags: ['SaaS', 'Analytics', 'Design System'],
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      caseStudyUrl: 'project-detail.html?id=case-1',
    },
    {
      id: 'case-4',
      title: 'Project Four',
      subtitle: 'NextGen Marketplace & Checkout',
      description:
        'Seamless discovery flow, frictionless checkout, and high-conversion vendor onboarding workflows.',
      tags: ['E-Commerce', 'B2B', 'Web & Mobile'],
      image:
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      caseStudyUrl: 'project-detail.html?id=case-2',
    },
  ],
  caseStudiesList: [
    {
      id: 'case-1',
      title: 'Project Name',
      subtitle: 'Child Growth Monitoring Platform',
      description:
        'Designing clearer patient workflows for a pediatric medical platform, helping doctors review growth data, visit history, and bone-age results in one structured experience.',
      tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      ctaText: 'View case',
      detailUrl: 'project-detail.html?id=case-1',
    },
    {
      id: 'case-2',
      title: 'Project Name',
      subtitle: 'Child Growth Monitoring Platform',
      description:
        'Designing clearer patient workflows for a pediatric medical platform, helping doctors review growth data, visit history, and bone-age results in one structured experience.',
      tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
      image:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
      ctaText: 'View case',
      detailUrl: 'project-detail.html?id=case-2',
    },
  ],
  detailedCaseStudies: {
    'case-1': {
      tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
      title: 'Project Name',
      subtitle: 'Child Growth Monitoring Platform',
      leadSummary:
        'Designing clearer patient workflows for a pediatric medical platform, helping doctors review growth data, visit history, and bone-age results in one structured experience.',
      heroImage:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80',
      meta: [
        { label: 'TIMELINE', value: '3 Months' },
        { label: 'ROLE', value: 'Lead Product & Visual Designer, Systems' },
        { label: 'CLIENT', value: 'Pediatric MedTech Group' },
        { label: 'SCOPE', value: 'Web App & Design System' },
      ],
      sections: [
        {
          id: 'challenge',
          title: 'The challenge',
          paragraphs: [
            'Pediatricians routinely deal with fragmented data spread across separate growth tables, laboratory reports, and physical medical records.',
            'Our goal was to streamline patient review workflows and create a cohesive, single-screen dashboard.',
          ],
          quote:
            'How might we empower doctors to accurately assess years of growth anomalies in under 60 seconds?',
        },
        {
          id: 'role',
          title: 'My role',
          paragraphs: [
            'As Lead Product Designer, I directed discovery sprints through engineering handoff, defining tokenized components.',
          ],
        },
        {
          id: 'decisions',
          title: 'Three decisions I directed',
          subsections: [
            {
              heading: '01 · Standardizing clinical visual language',
              text: 'Standardized SVG curves calibrated to WHO growth charts.',
              image:
                'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1000&auto=format&fit=crop&q=80',
            },
            {
              heading: '02 · Prioritizing live clinical meeting workflows',
              text: 'Persistent side drawer architecture for instant bone-age scan lookups.',
              image:
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
      nextProject: {
        tags: ['Design Thinking', 'Design Thinking'],
        title: 'Project Name',
        subtitle: 'Child Growth Monitoring Platform',
        image:
          'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        link: 'project-detail.html?id=case-2',
      },
    },
    'case-2': {
      tags: ['HealthTech', 'Mobile App'],
      title: 'Project Name',
      subtitle: 'Child Growth Monitoring Platform',
      leadSummary:
        'Designing clearer patient workflows for a pediatric medical platform, helping doctors review growth data, visit history, and bone-age results.',
      heroImage:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1000&auto=format&fit=crop&q=80',
      meta: [
        { label: 'TIMELINE', value: '4 Months' },
        { label: 'ROLE', value: 'Mobile UX Architect' },
        { label: 'CLIENT', value: 'TeleHealth Global' },
        { label: 'SCOPE', value: 'iOS & Android' },
      ],
      sections: [
        {
          id: 'challenge',
          title: 'The challenge',
          paragraphs: [
            'Connecting continuous wearable pediatric monitors directly with pediatrician consoles.',
          ],
          quote: 'Making daily healthcare tracking transparent and encouraging.',
        },
      ],
      nextProject: {
        tags: ['Design Thinking'],
        title: 'Project Name',
        subtitle: 'Child Growth Monitoring Platform',
        image:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        link: 'project-detail.html?id=case-1',
      },
    },
  },
  about: {
    bio: 'Maryam, a passionate product designer who combines user research with high-craft UI. I help startups and tech enterprises turn complex workflows into friction-free, beautiful experiences.',
    mindsets: [
      'User-First empathy backed by qualitative & quantitative data',
      'Business alignment ensuring designs drive key conversion metrics',
      'Pixel-perfect precision and scalable tokenized design systems',
      'Cross-functional teamwork with developers and product managers',
    ],
    skills: [
      'User Research',
      'Wireframing',
      'Interactive Prototyping',
      'Figma & Tokens',
      'Design Systems',
      'Information Architecture',
      'Usability Testing',
      'Micro-interactions',
    ],
    stats: [
      { value: '4+', label: 'Years of Experience' },
      { value: '35+', label: 'Shipped Projects' },
      { value: '98%', label: 'Client Satisfaction' },
    ],
  },
  experiences: [
    { role: 'Senior Product Designer', company: 'PayFlow Financial', period: '2023 - Present' },
    { role: 'Product Designer', company: 'TechScale Studio', period: '2021 - 2023' },
    { role: 'UI/UX Designer', company: 'Creativo Agency', period: '2019 - 2021' },
  ],
  testimonials: [
    {
      quote:
        'Maryam transformed our complex financial product into a smooth, intuitive app our clients love.',
      name: 'Alex K.',
      role: 'Head of Product',
      initials: 'AK',
    },
    {
      quote:
        'Exceptional design craft and attention to detail. Maryam bridges user needs and engineering limits seamlessly.',
      name: 'Sara R.',
      role: 'Engineering Lead',
      initials: 'SR',
    },
    {
      quote:
        'Fast iterations, reliable deliverables, and a complete joy to collaborate with during our major relaunch.',
      name: 'David T.',
      role: 'Founder & CEO',
      initials: 'DT',
    },
  ],
  lifePhotos: [
    {
      image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80',
      caption: 'Workshop & Mentorship',
    },
    {
      image:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=80',
      caption: 'Design Critique Sessions',
    },
    {
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80',
      caption: 'Collaborative Problem Solving',
    },
    {
      image:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=80',
      caption: 'Creative Flow & Coffee',
    },
  ],
  footer: {
    badge: 'Available for new projects',
    headline: 'Let\'s build something <span class="text-gradient">meaningful.</span>',
    subtext:
      "Have an idea, a project, or just want to say hello?\nI'd love to hear from you and see what we can create together.",
    socials: [
      { label: '✉ Email', link: 'mailto:hello@example.com' },
      { label: 'in Linkdin', link: 'https://linkedin.com' },
      { label: '✈ Telegram', link: 'https://t.me' },
      { label: '🏀 Dribbble', link: 'https://dribbble.com' },
    ],
    copyright: 'Copyright © 2026 Maryam Aslan. All rights reserved.',
  },
  tags: [],
  content: {
    projectsTitle: 'Last <span class="text-gradient">Projects</span>',
    projectsDescription: 'From real problems to thoughtful solutions.',
    allCasesText: 'See All Case Study ➔',
    aboutTitle: 'Who <span class="text-gradient">Am I?</span>',
    mindsetsTitle: 'My Mindset',
    skillsTitle: 'Skills & Tools',
    experienceTitle: 'My <span class="text-gradient">Experience</span>',
    testimonialsTitle: 'What It\'s Like To <span class="text-gradient">Work With Me</span>',
    photosTitle: 'The <span class="text-gradient">Person</span> Behind The Pixels',
    listingTitle: 'Case Studies',
    listingDescription: 'From real problems to thoughtful solutions.',
    overviewTitle: 'OVERVIEW',
    exploreTitle: 'Explore more work',
    viewCaseText: 'View case',
    topText: '↑ Top',
  },
  customHtmlEmbed: '',
};
