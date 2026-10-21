import type { PortfolioData } from './portfolio.models';

export const DEFAULT_FLOATING_BADGES: PortfolioData['hero']['badges'] = [
  {
    label: 'Figma graphic',
    icon: '',
    image: '/assets/portfolio/hero-figma.png',
    positionClass: 'card-bottom-left',
  },
  {
    label: 'Design graphic',
    icon: '',
    image: '/assets/portfolio/hero-design.png',
    positionClass: 'card-top-right',
  },
];
export function defaultBadgeImage(position: string): string {
  return DEFAULT_FLOATING_BADGES.find((badge) => badge.positionClass === position)?.image || '';
}
