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
    },
    locale: {
        // Pagination et filtres en français
        startsWith: 'Commence par',
        contains: 'Contient',
        notContains: 'Ne contient pas',
        endsWith: 'Se termine par',
        equals: 'Égal à',
        notEquals: 'Différent de',
        noFilter: 'Aucun filtre',
        lt: 'Inférieur à',
        lte: 'Inférieur ou égal à',
        gt: 'Supérieur à',
        gte: 'Supérieur ou égal à',
        dateIs: 'La date est',
        dateIsNot: 'La date n\'est pas',
        dateBefore: 'Date avant',
        dateAfter: 'Date après',
        clear: 'Effacer',
        apply: 'Appliquer',
        matchAll: 'Correspond à tous',
        matchAny: 'Correspond à n\'importe quel',
        addRule: 'Ajouter une règle',
        removeRule: 'Supprimer une règle',
        accept: 'Oui',
        reject: 'Non',
        choose: 'Choisir',
        upload: 'Téléverser',
        cancel: 'Annuler',
        dayNames: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
        dayNamesShort: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
        dayNamesMin: ["D","L","M","M","J","V","S"],
        monthNames: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
        monthNamesShort: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"],
        today: "Aujourd'hui",
        weekHeader: "Sem",
        firstDayOfWeek: 1,
        dateFormat: "dd/mm/yy",
        weak: "Faible",
        medium: "Moyen",
        strong: "Fort",
        passwordPrompt: "Saisir un mot de passe",
        emptyMessage: "Aucune donnée disponible",
        emptyFilterMessage: "Aucun résultat trouvé",
        // Pagination
        pageReport: 'Affichage de {first} à {last} sur {totalRecords} utilisateurs'
    }
});

app.component('Toast', Toast);
app.component('ProgressSpinner', ProgressSpinner);

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
