<template>
    <Toast /> 
    <router-view />
</template>

<style scoped>
.my-toast .p-toast {
  z-index: 9999;
}
</style>

<script setup>
import Toast from 'primevue/toast';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const router = useRouter();

// Supprimer tous les toasts quand on change de route
if (toast && toast.remove) toast.remove();
</script>
