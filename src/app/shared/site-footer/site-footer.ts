import { Icon } from '../../shared/icon/icon';
import { Component, inject, input } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { PortfolioLink } from '../../core/portfolio-link';

@Component({
  selector: 'app-site-footer',
  imports: [Icon, PortfolioLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  readonly store = inject(PortfolioStore);
  readonly tallBottom = input(false);
  socialIcon(label: string): string {
    const name = label.toLowerCase();
    if (name.includes('link')) return 'linkedin';
    if (name.includes('telegram')) return 'telegram';
    if (name.includes('dribb')) return 'dribbble';
    return 'email';
  }
}
