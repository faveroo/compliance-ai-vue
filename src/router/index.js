import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Login from '../views/LoginView.vue';
import Register from '../views/RegisterView.vue';
import AppLayout from '../components/AppLayout.vue';
import Dashboard from '../views/DashboardView.vue';
import DocumentDetails from '../views/DocumentDetailsView.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'document/:id', name: 'DocumentDetails', component: DocumentDetails, props: (route) => ({ docId: route.params.id }) },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth) {
    const user = await getCurrentUser();
    if (!user) {
      return { name: 'Login' };
    }
  }
});

export default router;
