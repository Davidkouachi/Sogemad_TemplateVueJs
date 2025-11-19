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

    presite: false,
  }),

  getters: {
    isAuthenticated: (state) =>
      !!state.user && !!state.token && state.sessionExpire > Date.now(),
  },

  actions: {
    // ------------------------------------------------------
    setUserSession(user, expiresInSeconds, token, refreshToken) {
      const expireAt = Date.now() + expiresInSeconds * 1000;

      this.sessionExpire = expireAt;
      this.user = user;
      this.token = token;
      this.refreshToken = refreshToken;
      this.expired = false;
      this.manualLogout = false;

      setSecureItem("jwt_token", token);
      setSecureItem("refresh_token", refreshToken);
      setSecureItem("session_expire", expireAt);
      setSecureItem("session_expired", "false");

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
      const token = await getSecureItem("jwt_token");
      const refreshToken = await getSecureItem("refresh_token");
      const expireAt = await getSecureItem("session_expire");
      const presiteValue = await getSecureItem("presite");

      this.presite = presiteValue === "1";

      if (!token || !refreshToken || !expireAt) return false;

      this.token = token;
      this.refreshToken = refreshToken;
      this.sessionExpire = Number(expireAt);

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (this.expired) return false;

      try {
        const res = await axios.get("/api/me");
        this.user = res.data;
      } catch {
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
      try {
        const res = await axios.post(
          "/api/refresh",
          { refresh_token: this.refreshToken },
          { _isRefresh: true }
        );

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
        console.log('refresh')

        return newToken;   // <-- 🔥 OBLIGATOIRE
      } catch (err) {
        this.setExpired();
        throw err;         // <-- IMPORTANT pour axios
      }
    },

    // ------------------------------------------------------
    startCountdown() {
      clearInterval(countdownInterval);
      if (!this.sessionExpire) return;

      countdownInterval = setInterval(async () => {
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
          const stillActive =
            this.inactivityExpireAt && now < this.inactivityExpireAt;

          if (stillActive) {
            this._refreshing = true;
            await this.refreshAccessToken();
            this._refreshing = false;
          } else {
            console.log("⚠️ Token non rafraîchi car inactif");
            this.setExpired();
            this.clearInactivityTimer();
            clearInterval(countdownInterval);
          }
        }
      }, 1000);
    },

    // ------------------------------------------------------
    startInactivityTimer() {
      this.clearInactivityTimer();
      this.inactivityRestant = inactivityMin * 60;
      this.inactivityExpireAt = Date.now() + this.inactivityRestant * 1000;

      const updateActivity = () => this.resetInactivityTimer();
      const events = ["mousemove", "keydown", "scroll", "click"];
      events.forEach((evt) => window.addEventListener(evt, updateActivity));

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
      events.forEach((evt) =>
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
      this.presite = false;

      removeSecureItem("jwt_token");
      removeSecureItem("refresh_token");
      removeSecureItem("session_expire");
      removeSecureItem("presite");

      delete axios.defaults.headers.common["Authorization"];

      // Empêche axios d'intercepter et de relancer un logout
      axios.interceptors.request.use(
        config => {
          config.headers.Authorization = "";
          return config;
        }
      );

      if (expired === true) {
        router.push({ name: "Authentification" }).finally(() => {
          this.isLoggingOut = false;   // <-- RELAXED APRÈS navigation
        });
      } else {
        this.isLoggingOut = false;
      }
    },

    // ------------------------------------------------------
    async logoutServer(manuel = true) {

      if (this.isLoggingOut) return;
      this.isLoggingOut = true;

      if (!this.refreshToken) {
        this.logoutLocal();
        this.isLoggingOut = false;
        return;
      }

      try {
        this.manualLogout = manuel;

        await axios.post("/api/logout", { refresh_token: this.refreshToken });

        this.expired = manuel;
        removeSecureItem("jwt_token");
        removeSecureItem("refresh_token");

        console.log("User déconnecté backend");
      } catch (_) {}

      if (manuel === true) {
        this.logoutLocal();
        router.push({ name: "Authentification" });
      }

      this.isLoggingOut = false;
    },

    // ------------------------------------------------------
    setPresite(value = true) {
      this.presite = value;
      setSecureItem("presite", value ? "1" : "0");
    },

    togglePresite() {
      this.presite = !this.presite;
      setSecureItem("presite", this.presite ? "1" : "0");
    },
  },
});
