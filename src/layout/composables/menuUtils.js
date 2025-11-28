import { ref, onMounted } from 'vue';

export const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/', permissions: ['admin', 'user'], }]
    },
    {
        label: 'Personnel',
        items: [
            { label: 'Nouvel utilisateur', icon: 'pi pi-plus', to: '/Nouvel_utilisateur', permissions: ['admin', 'user'], },
            { label: 'Liste utilisateur', icon: 'pi pi-list', to: '/List_utilisateur', permissions: ['admin', 'user'], },
            {
                label: 'Elements',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    { label: 'Basic', icon: 'pi pi-list', to: '/element_basic', permissions: ['admin', 'user'], },
                    { label: 'Graphique', icon: 'pi pi-chart-bar', to: '/element_chart', permissions: ['admin', 'user'], },
                ]
            },
        ]
    },
    {
        label: 'UI Components',
        items: [
            { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout',permissions: ['admin', 'user'], },
            { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input',permissions: ['admin', 'user'], },
            { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon',permissions: ['admin', 'user'], },
            { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table',permissions: ['admin', 'user'], },
            { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list',permissions: ['admin', 'user'], },
            { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree',permissions: ['admin', 'user'], },
            { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel',permissions: ['admin', 'user'], },
            { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay',permissions: ['admin', 'user'], },
            { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media',permissions: ['admin', 'user'], },
            { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu',permissions: ['admin', 'user'], },
            { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message',permissions: ['admin', 'user'], },
            { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file',permissions: ['admin', 'user'], },
            { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts',permissions: ['admin', 'user'], },
            { label: 'Timeline', icon: 'pi pi-fw pi-calendar', to: '/uikit/timeline',permissions: ['admin', 'user'], },
            { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc',permissions: ['admin', 'user'], }
        ]
    },
    // {
    //     label: 'Pages',
    //     icon: 'pi pi-fw pi-briefcase',
    //     to: '/pages',
    //     items: [
    //         {
    //             label: 'Landing',
    //             icon: 'pi pi-fw pi-globe',
    //             to: '/landing'
    //         },
    //         {
    //             label: 'Auth',
    //             icon: 'pi pi-fw pi-user',
    //             items: [
    //                 {
    //                     label: 'Login',
    //                     icon: 'pi pi-fw pi-sign-in',
    //                     to: '/auth/login'
    //                 },
    //                 {
    //                     label: 'Error',
    //                     icon: 'pi pi-fw pi-times-circle',
    //                     to: '/auth/error'
    //                 },
    //                 {
    //                     label: 'Access Denied',
    //                     icon: 'pi pi-fw pi-lock',
    //                     to: '/auth/access'
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Crud',
    //             icon: 'pi pi-fw pi-pencil',
    //             to: '/pages/crud'
    //         },
    //         {
    //             label: 'Not Found',
    //             icon: 'pi pi-fw pi-exclamation-circle',
    //             to: '/pages/notfound'
    //         },
    //         {
    //             label: 'Empty',
    //             icon: 'pi pi-fw pi-circle-off',
    //             to: '/pages/empty'
    //         }
    //     ]
    // },
    {
        label: 'Hierarchy',
        items: [
            {
                label: 'Submenu 1',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    {
                        label: 'Submenu 1.1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                        ]
                    },
                    {
                        label: 'Submenu 1.2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                    }
                ]
            },
            {
                label: 'Submenu 2',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    {
                        label: 'Submenu 2.1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                        ]
                    },
                    {
                        label: 'Submenu 2.2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                    }
                ]
            }
        ]
    },
    {
        label: 'Get Started',
        items: [
            {
                label: 'Documentation',
                icon: 'pi pi-fw pi-book',
                to: '/documentation'
            },
            {
                label: 'View Source',
                icon: 'pi pi-fw pi-github',
                url: 'https://github.com/primefaces/sakai-vue',
                target: '_blank'
            }
        ]
    }
]);


export function findBreadcrumb(menu, to, path = []) {
  for (const item of menu) {
    const currentPath = [...path, { label: item.label, icon: item.icon, to: item.to }];
    if (item.to === to) return currentPath;
    if (item.items) {
      const found = findBreadcrumb(item.items, to, currentPath);
      if (found) return found;
    }
  }
  return null;
}