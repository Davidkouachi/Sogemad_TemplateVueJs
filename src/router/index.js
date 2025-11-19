import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/function/stores/auth';

// Routes enfants du layout principal
const appChildren = [
    { path: '/', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: 'dashboard', requiresAuth: true } },
    { path: '/uikit/formlayout', name: 'formlayout', component: () => import('@/views/uikit/FormLayout.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/input', name: 'input', component: () => import('@/views/uikit/InputDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/button', name: 'button', component: () => import('@/views/uikit/ButtonDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/table', name: 'table', component: () => import('@/views/uikit/TableDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/list', name: 'list', component: () => import('@/views/uikit/ListDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/tree', name: 'tree', component: () => import('@/views/uikit/TreeDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/panel', name: 'panel', component: () => import('@/views/uikit/PanelsDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/overlay', name: 'overlay', component: () => import('@/views/uikit/OverlayDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/media', name: 'media', component: () => import('@/views/uikit/MediaDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/message', name: 'message', component: () => import('@/views/uikit/MessagesDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/file', name: 'file', component: () => import('@/views/uikit/FileDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/menu', name: 'menu', component: () => import('@/views/uikit/MenuDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/charts', name: 'charts', component: () => import('@/views/uikit/ChartDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/misc', name: 'misc', component: () => import('@/views/uikit/MiscDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/uikit/timeline', name: 'timeline', component: () => import('@/views/uikit/TimelineDoc.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/pages/empty', name: 'empty', component: () => import('@/views/pages/Empty.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/pages/crud', name: 'crud', component: () => import('@/views/pages/Crud.vue'), meta: { title: 'Page', requiresAuth: true } },
    { path: '/documentation', name: 'documentation', component: () => import('@/views/pages/Documentation.vue'), meta: { title: 'Page', requiresAuth: true } },

    { path: '/Nouvel_utilisateur', name: 'Nouvel_utilisateur', component: () => import('@/views/pages/new/newUser.vue'), meta: { title: 'Nouvel utilisateur', requiresAuth: true } },
    { path: '/List_utilisateur', name: 'List_utilisateur', component: () => import('@/views/pages/new/listUser.vue'), meta: { title: 'Liste des utilisateur', requiresAuth: true } },
    { path: '/Select_utilisateur', name: 'Select_utilisateur', component: () => import('@/views/pages/new/selectUser.vue'), meta: { title: 'Select des utilisateur', requiresAuth: true } },
];

// Routes principales
const routes = [
    {
        path: '/',
        component: AppLayout,
        children: appChildren,
    },
    { path: '/maintenance', name: 'Maintenance', component: () => import('@/views/Maintenance.vue'), meta: { title: 'Maintenance', requiresAuth: true } },
    { path: '/authentification', name: 'Authentification', component: () => import('@/views/pages/auth/Login.vue'), meta: { title: 'Login' } },
    // Route 404 en dernier
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/pages/NotFound.vue'), meta: { title: 'Page introuvable' } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Middleware de navigation (auth + titre)
router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();

    // Restaurer session depuis secureStorage si nécessaire
    if (!auth.token) {
        await auth.restoreSession();
    }

    // Rediriger vers Home si déjà connecté et tente d’aller sur login
    if (to.name === 'Login' && auth.isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    // Protéger les routes nécessitant l’auth
    if (to.meta?.requiresAuth && !auth.isAuthenticated) {
        auth.logoutLocal(true);
        return next({ name: 'Login' });
    }

    // Mettre à jour le titre de la page
    document.title = `${to.meta?.title ?? 'Page'} | Sogamad Santé`;

    next();
});


export default router;
