<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed, onMounted, defineComponent, markRaw } from "vue";
import { useAuthStore } from '@/function/stores/auth';
import { useDrawerStore } from '@/function/stores/drawer';
import { usePreloaderSpinner } from '@/function/function/showPreloader';
import { useToastAlert } from '@/function/function/ToastAlert';
import { useConfirm } from "primevue/useconfirm";

import NotificationList from "@/components/perso/NotificationList.vue";

const auth = useAuthStore();
const { showToast, removeAllToasts } = useToastAlert();
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const preloaderSpinner = usePreloaderSpinner();
const confirm = useConfirm();
const drawerUse = useDrawerStore();

const items = ref([
    {
        separator: true
    },
    {
        label: 'Profil',
        items: [
            {
                label: 'Settings',
                icon: 'pi pi-cog',
                badge: 2,
            },
        ]
    },
    {
        separator: true
    },
    {   
        id: 'logout',
        label: 'Deconnexion',
        icon: 'pi pi-sign-out',
    }
]);

// 🔁 formatteur de temps (mm:ss)
function formatTime(seconds) {
  if (!seconds || seconds < 0) seconds = 0;
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

const tempsToken = computed(() => formatTime(auth.tempsRestant));
const tempsInactivite = computed(() => formatTime(auth.inactivityRestant));

// Notifications de test
const fakeNotifs = [
  { id: 1, title: "Nouveau message", message: "Message de Jean.", time: "Il y a 2min", icon: "pi pi-envelope", badge: "info" , badgeName: "standart" },
  { id: 2, title: "Mise à jour", message: "MAJ dispo.", time: "Il y a 10min", icon: "pi pi-refresh", badge: "orange" , badgeName: "important" },
  { id: 3, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "danger" , badgeName: "urgent" },
  { id: 4, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "success" , badgeName: "éffectuée" },
  { id: 5, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "warning" , badgeName: "moins important" },
  { id: 6, title: "Mise à jour", message: "MAJ dispo.", time: "Il y a 10min", icon: "pi pi-refresh", badge: "primary" , badgeName: "standart" },
  { id: 1, title: "Nouveau message", message: "Message de Jean.", time: "Il y a 2min", icon: "pi pi-envelope", badge: "info" , badgeName: "standart" },
  { id: 2, title: "Mise à jour", message: "MAJ dispo.", time: "Il y a 10min", icon: "pi pi-refresh", badge: "orange" , badgeName: "important" },
  { id: 3, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "danger" , badgeName: "urgent" },
  { id: 4, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "success" , badgeName: "éffectuée" },
  { id: 5, title: "Alerte système", message: "Problème serveur 3.", time: "Hier", icon: "pi pi-exclamation-triangle", badge: "warning" , badgeName: "moins important" },
  { id: 6, title: "Mise à jour", message: "MAJ dispo.", time: "Il y a 10min", icon: "pi pi-refresh", badge: "primary" , badgeName: "standart" },
];

const Btnfoter = [
    {   
        id: 'logout',
        label: 'Voir plus',
        icon: 'pi pi-eye',
        variant: '',
        severity: 'warn',
    },
    {   
        id: 'logout',
        label: 'Tout effacer',
        icon: 'pi pi-times',
        variant: 'outlined',
        severity: 'danger',
        command: () => {
            drawerUse.hide(); 
            showToast('success','Succès',`Notification supprimé`)
        }
    }
];

// Fonction pour ouvrir le Drawer
function showNotifications() {
  drawerUse.show(
    "Notifications",
    "pi pi-bell",
    "right",
    "26rem",
    markRaw(NotificationList),
    { data: fakeNotifs },
    { footerBtn: Btnfoter }
  );
}

function handleItemClick (item, position = 'center') {
    if (item.id === "logout") {
        confirm.require({
            // group: 'positioned',
            group: 'headless',
            message: 'Voulez-vous vraiment vous déconnecter ?',
            header: 'Confirmation',
            // icon: 'pi pi-info-circle',
            // position: position,
            rejectProps: {
                icon: 'pi pi-times',
                label: 'Non',
                severity: 'danger',
                outlined: false,
                size: 'normal',
            },
            acceptProps: {
                icon: 'pi pi-check',
                label: 'Oui',
                severity: 'success',
                outlined: false,
                size: 'normal',
            },
            accept: () => {
                removeAllToasts();
                preloaderSpinner.showSpiner('Déconnexion en cours...', () => {
                    auth.logoutServer();
                });
            },
            reject: () => {
                return false;
            }
        });

    }
};

onMounted(() => {
    console.log('lancé')
})

</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <img src="@/assets/img/logo.png" class="w-[8rem] shrink-0" alt="Logo">
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
            </div>

            <div class="relative hidden md:block">
                <div class="flex flex-wrap gap-2">
                    <Chip :label="tempsToken" icon="pi pi-bell" removable />
                    <Chip :label="tempsInactivite" icon="pi pi-bell" removable />
                </div>
            </div>

            <div class="relative">
                <button
                    class="layout-topbar-action"
                    @click="showNotifications"
                    badge="2"
                >
                    <i class="pi pi-bell"></i>
                </button>
            </div>

            <div class="relative">
                <button
                    class="layout-topbar-action"
                    v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                >
                    <i class="pi pi-user"></i>
                </button>

                <div
                    class="config-panel hidden absolute top-[3.25rem] right-0 w-64 p-0 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]"
                >
                    <div class="flex justify-center border-0">
                        <Menu :model="items" class="w-full">
                            <template #start>
                                <button v-ripple class="relative overflow-hidden w-full border-0 bg-transparent flex items-start p-2 pl-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-none cursor-pointer transition-colors duration-200">
                                    <Avatar icon="pi pi-user" class="mr-2" size="large" shape="circle" />
                                    <span class="inline-flex flex-col items-start">
                                        <span class="font-bold text-lg">{{ auth.user?.email || 'Invité' }}</span>
                                        <span class="text-md">Admin</span>
                                    </span>
                                </button>
                            </template>
                            <template #submenulabel="{ item }">
                                <span class="text-primary font-bold">{{ item.label }}</span>
                            </template>
                            <template #item="{ item, props }">
                                <a v-ripple class="flex items-center" v-bind="props.action" :id="item.id" @click="handleItemClick(item)">
                                    <span :class="item.icon" />
                                    <span>{{ item.label }}</span>
                                    <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
                                    <span v-if="item.shortcut" class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{ item.shortcut }}</span>
                                </a>
                            </template>
                        </Menu>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

#logout {
  color: red;
  margin: 0.5rem 0.1rem;
}
#logout:hover {
  background-color: #ff0028;
  color: white;
  border-radius:0.5rem;
}

</style>