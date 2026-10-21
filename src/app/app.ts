import { Component, inject } from '@angular/core';
import { PortfolioStore } from './core/portfolio-store';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(PortfolioStore);
}
