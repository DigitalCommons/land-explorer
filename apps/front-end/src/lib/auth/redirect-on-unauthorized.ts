import axios from "axios";

/**
 * Sends the user to sign in when a back-end API call returns 401, i.e. their
 * Better Auth session has expired or been revoked.
 *
 * The authClient's onError only sees Better Auth's own requests, so the app's
 * axios calls need this separately.
 */
export function redirectOnUnauthorized() {
  axios.interceptors.response.use(undefined, (error) => {
    // A 401 on the auth pages is a form error for the page to show
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/auth")
    ) {
      window.location.href = "/auth/sign-in";
    }
    return Promise.reject(error);
  });
}
