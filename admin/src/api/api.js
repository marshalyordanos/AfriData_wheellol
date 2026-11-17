import axios from "axios";
import TokenService from "./token.service";

import { logout } from "../redux/auth/authSlice";
import { showServerError } from "../lib/feedback";

// Toast at the bottom-right with a clear title + the server's message(s)
let lastStatus = 0;
const handleErrorResponse = (errorMessage, status = lastStatus) => {
  showServerError(errorMessage, status);
};

const instance = axios.create({
  // baseURL: "http://134.209.59.98:3000/",
  // baseURL: "https://api.wheellol.com/",
  // baseURL: "https://vegetarian-pushed-town-pipeline.trycloudflare.com/",

  // baseURL: "https://car-back-bemu.onrender.com/",
  baseURL: "http://localhost:3000/",

  headers: {
    "Content-Type": "application/json",
  },
});

let isreFrasing = false; // (old flag, kept for the old code below)

/* ---------------------------------------------------------------- refresh
 * Access token: 30 min. Refresh token: 1 hour, and every refresh gives a new
 * one, so you stay signed in while you use the app.
 * - The refresh token is sent as the Bearer token (the old code sent the
 *   expired access token, so the refresh always failed and logged you out).
 * - Only one refresh runs at a time; other requests wait for it.
 * - If another tab already refreshed, its new token is used.
 */
let refreshPromise = null;

const refreshTokens = () => {
  if (refreshPromise) return refreshPromise;
  const used = TokenService.getLocalRefreshToken();
  refreshPromise = (async () => {
    if (!used) throw new Error("No refresh token");
    try {
      const rs = await axios.get(`${instance.defaults.baseURL}auth/refresh`, {
        headers: { Authorization: `Bearer ${used}` },
      });
      const tokens = rs.data?.data?.tokens || rs.data?.tokens || rs.data;
      if (!tokens?.accessToken) throw new Error("No token in refresh response");
      TokenService.updateLocalAccessToken(tokens.accessToken);
      TokenService.updateLOcalRefreshToken(tokens.refreshToken);
      return tokens.accessToken;
    } catch (e) {
      // another tab refreshed first (refresh tokens are single use)
      const now = TokenService.getLocalRefreshToken();
      if (now && now !== used) return TokenService.getLocalAccessToken();
      throw e;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

const isAuthUrl = (url = "") => /auth\/(login|login-admin|signin|refresh)/.test(url);

const setup = (store) => {
  instance.interceptors.request.use(
    (config) => {
      const token = TokenService.getLocalAccessToken();
      if (token) {
        config.headers["Authorization"] = "Bearer " + token; // for Spring Boot back-end
        // config.headers["x-access-token"] = token; // for Node.js Express back-end
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const { dispatch } = store;

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const originalConfig = err.config || {};
      lastStatus = err.response?.status || 0;
      const toast = (e) => {
        if (!originalConfig?.suppressErrorToast) {
          handleErrorResponse(e.response?.data?.message || e.message);
        }
      };

      // Expired access token → refresh once, then repeat the request
      if (err.response?.status === 401 && !originalConfig._retry && !isAuthUrl(originalConfig.url)) {
        originalConfig._retry = true;
        try {
          const token = await refreshTokens();
          originalConfig.headers = { ...(originalConfig.headers || {}), Authorization: `Bearer ${token}` };
          return instance(originalConfig);
        } catch (refreshErr) {
          // Server crashed / offline: keep the user signed in. Sign out only when the session is rejected.
          const rejected = [400, 401, 403, 404].includes(refreshErr.response?.status) || refreshErr.message === "No refresh token";
          if (!rejected) {
            toast(err);
            return Promise.reject(err);
          }
          if (TokenService.getUser()) {
            TokenService.removeUser();
            dispatch(logout());
            handleErrorResponse("Your session has ended. Please sign in again.", 401);
          }
          return Promise.reject(refreshErr);
        }
      }

      toast(err);
      return Promise.reject(err);
    }
  );

  /* Old response interceptor (sent the expired access token to /auth/refresh,
     so the refresh failed and the admin was logged out after the token expired)
  instance.interceptors.response.use(
    (res) => {
      isreFrasing = false;
      return res;
    },
    async (err) => {
      const originalConfig = err.config || {};
      lastStatus = err.response?.status || 0;
      if (originalConfig.url !== "/auth/signin" && err.response) {
        if (err.response.status === 401 && !isreFrasing) {
          originalConfig._retry = true;
          isreFrasing = true;
          try {
            const rs = await instance.get("/auth/refresh", {
              refreshToken: TokenService.getLocalRefreshToken(),
            });
            const { accessToken, refreshToken } = rs.data;
            TokenService.updateLocalAccessToken(accessToken);
            TokenService.updateLOcalRefreshToken(refreshToken);
            return instance(originalConfig);
          } catch (_error) {
            TokenService.removeUser();
            dispatch(logout());
            if (!originalConfig?.suppressErrorToast) {
              handleErrorResponse(err.response?.data?.message || err.message);
            }
            return Promise.reject(_error);
          }
        } else {
          if (!originalConfig?.suppressErrorToast) {
            handleErrorResponse(err.response?.data?.message || err.message);
          }
          return Promise.reject(err);
        }
      } else if (
        err.response?.status !== 401 ||
        (originalConfig.url === "/auth/signin" && err.response)
      ) {
        if (!originalConfig?.suppressErrorToast) {
          handleErrorResponse(err.response?.data?.message || err.message);
        }
        return Promise.reject(err);
      }
      return Promise.reject(err);
    }
  );
  */
};
export default instance;
export { setup };
