<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden" :style="{ backgroundImage: `url(${backgroundImage})` }">
        <div style="position:absolute; inset:0; background:rgba(0,0,0,0.5); z-index:0;"></div>
        <div class="flex flex-col items-center justify-center" style="position:relative; z-index:1;">
            <div style="border-radius: 10px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" >
                <div class="w-full border border-4 bg-surface-0 dark:bg-surface-900 py-10 px-8 sm:px-10" style="border-radius: 7px">
                    <form @submit.prevent="connectLoginForm">
                    <div class="text-center mb-8">
                        <img height="120" width="160" src="@/assets/img/logo.png" class="mb-8 w-23 shrink-0 mx-auto" alt="Logo">
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-medium mb-4">Bienvenue ! 👋</div>
                        <span class="text-muted-color font-medium">Plateforme de gestion santé</span>
                    </div>

                    <div>
                        <label for="login1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Login</label>
                        <InputText id="login1" type="text" placeholder="Email address" class="w-full mb-8" v-model="login" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false">
                        </Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Se souvenir de moi</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Mot de passe oublié?</span>
                        </div>
                        <Button
                            size="large"
                            type="submit"
                            class="w-full"
                            :loading="loading"
                            severity="success"
                            :disabled="loading"
                            :label="loading ? 'Connexion en cours...' : 'Connexion'"
                        />
                    </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useToast } from 'primevue/usetoast';
import { ref, onMounted, onUnmounted, getCurrentInstance, computed } from 'vue'
import Swal from 'sweetalert2'
import axios from '@/function/services/axios';
import { useToastAlert } from '@/function/function/ToastAlert';
import { removeLogoutPreloaderAndToast } from '@/function/appGlobal';
import { useAuthStore } from '@/function/stores/auth';
import { useRouter } from 'vue-router';
import { usePreloaderSpinner } from '@/function/function/showPreloader';

const auth = useAuthStore();
const preloaderSpinner = usePreloaderSpinner();
const { showToast, removeAllToasts, removeAllExcept } = useToastAlert();

const login = ref('')
const password = ref('')
const checked = ref(false)
const loading = ref(false);
const router = useRouter();

const backgroundImage = new URL('@/assets/img/plan1.jpg', import.meta.url).href

let submitting = false;

const connectLoginForm = async () => {
    if (submitting) return;   // 🔥 empêche 100% des doubles appels
    submitting = true;

    if (!login.value || !password.value) {
        showToast('warn', 'Alerte', 'Login et mot de passe sont obligatoires');
        submitting = false;
        return;
    }

    loading.value = true;

    try {

        const res = await axios.post('/api/login', {
            login: login.value,
            password: password.value
        });

        if (res.data.success) {

            const { access_token, refresh_token, user, expires_in } = res.data;

            auth.setUserSession(user, expires_in, access_token, refresh_token);

            const mainId = showToast(
                'success',
                'Compte connecté',
                `Bienvenue ${user.name}, nous sommes heureux de vous revoir 🤝!`,
                5000,
                '1'
            );

            localStorage.setItem('nu', user.name);
        
            router.push({ name: 'dashboard' });

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
    } 
    finally {
        loading.value = false;
        submitting = false;   // 🔥 permet à nouveau un clic, mais jamais double
    }
};

onMounted(() => {
  Swal.close();

  if (preloaderSpinner.loadingSpiner) preloaderSpinner.hideSpiner()

  if (auth.manualLogout === true) {
    console.log('fn lancé')
    removeLogoutPreloaderAndToast(showToast);
  }
})

</script>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
