import { optOutAndResetAnalyticsUser } from "@/analytics";

/**
 * Sends the user to sign in once their session has ended, whether they signed
 * out or it expired or was revoked.
 *
 * This is a full page load rather than a client-side navigation, so nothing of
 * theirs stays in memory (Redux store, websocket, timers) for whoever signs in
 * next. Browser storage survives the reload, so their entries are cleared here.
 */
export function resetToSignIn() {
  // Otherwise the next user to sign in on this tab would try to reopen the map
  sessionStorage.removeItem("currentMapId");
  // Mixpanel keeps the user's identity in localStorage
  optOutAndResetAnalyticsUser();
  window.location.replace("/auth/sign-in");
}
