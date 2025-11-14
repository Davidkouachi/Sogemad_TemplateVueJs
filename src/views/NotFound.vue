<template>
  <div class="main-wrapper auth-bg position-relative overflow-hidden">
    <div class="container-fuild">
        <div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 z-1">
            <div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
                <div class="col-lg-6">
                    <div class="d-flex flex-column align-items-center justify-content-center">
                        <div class=" mx-auto mb-5 text-center">
                            <img src="@/assets/img/logo.png" height="200" width="250" class="img-fluid" alt="Logo">
                        </div>
                        <div class="error-images mb-4">
                            <img src="@/assets/img/error-404.svg" alt="image" class="img-fluid">
                        </div>
                        <div class="text-center">
                            <h2 class="mb-2 fw-bold text-danger">Erreur 404</h2>
                            <h4 class="mb-2 fw-bold text-danger">Page introuvable</h4>
                            <p class="fs-14 text-center text-dark">
                              Erreur 404 . Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                            </p>
                            <div class="d-flex justify-content-center pb-3">
                              <button @click="redirectToHome" class="btn btn-outline-danger d-flex align-items-center">
                                <i class="ti ti-chevron-left me-2"></i>
                                {{ buttonText }}
                              </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <img src="@/assets/img/auth/auth-bg-top.png" alt="" class="img-fluid element-01">
    <img src="@/assets/img/auth/auth-bg-bot.png" alt="" class="img-fluid element-02">
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { showPreloader } from '@/function/showPreloader';
import { useRouter } from 'vue-router';
import { getSecureItem } from "@/stores/secureStorage";
import { usePreloaderStore } from '@/stores/preloader';

const router = useRouter();
const auth = useAuthStore();
const preloader = usePreloaderStore();

// ✅ utiliser des refs pour que le template réagisse
const buttonText = ref('');
const preloaderMessage = ref('');

function redirectToHome() {
  showPreloader(preloaderMessage.value, () => {
    if (!auth.expired) {
      router.push('/'); // Tableau de bord
    } else {
      router.push('/authentification'); // Page login
    }
  }, 1000);
}

onMounted(async () => {
  preloader.hide()
  await nextTick()

  if (getSecureItem("session_expired") === false) {
    buttonText.value = 'Retour vers le Tableau de bord';
    preloaderMessage.value = 'Redirection vers le Tableau de Bord...';
  } else {
    buttonText.value = 'Retour à la page d’authentification';
    preloaderMessage.value = 'Redirection vers la page de connexion...';
  }
});

</script>

<style scoped>
#pageLoader {
  position: fixed;
  inset: 0;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
  z-index: 9999;
}
#pageLoader.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}
.loader-overlay {
  position: absolute;
  inset: 0;
  /*background: rgba(0, 0, 0, 0.15);*/
  backdrop-filter: blur(2px);
}
.facebook-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Centrage parfait */
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
</style>
