import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/function/stores/auth';
import { getSecureItem } from "@/function/stores/secureStorage";

/* ===========================================================
   ROUTES — regroupées par sections pour plus de clarté
   =========================================================== */

// 🌟 Pages principales
const corePages = [
    { path: '/', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: 'Dashboard', requiresAuth: true } },
    { path: '/documentation', name: 'documentation', component: () => import('@/views/pages/Documentation.vue'), meta: { title: 'Documentation', requiresAuth: true } },
    { path: '/pages/empty', name: 'empty', component: () => import('@/views/pages/Empty.vue'), meta: { title: 'Page vide', requiresAuth: true } },
    { path: '/pages/crud', name: 'crud', component: () => import('@/views/pages/Crud.vue'), meta: { title: 'CRUD', requiresAuth: true } },
];

// 🌟 UIKIT
const uikitRoutes = [
    { path: '/uikit/formlayout', name: 'formlayout', component: () => import('@/views/uikit/FormLayout.vue'), meta: { title: 'Form Layout', requiresAuth: true } },
    { path: '/uikit/input', name: 'input', component: () => import('@/views/uikit/InputDoc.vue'), meta: { title: 'Input', requiresAuth: true } },
    { path: '/uikit/button', name: 'button', component: () => import('@/views/uikit/ButtonDoc.vue'), meta: { title: 'Button', requiresAuth: true } },
    { path: '/uikit/table', name: 'table', component: () => import('@/views/uikit/TableDoc.vue'), meta: { title: 'Table', requiresAuth: true } },
    { path: '/uikit/list', name: 'list', component: () => import('@/views/uikit/ListDoc.vue'), meta: { title: 'Liste', requiresAuth: true } },
    { path: '/uikit/tree', name: 'tree', component: () => import('@/views/uikit/TreeDoc.vue'), meta: { title: 'Tree', requiresAuth: true } },
    { path: '/uikit/panel', name: 'panel', component: () => import('@/views/uikit/PanelsDoc.vue'), meta: { title: 'Panel', requiresAuth: true } },
    { path: '/uikit/overlay', name: 'overlay', component: () => import('@/views/uikit/OverlayDoc.vue'), meta: { title: 'Overlay', requiresAuth: true } },
    { path: '/uikit/media', name: 'media', component: () => import('@/views/uikit/MediaDoc.vue'), meta: { title: 'Media', requiresAuth: true } },
    { path: '/uikit/message', name: 'message', component: () => import('@/views/uikit/MessagesDoc.vue'), meta: { title: 'Messages', requiresAuth: true } },
    { path: '/uikit/file', name: 'file', component: () => import('@/views/uikit/FileDoc.vue'), meta: { title: 'Fichier', requiresAuth: true } },
    { path: '/uikit/menu', name: 'menu', component: () => import('@/views/uikit/MenuDoc.vue'), meta: { title: 'Menu', requiresAuth: true } },
    { path: '/uikit/charts', name: 'charts', component: () => import('@/views/uikit/ChartDoc.vue'), meta: { title: 'Charts', requiresAuth: true } },
    { path: '/uikit/misc', name: 'misc', component: () => import('@/views/uikit/MiscDoc.vue'), meta: { title: 'Divers', requiresAuth: true } },
    { path: '/uikit/timeline', name: 'timeline', component: () => import('@/views/uikit/TimelineDoc.vue'), meta: { title: 'Timeline', requiresAuth: true } },
];

// 🌟 Pages personnalisées (ton projet)
const customPages = [
    { path: '/Nouvel_utilisateur', name: 'Nouvel_utilisateur', component: () => import('@/views/pages/new/newUser.vue'), meta: { title: 'Nouvel utilisateur', requiresAuth: true } },
    { path: '/List_utilisateur', name: 'List_utilisateur', component: () => import('@/views/pages/new/listUser.vue'), meta: { title: 'Liste des utilisateurs', requiresAuth: true } },
    { path: '/element_basic', name: 'element_basic', component: () => import('@/views/pages/new/element.vue'), meta: { title: 'Element', requiresAuth: true } },
    { path: '/element_chart', name: 'element_chart', component: () => import('@/views/pages/new/graphique.vue'), meta: { title: 'Graphique', requiresAuth: true } },
];

// Routes principales
const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            ...corePages,
            ...uikitRoutes,
            ...customPages
        ]
    },

    {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance.vue'),
        meta: { title: 'Maintenance', requiresAuth: true }
    },

    {
        path: '/authentification',
        name: 'Authentification',
        component: () => import('@/views/pages/auth/Login.vue'),
        meta: { title: 'Login' }
    },

    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/pages/NotFound.vue'),
        meta: { title: 'Page introuvable' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();

    // // Restaurer session depuis secureStorage si nécessaire
    if (!auth.token) {
        await auth.restoreSession(); // <-- attendre
    }

    // // Rediriger vers Home si déjà connecté et tente d’aller sur login
    if (to.name === 'Authentification' && auth.isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    // // Protéger les routes nécessitant l’auth
    if (to.meta?.requiresAuth && !auth.isAuthenticated) {
        auth.logoutLocal(true);
        return next({ name: 'Authentification' });
    }

    // Mettre à jour le titre de la page
    document.title = `${to.meta?.title ?? 'Page'} | Sogamad Santé`;

    next();
});



export default router;
