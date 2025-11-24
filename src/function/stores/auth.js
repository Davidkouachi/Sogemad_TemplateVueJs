import { defineStore } from "pinia";
import axios from "@/function/services/axios";
import router from "@/router/index";
import { ref } from "vue";
import { setSecureItem, getSecureItem, removeSecureItem } from "@/function/stores/secureStorage";

let countdownInterval = null;
let inactivityMin = 30;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    expired: false,
    sessionExpire: null,
    tempsRestant: ref(0),
    token: null,
    refreshToken: null,
    inactivityRestant: ref(inactivityMin * 60),
    inactivityExpireAt: null,
    _refreshing: false,

    manualLogout: false,
    isLoggingOut: false,

    device_id: null,
    presite: true,
  }),

  getters: {
    isAuthenticated: (state) =>
      !!state.user && !!state.token && state.sessionExpire > Date.now(),
  },

  actions: {
    // ------------------------------------------------------
    setUserSession(user, expiresInSeconds, token, refreshToken, device_id) {
      const expireAt = Date.now() + expiresInSeconds * 1000;

      this.sessionExpire = expireAt;
      this.user = user;
      this.token = token;
      this.refreshToken = refreshToken;
      this.expired = false;
      this.manualLogout = false;
      this.device_id = device_id;

      console.log(token)

      setSecureItem("jwt_token", token);
      setSecureItem("refresh_token", refreshToken);
      setSecureItem("session_expire", expireAt);
      setSecureItem("session_expired", "false");
      setSecureItem("device_id", device_id);

      console.log(getSecureItem("jwt_token"))

      const original = token;
      const retrieved = getSecureItem("jwt_token");

      console.log(original === retrieved); // true ✅


      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      this.startCountdown();
      this.startInactivityTimer();
    },

    // ------------------------------------------------------
    setExpired() {
      this.expired = true;
      setSecureItem("session_expired", "true");
    },

    // ------------------------------------------------------
    async restoreSession() {
      const token = getSecureItem("jwt_token");
      const refreshToken = getSecureItem("refresh_token");
      const expireAt = getSecureItem("session_expire");
      const savedDeviceId = getSecureItem("device_id");

      if (!token || !refreshToken || !expireAt) return false;

      this.token = token;
      this.refreshToken = refreshToken;
      this.sessionExpire = Number(expireAt);
      this.device_id = savedDeviceId;

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log(token);

      if (getSecureItem("session_expired")) return false;

      try {
        const res = await axios.get("/api/me"); // <-- await ici
        this.user = res.data;
      } catch (err) {
        console.log("expired");
        this.user = null;
        this.setExpired();
        return false;
      }

      this.startCountdown();
      this.startInactivityTimer();
      return true;
    },

    // ------------------------------------------------------
    async refreshAccessToken() {
      if (!this.refreshToken) return null;

      try {
        const res = await axios.post("/api/refresh", {
          refresh_token: this.refreshToken,
          device_id: this.device_id
        }, { _isRefresh: true });

        const newToken = res.data.access_token;
        const newRefresh = res.data.refresh_token;
        const expiresIn = res.data.expires_in;

        this.token = newToken;
        this.refreshToken = newRefresh;
        this.sessionExpire = Date.now() + expiresIn * 1000;
        this.expired = false;

        setSecureItem("jwt_token", newToken);
        setSecureItem("refresh_token", newRefresh);
        setSecureItem("session_expire", this.sessionExpire);
        setSecureItem("session_expired", "false");

        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        this.startCountdown();
        console.log('refresh');

        return newToken; // <-- Très important pour les interceptors

      } catch (err) {
        this.setExpired();
        console.error("Refresh token ERROR :", err);
        return null;
      }
    },

    // ------------------------------------------------------
    startCountdown() {
      clearInterval(countdownInterval);
      if (!this.sessionExpire) return;

      const checkToken = async () => {
        const now = Date.now();
        const diff = Math.floor((this.sessionExpire - now) / 1000);
        this.tempsRestant = diff > 0 ? diff : 0;

        if (diff <= 0) {
          clearInterval(countdownInterval);
          this.setExpired();
          this.clearInactivityTimer();
          return;
        }

        // 🔹 Refresh automatique si < 5 min
        if (diff <= 60 && !this._refreshing) {
          const stillActive = this.inactivityExpireAt && now < this.inactivityExpireAt;

          if (stillActive) {
            this._refreshing = true;
            await this.refreshAccessToken(); // ✅ ok maintenant
            this._refreshing = false;
          } else {
            console.log("⚠️ Token non rafraîchi car inactif");
            this.setExpired();
            this.clearInactivityTimer();
            clearInterval(countdownInterval);
          }
        }
      };

      countdownInterval = setInterval(() => {
        checkToken();
      }, 1000);
    },

    // ------------------------------------------------------
    startInactivityTimer() {
      this.clearInactivityTimer();
      this.inactivityRestant = inactivityMin * 60;
      this.inactivityExpireAt = Date.now() + this.inactivityRestant * 1000;

      const updateActivity = () => this.resetInactivityTimer();
      const events = ["mousemove", "keydown", "scroll", "click"];
      events.forEach(evt => window.addEventListener(evt, updateActivity));

      this._inactivityInterval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((this.inactivityExpireAt - now) / 1000);
        this.inactivityRestant = diff > 0 ? diff : 0;

        if (diff <= 0) {
          console.log("🕓 Inactivité détectée — session expirée");
          this.setExpired();
          this.clearInactivityTimer();
          clearInterval(countdownInterval);
        }
      }, 1000);
    },

    resetInactivityTimer() {
      if (this.user && !this.expired) {
        this.inactivityExpireAt = Date.now() + inactivityMin * 60 * 1000;
        this.inactivityRestant = inactivityMin * 60;
      }
    },

    clearInactivityTimer() {
      clearInterval(this._inactivityInterval);
      const events = ["mousemove", "keydown", "scroll", "click"];
      events.forEach(evt =>
        window.removeEventListener(evt, this.resetInactivityTimer)
      );
    },

    // ------------------------------------------------------
    logoutLocal(expired = false) {
      if (this.isLoggingOut) return;
      this.isLoggingOut = true;

      this.clearInactivityTimer();
      clearInterval(countdownInterval);

      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.sessionExpire = null;
      this.tempsRestant = 0;
      this.expired = expired;
      this.device_id = null;

      removeSecureItem("jwt_token");
      removeSecureItem("refresh_token");
      removeSecureItem("session_expire");
      removeSecureItem("device_id");

      delete axios.defaults.headers.common["Authorization"];

      axios.interceptors.request.use(config => {
        config.headers.Authorization = "";
        return config;
      });

      if (expired === true) {
        router.push({ name: "Authentification" }).finally(() => {
          this.isLoggingOut = false;
        });
      } else {
        this.isLoggingOut = false;
      }
    },

    // ------------------------------------------------------
    logoutServer(manuel = true) {
      if (this.isLoggingOut) return;
      this.isLoggingOut = true;

      if (!this.refreshToken) {
        this.logoutLocal();
        this.isLoggingOut = false;
        return;
      }

      this.manualLogout = manuel;

      axios.post("/api/logout", { refresh_token: this.refreshToken })
        .then(() => {
          this.expired = manuel;
          removeSecureItem("jwt_token");
          removeSecureItem("refresh_token");
          removeSecureItem("device_id");
          console.log("User déconnecté backend");
        })
        .catch(() => {})
        .finally(() => {
          this.isLoggingOut = false;
          if (manuel === true) {
            this.logoutLocal();
            router.push({ name: "Authentification" });
          }
        });
    },
  },
});
