import Swal from 'sweetalert2';
import { useAuthStore } from '@/function/stores/auth';

const auth = useAuthStore();
// 🛠 Supprime le préloader de déconnexion s'il existe
export function removeLogoutPreloaderAndToast(showToast) {
  
    const user = localStorage.getItem('nu');
    if (user) {
      showToast('info', 'Compte déconnecté', `Merci de votre visite ${user} à bientôt 👋`);
      localStorage.removeItem('nu'); // nettoyage
    } else{
      showToast('info', 'Compte déconnecté', `Merci de votre visite, à bientôt 👋`);
    }
    auth.manualLogout = false
    console.log('♻️ Préloader de déconnexion supprimé du DOM');
}
