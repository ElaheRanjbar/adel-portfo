import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Maryam - UI/UX & Product Designer',
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects').then((m) => m.Projects),
    title: 'Case Studies - Maryam Portfolio',
  },
  {
    path: 'project-detail',
    loadComponent: () =>
      import('./pages/project-detail/project-detail').then((m) => m.ProjectDetail),
    title: 'Case Study Details - Maryam Portfolio',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    title: 'Portfolio admin',
  },
  {
    path: 'admin/:section',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    title: 'Portfolio admin',
  },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'projects.html', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'project-detail.html', redirectTo: 'project-detail', pathMatch: 'full' },
  { path: 'admin-portal.html', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
