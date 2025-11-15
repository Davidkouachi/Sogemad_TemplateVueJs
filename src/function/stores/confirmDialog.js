import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfirmDialog = defineStore('confirmDialog', () => {
  const loadingDialog = ref(false);
  const messageDialog = ref('');
  const onConfirmDialog = ref(null); // ✅ callback à exécuter si Oui

  function showDialog(msg = 'Vous êtes sûr de vouloir continuer ?', callback = null) {
    messageDialog.value = msg;
    onConfirmDialog.value = callback;
    loadingDialog.value = true;
  }

  function hideDialog() {
    loadingDialog.value = false;
    messageDialog.value = '';
    onConfirmDialog.value = null;
  }

  function confirmDialog() {
    if (onConfirmDialog.value) onConfirmDialog.value();
    hideDialog();
  }

  return {
    loadingDialog,
    messageDialog,
    onConfirmDialog,
    showDialog,
    hideDialog,
    confirmDialog
  };
});
