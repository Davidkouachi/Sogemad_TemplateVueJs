import axios from "axios";
import { useAuthStore } from "@/function/stores/auth";
import { getSecureItem } from "@/function/stores/secureStorage";

axios.defaults.baseURL = "http://127.0.0.1:8000";
// axios.defaults.baseURL = "http://192.168.1.2:8000";
axios.defaults.headers.common["Accept"] = "application/json";

let isRefreshing = false;
let failedQueue = [];

// 🔁 File d’attente des requêtes en pause pendant le refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 🔹 Intercepteur requête
axios.interceptors.request.use(
  async config => {
    const token = await getSecureItem("jwt_token"); // ⬅️ async OK maintenant

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const auth = useAuthStore();

      // ⚠️ Ne pas reset le timer pendant un refresh
      if (!config._isRefresh && auth?.resetInactivityTimer) {
        auth.resetInactivityTimer();
      }
    } catch (_) {}

    return config;
  },
  error => Promise.reject(error)
);

// 🔹 Intercepteur réponse
axios.interceptors.response.use(
  response => response,

  async error => {
    const auth = useAuthStore();
    const originalRequest = error.config;

    // 🚫 Si le refresh échoue → logout direct
    if (originalRequest?.url?.includes("/api/refresh")) {
      auth.logoutLocal(true);
      return Promise.reject(error);
    }

    if (auth.isLoggingOut) return Promise.reject(error);

    // --- Cas 401 : access token expiré ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Attend si refresh déjà en cours
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🟡 On récupère d’abord le refresh token
        const refreshToken = await getSecureItem("refresh_token"); // ⬅️ async OK
        
        if (!refreshToken) {
          console.warn("⚠️ Aucun refresh_token — logout direct");
          auth.logoutLocal(true);
          return Promise.reject(error);
        }

        // 🔄 On appelle ta méthode qui fait la requête /api/refresh
        const newToken = await auth.refreshAccessToken();

        // Mise à jour des headers
        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        isRefreshing = false;

        // 🔁 On relance la requête d’origine
        return axios(originalRequest);

      } catch (err) {
        console.error("❌ Refresh token ERROR :", err);

        processQueue(err, null);
        isRefreshing = false;

        const status = err.response?.status;
        const message = err.response?.data?.message || "";

        // Cas refresh_token expiré / invalide
        if (status === 401 || status === 422 || message.includes("invalid") || message.includes("expired")) {
          auth.logoutLocal(true);
          return Promise.reject(err);
        }

        auth.setExpired();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
