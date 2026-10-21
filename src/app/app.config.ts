import { PortfolioTitle } from './core/portfolio-title';
import { PortfolioStore } from './core/portfolio-store';
import { AdminAuth } from './core/admin-auth';
import { ViewportScroller } from '@angular/common';
import { SmoothScroller } from './core/smooth-scroller';
import {
  ApplicationConfig,
  provideAppInitializer,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: TitleStrategy, useClass: PortfolioTitle },
    provideAppInitializer(() =>
      Promise.all([inject(PortfolioStore).load(), inject(AdminAuth).restore()]),
    ),
    { provide: ViewportScroller, useExisting: SmoothScroller },
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
