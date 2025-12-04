<script setup>
import { ref, onMounted, computed,nextTick, watch } from 'vue';
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
import { useConfirm } from "primevue/useconfirm";
import { useAuthStore } from '@/function/stores/auth';
import { formaDateHeure } from '@/function/services/format';

const auth = useAuthStore();
const { showToast } = useToastAlert();
const preloaderSpinner = usePreloaderSpinner();
const confirm = useConfirm();

const users = ref([]);
const loading = ref(true);
const loadingBtn = ref(true);
const filters = ref({});
const showModal = ref(false);
const userSelected = ref({});
const globalFilter = ref('');
const dt = ref(null); // ref vers le DataTable
const menuRefs = ref({}); // pour stocker les références des menus par utilisateur
const selectedUsers = ref([]);  // Stocke les lignes sélectionnées

function initFilters() {

    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        login: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}

const fetchUsers = async (loaderBtn = false, callback) => {
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

        // ⚡ Vérifie que callback est défini avant d'appeler
        if (typeof callback === 'function') {
            callback();
        }

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

const rowsPerPage = ref(10); // correspond à :rows="10"
const currentPage = ref(1);
const totalRows = computed(() => users.value.length);

function onPage(event) {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;   // <<< SUPER IMPORTANT
}

const totalPages = computed(() => {
    return users.value.length && rowsPerPage.value
        ? Math.ceil(users.value.length / rowsPerPage.value)
        : 1;
});

const rowClass = (data) => {
    // 1. Pendant le chargement du tableau → aucune couleur
    if (loading.value) {
        return '';
    }

    // 2. L’utilisateur connecté → vert ciel
    if (auth.user && auth.user.login === data.login) {
        return 'row-connect-user';
    }

    // 3. Tous les autres utilisateurs → rouge ciel
    return 'row-deconnect-user';
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
    },);
};

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
    // { separator: true }
];

const deleteTable = (event, data) => {
    confirm.require({
        target: event.currentTarget,
        message: 'Voulez-vous continuer ?',
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: 'Non',
            severity: 'danger',
            outlined: true
        },
        acceptProps: {
            label: 'Oui',
            severity: 'success'
        },
        accept: async () => {

            preloaderSpinner.showSpiner(
                'Opération en cours...', 
                async () => { 
                    await deleteUser(data.id);
                }, 
                'rgba(255,255,255,0.9)'
            );
        },
        reject: () => {
            // showToast('info', 'Alerte', 'Opération non éffectuée.');
        }
    });
};

// Fonction deleteUser
async function deleteUser(id) {
    try {
        const res = await axios.delete('/api/deleteUser/' + id);
        const data = res.data;

        preloaderSpinner.hideSpiner();

        if (data.success) {

            preloaderSpinner.showSpiner(
                'Opération terminée, actualisation des données...', 
                () => { 
                    fetchUsers(
                        false, 
                        () => {
                            preloaderSpinner.hideSpiner();
                            showToast('success', 'Succès', 'Opération éffectuée');
                        }
                    ); 
                }, 
                'rgba(255,255,255,0.9)'
            );

        } else if (data.info) {
            showToast('info', 'Informations', data.message);
        } else {
            showToast('error', 'Erreur', data.message || 'Erreur inconnue');
        }
    } catch (err) {
        showToast('error', 'Erreur', err.message || 'Erreur inattendue');
    }
}

const showSelected = () => {
    // Copie simple des données
    const before = JSON.parse(JSON.stringify(selectedUsers.value));
    console.log("Sélection initiale :", before);

    showToast('info', 'Sélection', before.length + ' ligne(s) sélectionnée(s)');

    // Lignes rejetées (interdites)
    const rejected = selectedUsers.value.filter(
        u => auth.user && auth.user.login === u.login
    );

    // Lignes conservées
    const kept = selectedUsers.value.filter(
        u => auth.user && auth.user.login !== u.login
    );

    // Mise à jour : on garde uniquement celles autorisées
    selectedUsers.value = kept.map(u => ({ ...u }));

    console.log("Lignes rejetées :", JSON.parse(JSON.stringify(rejected)));
    console.log("Lignes conservées :", JSON.parse(JSON.stringify(kept)));
    console.log("Après désélection :", JSON.parse(JSON.stringify(selectedUsers.value)));
};

const isSelected = (row) => {
    return selectedUsers.value.some(u => u.id === row.id);
};

const toggleRow = (checked, row) => {
    // 🔐 Interdiction de sélectionner soi-même
    if (auth.user && auth.user.login === row.login) {
        showToast('warn', 'Non autorisé', "Vous ne pouvez pas sélectionner votre propre compte.");
        return;
    }

    if (checked) {
        // Ajouter
        if (!isSelected(row)) {
            selectedUsers.value.push({ ...row });
        }
    } else {
        // Retirer
        selectedUsers.value = selectedUsers.value.filter(u => u.id !== row.id);
    }
};

onMounted(() => {
    fetchUsers();
});

// watch(selectedUsers, (newVal, oldVal) => {
//     // Filtrer les lignes non autorisées
//     const filtered = newVal.filter(u => auth.user && auth.user.login !== u.login);

//     if (filtered.length !== newVal.length) {
//         nextTick(() => {
//             selectedUsers.value = filtered.map(u => ({ ...u }));
//         });
//     }

//     // Détecter ajout ou suppression
//     const added = newVal.filter(u => !oldVal.some(o => o.id === u.id));
//     const removed = oldVal.filter(u => !newVal.some(n => n.id === u.id));

//     if (added.length > 1) {
//         // checkboxAll
//         console.log("Checkbox All sélectionné", added.map(u => u.id));
//         showToast('info', 'Sélection', 'Toutes les lignes ont été sélectionnées');
//     } else if (added.length === 1) {
//         // ligne individuelle
//         console.log("Checkbox d'une ligne sélectionnée:", added[0].id);
//         showToast('info', 'Sélection', `Ligne sélectionnée : ${added[0].id}`);
//     }

//     if (removed.length > 1) {
//         console.log("Checkbox All désélectionné", removed.map(u => u.id));
//         showToast('info', 'Sélection', 'Toutes les lignes ont été désélectionnées');
//     } else if (removed.length === 1) {
//         console.log("Checkbox d'une ligne désélectionnée:", removed[0].id);
//         showToast('info', 'Sélection', `Ligne désélectionnée : ${removed[0].id}`);
//     }

// }, { deep: true });

// watch(selectedUsers, (newVal, oldVal) => {
//     // Détecter les lignes ajoutées
//     const added = newVal.filter(u => !oldVal.some(o => o.id === u.id));
//     if (!added.length) return; // rien de nouveau

//     // Filtrer les lignes non autorisées
//     const disallowed = added.filter(u => auth.user && auth.user.login === u.login);
//     if (!disallowed.length) return; // toutes les lignes sont autorisées

//     // Vérifier si c'est un checkboxAll (plus d'une ligne ajoutée)
//     if (added.length > 1) {
//         const logins = disallowed.map(u => u.login).join(', ');
//         showToast('info', 'Lignes non autorisées', `Tentative de sélection globale des lignes non autorisées : ${logins}`);
//         console.log("Checkbox All - lignes non autorisées :", disallowed);
//     } else if (added.length === 1) {
//         showToast('info', 'Ligne non autorisée', `Tentative de sélection d'une ligne non autorisée : ${disallowed[0].login}`);
//         console.log("Ligne non autorisée :", disallowed[0]);
//     }

//     // Retirer automatiquement les lignes non autorisées
//     nextTick(() => {
//         selectedUsers.value = newVal.filter(u => auth.user && auth.user.login !== u.login);
//     });

// }, { deep: true });


</script>

// :rowsPerPageOptions="[5,10,20,50]"

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-xl font-semibold">Liste des utilisateurs</h4>
        </div>

        <DataTable
            ref="dt"
            :value="users"
            :rows="rowsPerPage"
            :paginator="true"
            @page="onPage"
            dataKey="id"
            :rowHover="true"
            v-model:selection="selectedUsers"
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="['name','email','roles','login']"
            scrollable
            scrollHeight="auto"
            :rowClass="rowClass"
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
                        <Button 
                            v-if="selectedUsers.length > 0"
                            label="" 
                            icon="pi pi-trash" 
                            severity="danger" 
                            @click="showSelected"
                        />
                        <Button type="button" icon="pi pi-filter-slash" label="Filtre" @click="initFilters"/>
                        <Button type="button" icon="pi pi-refresh" @click="fetchUsers(true)" severity="warn" :disabled="loadingBtn" :loading="loadingBtn" :label="loadingBtn ? 'en cours...' : 'Actualiser'"/>
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

            <Column style="width:2rem" class="p-0">
                <template #body="{ data }">
                    <Checkbox
                        binary
                        :modelValue="isSelected(data)"
                        @update:modelValue="val => toggleRow(val, data)"
                        :disabled="auth.user && auth.user.login === data.login"
                    />
                </template>
            </Column>

            <Column field="id" header="N°" style="width:5%">
                <template #body="{ index }">
                    <Skeleton v-if="loading" width="2rem" height="1rem"/>
                    <span v-else>{{ (currentPage - 1) * rowsPerPage + index + 1 }}</span>
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
                            <div class="flex flex-col">
                                <span class="text-md">
                                    {{ data.name }}
                                </span>
                                <span class="text-sm text-gray-600" >
                                    {{ data.email }}
                                </span>
                            </div>
                        </div>
                    </template>
                </template>
            </Column>

            <Column field="roles" header="Rôle" style="min-width: 10rem">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="10rem" height="1rem"/>
                    <span v-else>{{ data.roles ?? 'Employé' }}</span>
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
                    <span v-else>{{ formaDateHeure(data.created_at) }}</span>
                </template>
            </Column>

            <Column header="Actions" style="width:10%">
                <template #body="{ data }">
                    <Skeleton v-if="loading" width="6rem" height="2rem" />
                    <div class="flex flex-row gap-2" v-else >
                        <SplitButton
                            :model="actionItems(data)" 
                            icon="" 
                            label="Actions" 
                            dropdownIcon="pi pi-cog" 
                            severity="warn" 
                            size="small"
                        />
                        <Button 
                            v-if="auth.user && auth.user.login !== data.login" 
                            severity="danger" 
                            type="button" 
                            icon="pi pi-trash" 
                            label="" 
                            @click="deleteTable($event, data)"
                        />
                    </div>
                </template>
            </Column>

            <template #footer>
                <div class="flex justify-between items-center p-3">
                    <span>{{ totalRows.toLocaleString() }} lignes trouvées</span>

                    <span>{{ currentPage }} sur {{ totalPages.toLocaleString() }} Page(s)</span>
                </div>
            </template>
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
:deep(.row-connect-user) {
    background-color: #ccfbf1 !important;
}
:deep(.row-deconnect-user) {
    background-color: #fee2e2 !important;
}
</style>
    