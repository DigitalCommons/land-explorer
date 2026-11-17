# Better Auth: front end

How the front end uses Better Auth when `VITE_FEATURE_USE_BETTERAUTH=true`. See also the [overview](overview.md).

## Auth client: `src/lib/auth/auth-client.ts`

`authClient` is Better Auth's React client. It has no `baseURL`, so it calls `/api/auth/*` on the page's own origin and the session cookie is first-party. That means `/api` must be served from the front end's origin: in dev, Vite proxies it (`vite.config.ts`). In deployed environments, the reverse proxy does.

It registers Better Auth's `emailOTPClient()` plugin, for verifying emails with a code (see [Email verification](#email-verification)).

Its `onError` calls `resetToSignIn` (see [When the session ends](#when-the-session-ends)) when a Better Auth request returns 401, except on `/auth/*` pages, where a 401 is a form error such as a wrong password.

## Provider: `src/providers/AuthProviderWrapper.tsx`

Wraps the app in Better Auth UI's `AuthProvider`, which needs the TanStack `QueryClient` created in `index.tsx`. It sets:

- `redirectTo="/app"` after sign-in
- `minPasswordLength: 6`, matching the back end
- `confirmPassword: true`, so the reset and change password forms ask for the new password twice
- `requireEmailVerification: true`, matching the back end, so sign-up and sign-in send unverified users to the verify-email page
- `viewPaths`, which map Better Auth UI's views onto our routes under `/auth`
- `navigate` and `Link`, so Better Auth UI uses React Router
- `plugins={[emailOtpPlugin()]}`, Better Auth UI's email OTP plugin. The components in `src/components/auth/email-otp/` read its settings and text with `useAuthPlugin`

## Routes

`index.tsx` picks `RoutesNew` or `RoutesLegacy`. In `RoutesNew`, `/app` and `/app/my-account/*` sit behind `RequireAuth`, which shows a spinner while the session loads and sends signed-out users to `/auth/sign-in`. If the session ends while a user's details are loaded, it calls `resetToSignIn` instead (see [When the session ends](#when-the-session-ends)).

`pages/Authentication.tsx` has the `/auth` routes:

| Path | Page |
| --- | --- |
| `/auth` | Redirects to `/auth/sign-in` |
| `/auth/sign-in` | `Login.tsx` |
| `/auth/register` | `SignUpPage.tsx`, which renders `RegisterFormNew` |
| `/auth/forgot-password` | `ForgottenPasswordPage.tsx` |
| `/auth/reset-link-sent` | `ResetLinkSentPage.tsx` |
| `/auth/reset-password` | `ResetPasswordPage.tsx`, opened from the email link |
| `/auth/verify-email` | `VerifyEmailPage.tsx`, see [Email verification](#email-verification) |
| `/auth/sign-out` | `SignOut` |

Every page here except sign-out sends a user who already has a session to `/app`.

## Email verification

Users verify their email by entering a 6-digit code from the email, not by clicking a link.

After sign-up (`RegisterFormNew`), or a sign-in attempt by an unverified user (`SignIn`), the email is saved to `sessionStorage` under `better-auth-ui.verify-email` and the user goes to `/auth/verify-email`. `VerifyEmailPage` renders `VerifyEmailOtp` (`src/components/auth/email-otp/verify-email-otp.tsx`), which reads the email back to show which inbox to check, and takes the code. If there's no saved email, the user types it in and asks for a code.

A correct code signs the user in (`autoSignInAfterVerification` on the back end), and `VerifyEmailOtp` sends them to `/app`.

Resending a code has a 60-second cooldown (`src/lib/auth/use-resend-cooldown.ts`), to keep users off the back end's rate limit. Arriving straight from sign-up or sign-in starts the cooldown, because a code has just been sent.

Errors show inside the card rather than as a toast, so they stay next to the code the user is typing. `getFriendlyAuthErrorMessage` in `src/lib/auth/auth-error-message.ts` picks the message. It tells an expired code (`OTP_EXPIRED`) apart from a wrong one (`INVALID_OTP`), which Better Auth UI gives one combined message, and tells the user to request a new code after 3 wrong tries (`TOO_MANY_ATTEMPTS`). `ErrorToaster` uses the same function for its toasts.

`VerifyEmailPage` turns off `refetchOnWindowFocus` for its session query. Otherwise, switching back from the email tab would remount `VerifyEmailOtp` and reset its resend cooldown.

## Loading the app: `pages/MapApp.tsx`

`MapAppBetterAuth` doesn't check a token: `RequireAuth` has already checked the session. It loads the user's details, opens the websocket, and loads their maps. `MapAppShell` renders the same UI for both variants.

The websocket client in `actions/WebSocketActions.ts` no longer sends a token. The browser sends the cookie with the handshake.

## When the session ends

`resetToSignIn()` in `src/lib/auth/reset-to-sign-in.ts` sends the user to `/auth/sign-in` with a full page load rather than a client-side navigation, so none of their data stays in memory for whoever signs in next. Browser storage survives the reload, so it also clears `currentMapId` from `sessionStorage` (otherwise the next user would try to reopen the map) and resets Mixpanel's identity.

It's called when:

- **A Better Auth request returns 401:** `authClient`'s `onError`, above.
- **Our API requests (axios) return 401:** `redirectOnUnauthorized()` in `src/lib/auth/redirect-on-unauthorized.ts`, registered in `index.tsx`. It signs out first, because a session can be valid to Better Auth but have no linked app user. Without signing out, the sign-in page would see the session and send the user straight back to `/app`.
- **The session disappears while the app is open:** `RequireAuth`, above.
- **The user signs out.**

With the flag on, `RequestActions.ts` no longer dispatches `sessionTimedOut`.

## Components

`src/components/auth/` and most of the new `src/components/ui/` files come from [Better Auth UI](https://better-auth-ui.com)'s shadcn registry (`@better-auth-ui` in `components.json`). They're copied into the repo, so we own them and can restyle them. Re-adding one from the registry overwrites local changes.

Our own pieces:

- `pages/Register/RegisterForm/RegisterFormNew.tsx`, `RegisterFormFields.tsx` and `RegisterFormSchema.ts`: the registration form, which sends our extra `user` fields to `/api/auth/sign-up/email`. See [Registration](registration.md).
- `TopBarNew` in `components/top-bar/TopBar.tsx`, which uses Better Auth UI's `UserButton`. Its menu adds My Maps, User Guide, and Donate below the `md` breakpoint, where there's no room for the Donate button in the top bar. The user button shows the name from the `xl` breakpoint, and only the avatar below it.
- `components/modals/UserAccountSettings/`, the settings modal opened from the user menu. See [Account settings](account-settings.md).

## Debugging

`ReactQueryDevtools` is mounted in `index.tsx`, and the query client is on `window.__TANSTACK_QUERY_CLIENT__` for the browser extension. Better Auth UI's session queries show up there.
