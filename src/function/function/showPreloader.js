import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePreloaderSpinner = defineStore('preloaderSpinner', () => {
  const loadingSpiner = ref(false);
  const messageSpiner = ref('');

  function showSpiner(msg = 'Chargement...', callback, delay = 1000) {
    messageSpiner.value = msg;
    loadingSpiner.value = true;

    if (callback) {
      setTimeout(() => {
        callback();
        // hideSpiner();
      }, delay);
    }
  }

  function hideSpiner() {
    loadingSpiner.value = false;
    messageSpiner.value = '';
  }

  return { loadingSpiner, messageSpiner, showSpiner, hideSpiner };
});

