import { optOutAndResetAnalyticsUser } from "@/analytics";
import * as Auth from "../utils/Auth";

// TODO: Remove this  as part of the clean up of VITE_FEATURE_USE_BETTERAUTH feature flag -
// ensure we are still opting out of analytics

/**
 * Sends the user to log in once their session has ended, whether they logged
 * out or it timed out.
 *
 * This is a full page load rather than a client-side navigation, so nothing of
 * theirs stays in memoryfor whoever logs in next. 
 */
const resetToLogin = () => {
  Auth.removeToken();
  // Otherwise the next user to log in on this tab would try to reopen the map
  sessionStorage.removeItem("currentMapId");
  // Mixpanel keeps the user's identity in localStorage
  optOutAndResetAnalyticsUser();
  window.location.replace("/auth");
};

export const logOut = () => {
  return async () => {
    resetToLogin();
  };
};

export const sessionTimedOut = () => {
  return async () => {
    resetToLogin();
  };
};
