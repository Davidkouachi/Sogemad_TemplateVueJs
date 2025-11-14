<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';

import { usePreloaderStore } from '@/function/stores/preloader'
import { useToastAlert } from '@/function/function/ToastAlert'
import { useSwalAlert } from '@/function/function/SwalAlert'
import { ref, onBeforeMount, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import { initSession } from '@/function/stores/useSession'

// --- Stores & alerts
const preloader = usePreloaderStore()
const { showSwal } = useSwalAlert()

// --- Loading global (bouton)
const loading = ref(false)
const loading2 = ref(false)

// --- Données dashboard
const userCount = ref(0)
const loadingUserCount = ref(true)

// --- API count utilisateurs
async function fetchUserCount(load) {
  loading2.value = load
  loadingUserCount.value = true
  try {

    // Appel API (à adapter si ton endpoint est différent)
    const res = await axios.get('/api/users/count')
    userCount.value = res.data?.count || 0
  } catch (err) {
    console.error('Erreur lors du chargement du nombre d’utilisateurs :', err)
    userCount.value = 0
  } finally {
    loadingUserCount.value = false
    loading2.value = false
  }
}

async function reloadWinget() {
  await fetchUserCount(true)
}

// --- Exemple bouton test
function verifierMatricule() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    showSwal({
      icon: 'success',
      title: 'Succès',
      text: 'Connexion réussie.',
    })
  }, 2000)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

onMounted(async () => {   // <-- async ajouté

  await nextTick();       // attend que le DOM soit mis à jour
  // await fetchUserCount(true);
});


</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget />
            <BestSellingWidget />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div>
    </div>
</template>


