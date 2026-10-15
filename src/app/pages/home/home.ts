import { AutoSlider } from '../../shared/auto-slider/auto-slider';
import { HomeExperience } from '../../shared/home-experience/home-experience';
import { HomeAbout } from '../../shared/home-about/home-about';
import { HomeCommunity } from '../../shared/home-community/home-community';
import { Icon } from '../../shared/icon/icon';
import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { TagName } from '../../core/tag-name';
import { PortfolioLink } from '../../core/portfolio-link';

import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';

@Component({
  selector: 'app-home',
  imports: [
    AutoSlider,
    HomeExperience,
    HomeAbout,
    HomeCommunity,
    Icon,
    MediaUrl,
    TagName,
    SiteHeader,
    SiteFooter,
    PortfolioLink,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly store = inject(PortfolioStore);
}
