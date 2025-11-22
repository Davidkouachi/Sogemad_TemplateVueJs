<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useToastAlert } from '@/function/function/ToastAlert';
import { pdfListeUser } from '@/export/pdf/pdf_liste_user.js';
import { pdfAssurance } from '@/export/pdf/pdf_assurance.js';
import { excelUser } from '@/export/excel/excel_user.js';
import { usePreloaderSpinner } from '@/function/function/showPreloader';

const { showToast } = useToastAlert();
const preloaderSpinner = usePreloaderSpinner();

const users = ref([]);
const loading = ref(true);
const loadingBtn = ref(true);
const filters = ref({});
const showModal = ref(false);
const userSelected = ref({});
const globalFilter = ref('');
const dt = ref(null); // ref vers le DataTable
const menuRefs = ref({}); // pour stocker les références des menus par utilisateur

function initFilters() {

    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        login: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}

const fetchUsers = async (loaderBtn = false) => {
    loading.value = true;
    loadingBtn.value = loaderBtn;
    users.value = new Array(10).fill({});
    try {
        const res = await axios.get('/api/users/list');
        if (res.status === 204 || !res.data?.data.length) {
            users.value = [];
            showToast('info', 'Info', 'Aucun utilisateur trouvé.');
        } else {
            users.value = res.data.data.map(u => ({ ...u }));
        }
    } catch (err) {
        console.error('Erreur API:', err);
        users.value = [];
        showToast('error', 'Erreur', 'Impossible de charger les utilisateurs.');
    } finally {
        loading.value = false;
        loadingBtn.value = false;
        await nextTick();
        initFilters(false)
    }
};

const openModal = (user) => {
    userSelected.value = user;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    userSelected.value = {};
};

const getLignesPageCourante = () => {
    if (!dt.value) return [];

    // processedData contient EXACTEMENT les lignes affichées dans le tableau
    const visible = dt.value.processedData;

    return visible ?? [];
};

const handleExportPDF = () => {
    const donnees = JSON.parse(JSON.stringify(getLignesPageCourante()));

    if (!donnees.length) {
        showToast('warn', 'Alerte', 'Aucune donnée à exporter.');
        return;
    }

    preloaderSpinner.showSpiner('Creation du fichier pdf en cours...', () => {
        setTimeout(() => {
            pdfListeUser(donnees);
        }, 200); 
    });
};

const handleExportPDFR = () => {

    preloaderSpinner.showSpiner('Creation du rapport en cours...', () => {
        setTimeout(() => {
            pdfAssurance();
        }, 200); 
    });
};

const handleExportEXCEL = () => {
    const donnees = JSON.parse(JSON.stringify(getLignesPageCourante()));

    if (!donnees.length) {
        showToast('warn', 'Alerte', 'Aucune donnée à exporter.');
        return;
    }

    preloaderSpinner.showSpiner('Creation du rapport en cours...', () => {
        setTimeout(() => {
            excelUser(donnees);
        }, 200); 
    });
};

function formatDateHeure(value) {
    if (!value) return '';

    // Convertit en objet Date même si " " à la place de "T"
    const date = new Date(value.replace(' ', 'T'));

    if (isNaN(date.getTime())) return value; // si conversion échoue

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} à ${hours}:${minutes}:${seconds}`;
}

const exportItemsPdf = [
    {
        label: 'Liste User',
        icon: 'pi pi-file-pdf',
        command: () => handleExportPDF()
    },
    {
        label: 'Rapport User',
        icon: 'pi pi-file-excel',
        command: () => handleExportPDFR()
    }
];

const exportItemsExcel = [
    {
        label: 'Liste User',
        icon: 'pi pi-file-excel',
        command: () => handleExportEXCEL()
    }
];

const actionItems = (user) => [
    { label: 'Détails', icon: 'pi pi-eye', command: () => openModal(user) },
    { label: 'Modifier', icon: 'pi pi-pencil', command: () => showToast('info','Modifier',`Modifier ${user.name}`) },
    { separator: true },
    { label: 'Supprimer', icon: 'pi pi-trash', command: () => showToast('warn','Supprimer',`Supprimer ${user.name}`) }
];

onMounted(() => {
    fetchUsers();
});

</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-xl font-semibold">Liste des utilisateurs</h4>
        </div>

        <DataTable
            ref="dt"
            :value="users"
            :paginator="true"
            :rowsPerPageOptions="[5,10,20,50]"
            :rows="10"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="['name','email','login']"
            scrollable
            scrollHeight="auto"
        >
            <div class="flex justify-center my-4">
                <Chip 
                    label="Seules les données actuellement visibles dans le tableau seront exportées. Les filtres appliqués sont automatiquement pris en compte." 
                    icon="pi pi-info-circle" 
                    removable 
                />
            </div>

            <template #header>
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <FloatLabel variant="in" class="flex-1">
                        <InputText 
                            id="in_label" 
                            v-if="filters.global" 
                            v-model="filters.global.value" 
                            autocomplete="off" 
                        />
                        <label for="in_label">Recherche...</label>
                    </FloatLabel>
                    <div class="flex flex-wrap gap-2 mt-2 md:mt-0">
                        <Button type="button" icon="pi pi-filter-slash" label="Filtre" @click="initFilters"/>
                        <Button type="button" icon="pi pi-refresh" @click="fetchUsers(true)" severity="warn" :disabled="loadingBtn" :loading="loadingBtn" :label="loadingBtn ? 'Actualisation en cours...' : 'Actualiser'"/>
                        <SplitButton label="Pdf" icon="pi pi-file-pdf" :model="exportItemsPdf" severity="danger" />
                        <SplitButton label="Excel" icon="pi pi-file-excel" :model="exportItemsExcel" severity="success" />
                    </div>
                </div>
            </template>

            <template #empty>
                <div class="text-center text-red-600 py-4">
                    <i class="pi pi-info-circle fs-2"></i>
                    <p>Aucun utilisateur disponible</p>
                </div>
            </template>

            <Column field="id" header="N°" style="width:5%">
                <template #body="{ index  }">
                    <Skeleton v-if="loading" width="2rem" height="1rem"/>
                    <span v-else>{{ index + 1 }}</span>
                </template>
            </Column>

            <Column field="name" header="Nom" style="min-width: 12rem">
                <template #body="{ data }">
                    <template v-if="loading">
                        <div class="flex items-center gap-2">
                            <Skeleton shape="circle" size="2.5rem" />
                            <Skeleton width="8rem" height="1rem" />
                        </div>
                    </template>

                    <template v-else>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-800">
                                <i class="pi pi-user text-white"></i>
                            </div>
                            <span>{{ data.name }}</span>
                        </div>
                    </template>
                </template>
            </Column>

            <Column field="email" header="Email" style="min-width: 10rem">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="10rem" height="1rem"/>
                    <span v-else>{{ data.email }}</span>
                </template>
            </Column>

            <Column field="login" header="Login" style="min-width: 10rem">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="8rem" height="1rem"/>
                    <span v-else>{{ data.login }}</span>
                </template>
            </Column>

            <Column field="created_at" header="Date de création" style="min-width: 10rem">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="12rem" height="1rem"/>
                    <span v-else>{{ formatDateHeure(data.created_at) }}</span>
                </template>
            </Column>

            <Column header="Actions" style="width:10%">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="6rem" height="2rem" />
                    <SplitButton 
                        v-else
                        :model="actionItems(data)" 
                        icon="" 
                        label="Actions" 
                        dropdownIcon="pi pi-cog" 
                        severity="warn" 
                        size="small"
                    />
                </template>
            </Column>

        </DataTable>

        <Dialog header="Détails utilisateur" v-if="showModal && userSelected" v-model:visible="showModal" :modal="true" :closable="true">
            <ul class="list-group">
                <li class="list-group-item"><strong>ID :</strong> {{ userSelected.id }}</li>
                <li class="list-group-item"><strong>Nom :</strong> {{ userSelected.name }}</li>
                <li class="list-group-item"><strong>Email :</strong> {{ userSelected.email }}</li>
                <li class="list-group-item"><strong>Login :</strong> {{ userSelected.login }}</li>
            </ul>
        </Dialog>

    </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) { font-weight: bold; }
:deep(.p-datatable-scrollable .p-frozen-column) { font-weight: bold; }
</style>
    