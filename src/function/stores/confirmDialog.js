import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfirmDialog = defineStore('confirmDialog', () => {
  const loadingDialog = ref(false);
  const messageDialog = ref('');
  const headerDialog = ref('Confirmation'); // titre du dialog
  const widthDialog = ref('350px');         // largeur du dialog
  const onConfirmDialog = ref(null); // ✅ callback à exécuter si Oui

  function showDialog(options = {}) {
    messageDialog.value = options.msgDialog || 'Êtes-vous sûr de continuer ?';
    headerDialog.value = options.headerDialog || 'Confirmation';
    widthDialog.value = options.widthDialog || '350px';
    onConfirmDialog.value = options.callback || null;
    loadingDialog.value = true;
  }

  function hideDialog() {
    loadingDialog.value = false;
    messageDialog.value = '';
    onConfirmDialog.value = null;
    headerDialog.value = 'Confirmation';
    widthDialog.value = '350px';
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
    confirmDialog,
    widthDialog,
    headerDialog
  };
});
