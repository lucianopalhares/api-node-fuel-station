import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from './layouts/AppLayout.vue';
import StationsPage from './pages/StationsPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';
import ImportsPage from './pages/ImportsPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/', component: AppLayout,
      children: [
        { path: '', redirect: '/stations' },
        { path: 'stations', component: StationsPage },
        { path: 'imports', component: ImportsPage },
        { path: 'exports', component: PlaceholderPage, props: { title: 'Exportação' } },
      ],
    },
  ],
});
