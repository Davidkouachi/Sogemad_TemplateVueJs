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

const { layoutConfig, layoutState, isSidebarActive } = useLayout();
const router = useRouter();
const outsideClickListener = ref(null);

const auth = useAuthStore();
const { showSwal } = useSwalAlert();
const { removeAllToasts } = useToastAlert();
const preloader = usePreloaderStore();
const preloaderSpinner = usePreloaderSpinner();

let swalShown = false;

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

    const result = await showSwal({
      icon: 'warning',
      title: 'Session expirée',
      text: 'Votre session a expiré. Veuillez vous reconnecter.',
      confirmButtonText: 'Ok',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (result.isConfirmed) {
        removeAllToasts();
        preloaderSpinner.showSpiner('Déconnexion en cours...', () => {
            auth.logoutLocal(true);
        });
    }

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