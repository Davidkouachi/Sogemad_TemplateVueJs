<template>
    <div class="layout-wrapper" :class="containerClass">
        <div v-if="preloaderSpinner.loadingSpiner" class="preloaderS-overlay">
            <ProgressSpinner
                style="width: 30px; height: 30px"
                strokeWidth="8"
                fill="transparent"
                animationDuration=".5s"
            />
            <p class="preloaderS-message">{{ preloaderSpinner.messageSpiner }}</p>
        </div>
        <ConfirmDialog group="positioned"></ConfirmDialog>
        <Dialog :dismissableMask="false" :visible="visibleAuth" pt:root:class="!border-0 !bg-transparent" pt:mask:class="backdrop-blur-sm bg-black/50 !pointer-events-auto">
            <template #container="{ closeCallback }">
                <div style="border-radius: 10px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color), rgba(33, 150, 243, 0) 30%)" >
                    <div class="w-[25rem] bg-surface-0 dark:bg-surface-900 py-10 px-2 sm:px-5" style="border-radius: 7px">
                        <form autocomplete="off" @submit.prevent="verifLoginForm">
                            <div class="text-center">
                                <Avatar icon="pi pi-user" class="block mx-auto mb-4 bg-primary" size="xlarge" shape="circle" style="background-image: radial-gradient(circle at left top, var(--p-primary-400), var(--p-primary-700)); color:white;"/>
                                <div class="text-surface-900 dark:text-surface-0 text-xl font-medium mb-4">{{auth.user.name}}</div>
                                <span class="text-muted-color font-medium">Votre session a expiré. Veuillez saisir votre mot de passe pour continuer votre travail</span>
                            </div>
                            <div class="flex flex-col px-8 py-8 gap-6 rounded-2xl">
                                <div class="inline-flex flex-col gap-2">
                                    <FloatLabel variant="on">
                                        <Password inputId="password1" v-model="passwordAuth" :toggleMask="true" fluid :feedback="false" size="large"/>
                                        <label for="password1" class="text-surface-900 dark:text-surface-0 font-medium text-xl">Mot de passe</label>
                                    </FloatLabel>
                                </div>
                                <div class="inline-flex flex-col gap-2">
                                    <Button
                                        size="large"
                                        type="submit"
                                        class="w-full"
                                        :loading="loadingAuth"
                                        severity="success"
                                        :disabled="loadingAuth"
                                        :label="loadingAuth ? 'Vérification en cours...' : 'Verfier'"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </template>
        </Dialog>
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <div v-if="preloader.loading" class="cardPreloader" style="position: relative; min-height: 70vh;">
                    <!-- Preloader -->
                    <div class="contentPreloader active" id="pageLoader">
                        <div class="loader-overlay"></div>
                        <div class="facebook-spinner">
                            <div class="spinner-block block-1"></div>
                            <div class="spinner-block block-2"></div>
                            <div class="spinner-block block-3"></div>
                        </div>
                    </div>
                    <!-- Contenu réel -->
                </div>
                <div v-else>
                    <router-view></router-view>
                </div>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
</template>

<script setup>
import { usePreloaderSpinner } from '@/function/function/showPreloader';
import { useLayout } from '@/layout/composables/layout';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useAuthStore } from '@/function/stores/auth';
import { useSwalAlert } from '@/function/function/SwalAlert';
import { usePreloaderStore } from '@/function/stores/preloader';
import { useToastAlert } from '@/function/function/ToastAlert';
import { useRouter } from 'vue-router';
import axios from '@/function/services/axios';

const { layoutConfig, layoutState, isSidebarActive } = useLayout();
const router = useRouter();
const outsideClickListener = ref(null);

const auth = useAuthStore();
const { showSwal } = useSwalAlert();
const { showToast, removeAllToasts, removeAllExcept } = useToastAlert();
const preloader = usePreloaderStore();
const preloaderSpinner = usePreloaderSpinner();

const visibleAuth = ref(false);

const passwordAuth = ref('')
const loadingAuth = ref(false);

let swalShown = false;
let submitting = false;

const verifLoginForm = async () => {
    if (submitting) return;   // 🔥 empêche 100% des doubles appels
    submitting = true;

    if (!passwordAuth.value) {
        showToast('warn', 'Alerte', 'Mot de passe obligatoire');
        submitting = false;
        return;
    }

    loadingAuth.value = true;

    try {

        const res = await axios.post('/api/login', {
            login: auth.user.login,
            password: passwordAuth.value
        });

        if (res.data.success) {

            const { access_token, refresh_token, user, expires_in } = res.data;

            auth.setUserSession(user, expires_in, access_token, refresh_token);

            const mainId = showToast(
                'success',
                'Vérification éffectuée',
                `${user.name}, nous sommes heureux de vous revoir 🤝!`,
                3000,
                '1'
            );

            visibleAuth.value = false

        } else if (res.data.info) {
            showToast('info', 'Informations', res.data.message);
        } else if (res.data.warn) {
            showToast('warn', 'Alerte', res.data.message);
        } else {
            showToast('error', 'Erreur', res.data.message || 'Erreur inconnue');
        }
    } 
    catch (err) {
        showToast('error', 'Erreur', err.message);
        auth.logoutLocal(false)
    } 
    finally {
        loadingAuth.value = false;
        submitting = false;   // 🔥 permet à nouveau un clic, mais jamais double
    }
};

// Préloader global sur navigation
router.beforeEach((to, from, next) => {
    if (!auth.expired) preloader.show(); // afficher loader
    next();
});

router.afterEach(() => {
    // Ici on peut attendre un délai pour le loader
    if (!auth.expired) {
        setTimeout(() => {
            preloader.hide();
        }, 500); // 0.5s ou 2s selon ton besoin
    }
});

onMounted(() => {
    // onPresetChange()
})

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

// 🕑 Surveille expiration du token
watch(
  () => auth.expired,
  async (val) => {
    if (!val || swalShown || auth.manualLogout || auth.isLoggingOut) return;
    swalShown = true;

    auth.logoutServer(false)

    visibleAuth.value = true

    // const result = await showSwal({
    //   icon: 'warning',
    //   title: 'Session expirée',
    //   text: 'Votre session a expiré. Veuillez vous reconnecter.',
    //   confirmButtonText: 'Ok',
    //   allowOutsideClick: false,
    //   allowEscapeKey: false,
    // });

    // if (result.isConfirmed) {
    //     removeAllToasts();
    //     preloaderSpinner.showSpiner('Déconnexion en cours...', () => {
    //         auth.logoutLocal(true);
    //     });
    // }

    swalShown = false;
  }
);

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
}
</script>

<style scoped>
.cardPreloader {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative; /* Important pour que le loader soit centré dedans */
}

#pageLoader {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

#pageLoader.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  /* background: rgba(255, 255, 255, 0.5); optionnel pour mieux voir le loader */
}

.facebook-spinner {
  display: flex;
  gap: 8px;
}

.spinner-block {
  width: 8px;
  height: 32px;
  border-radius: 4px;
  background: linear-gradient(180deg, #2E37A4, #42a5f5);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  animation: fb-bounce 1s infinite ease-in-out;
  transform-origin: center bottom;
}

.block-1 { animation-delay: 0s; }
.block-2 { animation-delay: 0.15s; }
.block-3 { animation-delay: 0.3s; }

@keyframes fb-bounce {
  0%, 100% { transform: scaleY(1); opacity: 1; }
  50%      { transform: scaleY(0.5); opacity: 0.5; }
}







.preloaderS-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  flex-direction: column;
}
.preloaderS-message {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 500;
}
</style>