import { Routes } from '@angular/router';
import IndexComponent from './index/pages/index/index.component';
import DashboardPageComponent from './dashboard/pages/dashboard-page/dashboard-page.component';
import ProductComponent from './products/pages/product/product.component';
import { CrudProductComponent } from './products/pages/crud-product/crud-product.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch:'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/pages/landing-page/landing-page.component')
  },
  {
    path: 'index',
    component: IndexComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardPageComponent,
      },
      {
        path: 'productos',
        component: ProductComponent,
      },
      {
        path: 'crud-productos',
        component: CrudProductComponent
      }
    ]
  },
  {
    path: 'navbar',
    loadComponent: () => import('./shared/pages/navbar/navbar.component')
  },
  {
    path:'404',
    loadComponent: () => import('./shared/pages/error404/error404.component')

  },
  {
    path:'**',
    redirectTo: '404'
  },
];
