import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () => import('./features/audit/presentation/audit-page/audit-page')
      .then(m => m.AuditPageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
