import { DEFAULT_FLOATING_BADGES } from './floating-badges';
import { CaseStudy, PortfolioData, ProjectCard } from './portfolio.models';

const projectDescription =
  'Designing clearer patient workflows for a pediatric medical platform, helping doctors review growth data, visit history, and bone-age results in one structured experience.';
const projectImages = ['project-finance', 'project-learning', 'project-legal', 'project-clinic'];
const projects: ProjectCard[] = projectImages.map((image, index) => ({
  id: `case-${index + 1}`,
  title: 'Project Name',
  subtitle: 'Child Growth Monitoring Platform',
  description: projectDescription,
  tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
  image: `/assets/portfolio/${image}.webp`,
  ctaText: 'View case',
  detailUrl: `/project-detail?id=case-${index + 1}`,
  caseStudyUrl: `/project-detail?id=case-${index + 1}`,
}));

const detail: CaseStudy = {
  tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
  title: 'Project Name',
  subtitle: 'Child Growth Monitoring Platform',
  leadSummary: projectDescription,
  heroImage: '',
  meta: [
    { label: 'Company', value: 'Hyvatech' },
    { label: 'Role', value: 'User researcher, Visual designer (Solo)' },
    { label: 'Category', value: 'User researcher, Visual designer' },
    { label: 'Timeline', value: 'May – June 2023' },
  ],
  sections: [
    {
      id: 'challenge',
      title: 'The challenge',
      navTitle: 'challenge',
      paragraphs: [
        'IranScam already owned the difficult assets: organisation profiles, structured data, and community reviews covering brokers, prop firms, exchanges and gold platforms. What it did not own was the last step.\nTo answer a question as ordinary as “is this broker trustworthy for what I need?”, a user still had to search across pages, decode financial terminology, and assemble the evidence themselves. Most people stopped before they finished.\nSo the brief was narrow, and the risk inside it was not: make that evidence conversational without letting the assistant become the thing people trust.',
      ],
      quote:
        'The assistant should help people inspect evidence, not persuade them with confident prose.',
    },
    {
      id: 'role',
      title: 'My role',
      navTitle: 'My role',
      paragraphs: [
        'I was Design Director on the project, working at the intersection of product framing, trust, interaction design and implementation.\nMohammad Rezaei was the executing product designer, doing the hands-on interface design and the coded prototype.\n•  Define what the assistant answers, what it shows, and what it refuses.\n•  Direct the conversation, evidence-card, comparison and authentication patterns.\n•  Set the quality bar for responsive, bilingual, accessible and host-safe behaviour.\n•  Review the product architecture and align client, domain, design and engineering decisions.\nThe leadership problem was never to make the assistant look more intelligent. It was to keep a small AI surface coherent, credible and buildable under real constraints — and to be the person accountable for where its answers came from.',
      ],
    },
    {
      id: 'decisions',
      title: 'Three decisions I directed',
      navTitle: 'Three decisions',
      subsections: [
        {
          heading: '01 — Structured evidence, flexible language',
          text: 'Every recommendation pairs conversational prose with a structured organisation card. One shared frame carries identity, organisation type, score, review count, the highlights relevant to the question, and the actions the user can take next.\nProse and card data are separate inputs. The interface never parses model-generated text to reconstruct a score, a regulator or an action — so the hierarchy holds however the wording changes, and a confident sentence can never invent a fact the card is responsible for.',
          image: '',
        },
        {
          heading: '02 — A product living inside another product',
          text: 'This was never a standalone chat app. It had to coexist safely with a website it did not control, so I directed two explicit boundaries.\n•  Host boundary: isolate the widget so it cannot collide with the host site’s CSS, JavaScript or layout.\n•  Data boundary: let the interface work against stable contracts instead of waiting on the final backend to exist.\nThe architecture uses an iframe for isolation, a message contract for resize, theme, navigation, authentication and configuration, and a separate seam for chat data. Collapsed, normal and expanded modes let a complex task borrow room without taking over the page it is sitting on.',
          image: '',
        },
        {
          heading: '03 — Protect the user’s intent, and their documents',
          text: 'Three small flows carried a disproportionate share of the product risk, and each one was resolved by asking what the user would lose rather than what the interface would gain.\n•  Comparison: a dense multi-column view does not fit the normal panel, so it opens as an overlay and auto-expands the desktop widget while the conversation stays intact underneath.\n•  Authentication: gated actions hold the pending action and resume it after sign-in. Guests get two complete exchanges before the gate, and the blocked message continues on the other side of it.\n•  Attachments: people would predictably upload receipts and ID documents to prove a complaint, so V1 refuses files outright and routes them to the approved contact channel.\nThe attachment decision is the one I would defend hardest. The safest way to handle sensitive financial documents in a widget embedded on someone else’s page is to never accept them in the first place.',
          image: '',
        },
      ],
    },
    {
      id: 'ai-assisted',
      title: 'AI-assisted, code-first delivery',
      navTitle: 'AI-assisted',
      paragraphs: [
        'The project ran from raw requirements to structured documentation, design direction, coded UI, browser review, QA and engineering handoff — with no separate Figma stage.\nChatGPT supported requirement extraction, the product brief, the PRD, content structure, states and frontend architecture.\nMohammad designed and prototyped the interface in Claude and Claude Code, with Gemini producing selected visual and motion assets. I set the product model, reviewed the iterations that mattered, rejected the unsafe and the over-engineered, and kept UX decisions inside the boundaries engineering could actually hold.\nAI raised the throughput. Product judgement and accountability stayed human.',
      ],
    },
    {
      id: 'responsive',
      title: 'Responsive and bilingual by behaviour',
      navTitle: 'Responsive and bilingual',
      paragraphs: [
        'The widget was designed as one product across desktop and mobile, not a desktop panel reduced to a narrower width. Collapsed and open states, touch-sized controls, narrow-card behaviour, mobile comparison, keyboard and focus order, host positioning and per-message text direction were each decided rather than inherited.',
      ],
      subsections: [
        {
          heading: '',
          text: '',
          image: '',
          caption:
            'Opened, it stops being a corner panel. A conversation on a phone needs the whole sheet, and the things that qualify an answer have to survive that change of scale.',
        },
        {
          heading: '',
          text: '',
          image: '',
          caption:
            'English/LTR is the presentation default for this case study. Persian/RTL and mixed-script content remain supported behaviour of the system — a Persian sentence carrying a Latin broker name and a Latin figure resolves per message, not per app.',
        },
      ],
    },
    {
      id: 'validation',
      title: 'Validation and handoff',
      navTitle: 'Validation',
      paragraphs: [
        'Formal primary research and a large usability study were outside this engagement, so validation had to come from somewhere honest: client and domain-expert review, engineering review, responsive QA, RTL/LTR QA, interactive walkthroughs and stakeholder approval.\nThe coded prototype and the architecture documentation gave engineering both the intended interaction behaviour and the explicit contracts — host isolation, data, authentication, and the safety rules covering attachments and financial advice.',
      ],
    },
    {
      id: 'outcome',
      title: 'Outcome',
      navTitle: 'Outcome',
      paragraphs: [
        'Within roughly 20 days the team delivered:\n•  A structured product and requirement model.\n•  A responsive embeddable assistant built on grounded evidence patterns.\n•  Comparison, auth-resumption and safety flows.\n•  Bilingual foundations and a reusable code-first component system.\n•  An interactive prototype and an implementation-ready handoff.\nThe strongest outcome was refusing to treat a compact AI feature as a widget. It was scoped, argued and handed over as a product surface — with an evidence hierarchy, host boundaries, responsive behaviour, safety rules and named engineering accountability.\nIt shipped. The assistant is live on iranscam.net, running against real organisation data rather than the demo content pictured here.',
      ],
    },
    {
      id: 'takeaway',
      title: 'Takeaway',
      navTitle: 'Takeaway',
      quoteFirst: true,
      quote: 'AI can make the output faster. It cannot make the product boundaries matter less.',
      paragraphs: [
        'In an evidence-sensitive financial context, being explicit about what the system knows, what it shows and what it refuses is not a constraint on the design. It is the design.',
      ],
    },
    { id: 'team', title: '', navTitle: 'Team', paragraphs: [] },
  ],
  nextProject: {
    tags: ['Design Thinking', 'Design Thinking', 'Design Thinking'],
    title: 'Project Name',
    subtitle: 'Child Growth Monitoring Platform',
    image: '/assets/portfolio/project-clinic.webp',
    link: '/project-detail?id=case-4',
  },
};

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  schemaVersion: 4,
  header: {
    logo: 'MA',
    logoImage: '/assets/portfolio/maryam-logo.png',
    logoAlt: 'Maryam Adel',
    navLinks: [
      { label: 'Home', href: 'index.html' },
      { label: 'Case Studies', href: 'projects.html' },
      { label: 'My Story', href: 'index.html#about' },
    ],
    ctaButton: { text: 'Contact Me', link: 'index.html#contact' },
  },
  hero: {
    badge: 'UX/UI & Product Designer',
    greeting: "Hi, I'm",
    name: 'Maryam',
    roleHeadline: 'I turn complex problems into clear, intuitive products.',
    profileImage: '/assets/portfolio/maryam-portrait.webp',
    badges: structuredClone(DEFAULT_FLOATING_BADGES),
    ctaPrimaryText: 'See my work',
    ctaPrimaryLink: '#projects',
    ctaSecondaryText: 'Download CV',
    ctaSecondaryLink: '#contact',
    cvFileName: '',
  },
  partners: [
    'Design Thinking',
    'Problem Solving',
    'Design Thinking',
    'Design System',
    'Responsive Design',
    'Attention to Detail',
    'Prototype',
  ],
  homeProjects: structuredClone(projects),
  caseStudiesList: structuredClone(projects),
  detailedCaseStudies: Object.fromEntries(
    projects.map((project, index) => [
      project.id,
      {
        ...structuredClone(detail),
        nextProject: {
          ...structuredClone(detail.nextProject!),
          link: `/project-detail?id=${index === 3 ? 'case-1' : 'case-4'}`,
        },
      },
    ]),
  ),
  about: {
    bio: 'My path to product design wasn’t linear. I studied Computer Engineering, where I learned to think in systems, understand how things work beneath the surface, and approach problems logically. Along the way, I found myself increasingly drawn to the human side of technology—how people interact with products, what they need, and what makes an experience feel effortless.\nToday, I bring both sides together. I use my technical background to understand the complexity behind a product, and design to turn that complexity into something clear, useful, and intuitive.\nAI has become part of how I work and what I design. I use it to move faster from ambiguous problems to meaningful directions—synthesizing research, exploring ideas, prototyping, and challenging assumptions. I’m especially interested in designing AI-powered experiences that understand intent and make complex tasks feel simple and natural.\nFor me, product design sits somewhere between logic and empathy, systems and people. And that’s what keeps me curious: there’s always another problem to unpack, another perspective to discover, and another thing to learn.',
    mindsets: [
      'Honest ideas, feedback, and conversations.',
      'We solve problems together, not just hand off tasks.',
      'Always curious, always improving.',
      'Build, learn, improve, repeat.',
      'Decisions start with real user needs.',
    ],
    skills: [
      'Usability Testing',
      'User Interviews',
      'Jobs to Be Done',
      'Benchmarking',
      'A/B Testing',
      'Design Thinking',
      'Wireframing',
      'Competitive Analysis',
      'Problem Solving',
      'Product Design',
      'Information Architecture',
      'User Flows',
      'Figma',
      'Focus Groups',
      'Surveys',
      '+ More',
    ],
    stats: [
      {
        title: 'Experience',
        icon: 'experience',
        value: '+6 Years',
        label: 'of Product Design Experience',
      },
      {
        title: 'location',
        icon: 'location',
        value: 'Remote worldwide',
        label: 'Hybrid/on-site in Iran',
        backgroundImage: '/assets/portfolio/location-map.webp',
      },
      { title: 'Currently', icon: 'monitor', value: 'Product Design', label: '@ Hivatech' },
    ],
  },
  experiences: [
    {
      role: 'Senior Product Designer',
      company: 'Hyvatech',
      period: 'Iran, Yazd -February 2024 - Present',
    },
    {
      role: 'Product Designer',
      company: 'Deponet',
      period: 'Iran, Yazd -October 2024 - February 2024',
    },
    {
      role: 'Product Designer',
      company: 'CeramPakhsh',
      period: 'Iran, Yazd -September 2021 - October 2024',
    },
  ],
  testimonials: Array.from({ length: 4 }, () => ({
    quote:
      'I had a really valuable mentoring session. She provided clear, structured, and practical guidance throughout our conversation. I especially appreciated…',
    name: 'Zahra Hakimianfar',
    role: 'Product Manager',
    initials: 'ZH',
    image: '/assets/portfolio/testimonial-avatar.webp',
    link: 'https://www.linkedin.com',
    fullQuote: '',
  })),
  lifePhotos: [
    { image: '/assets/portfolio/life-outdoors.webp', caption: '' },
    { image: '/assets/portfolio/life-learning.webp', caption: 'A chapter of learning' },
    { image: '/assets/portfolio/life-hosting.webp', caption: 'Love to cook & host' },
    { image: '/assets/portfolio/life-flowers.webp', caption: 'Flowers are my palette' },
    { image: '/assets/portfolio/life-next.webp', caption: 'Before the…' },
  ],
  footer: {
    badge: 'Available',
    headline: 'Let’s build something meaningful.',
    subtext:
      'Have an idea, a project, or just want to say hello?\nI’d love to hear from you and see what we can create together.',
    socials: [
      { label: 'Email', link: 'mailto:hello@example.com' },
      { label: 'Linkdin', link: 'https://linkedin.com' },
      { label: 'Telegram', link: 'https://t.me' },
      { label: 'Dribbble', link: 'https://dribbble.com' },
    ],
    copyright: 'Copyright © 2026 Maryam Adel. All rights reserved.',
  },
  tags: [],
  content: {
    projectsTitle: 'Last <span class="text-gradient">Projects</span>',
    projectsDescription: 'From real problems to thoughtful solutions.',
    allCasesText: 'See All Case Study',
    aboutTitle: 'Who Am <span class="text-gradient">I</span> ?',
    mindsetsTitle: 'My ideal team',
    skillsTitle: 'My Skill',
    experienceTitle: '<span class="text-gradient">My</span> Experience',
    testimonialsTitle: 'What It\'s like To <span class="text-gradient">Work</span> With Me.',
    photosTitle: 'The <span class="text-gradient">Person</span> Behind The Pixels',
    listingTitle: 'Case Studies',
    listingDescription:
      'A selection of projects shaped by real-world challenges, curiosity, and learning.',
    overviewTitle: 'Contents',
    exploreTitle: 'Explore more work',
    viewCaseText: 'View case',
    topText: 'Top',
    cvTitle: 'Get to know my work better',
    cvDescription: 'Download my CV for the full details.',
    testimonialMoreText: 'See more',
  },
  customHtmlEmbed: '',
};
