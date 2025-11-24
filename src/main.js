import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router';
import { createPinia, setActivePinia  } from 'pinia';
import piniaPersist from 'pinia-plugin-persistedstate';
// import { piniaSecurePersist } from '@/function/stores/securePersist';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';

import '@/assets/styles.scss';
import '@/assets/style.css';

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPersist);
// pinia.use(
//   piniaSecurePersist({
//     key: "auth",
//     paths: ["user", "token", "refreshToken", "sessionExpire", "expired"]
//   })
// );
app.use(pinia);
app.use(router);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

app.component('Toast', Toast);
app.component('ProgressSpinner', ProgressSpinner);

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
