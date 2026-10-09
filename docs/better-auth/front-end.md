# Better Auth: front end

How the front end uses Better Auth when `VITE_FEATURE_USE_BETTERAUTH=true`. See also the [overview](overview.md).

## Auth client: `src/lib/auth/auth-client.ts`

`authClient` is Better Auth's React client. It has no `baseURL`, so it calls `/api/auth/*` on the page's own origin and the session cookie is first-party. That means `/api` must be served from the front end's origin: in dev, Vite proxies it (`vite.config.ts`). In deployed environments, the reverse proxy does.

Its `onError` sends the user to `/auth/sign-in` when a Better Auth request returns 401, except on `/auth/*` pages, where a 401 is a form error such as a wrong password.

## Provider: `src/providers/AuthProviderWrapper.tsx`

Wraps the app in Better Auth UI's `AuthProvider`, which needs the TanStack `QueryClient` created in `index.tsx`. It sets:

- `redirectTo="/app"` after sign-in
- `minPasswordLength: 6`, matching the back end
- `requireEmailVerification: true`, matching the back end, so sign-up and sign-in send unverified users to the verify-email page
- `viewPaths`, which map Better Auth UI's views onto our routes under `/auth`
- `navigate` and `Link`, so Better Auth UI uses React Router

## Routes

`index.tsx` picks `RoutesNew` or `RoutesLegacy`. In `RoutesNew`, `/app` and `/app/my-account/*` sit behind `RequireAuth`, which shows a spinner while the session loads and sends signed-out users to `/auth/sign-in`.

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

The sign-in, register and verify-email pages send a user who already has a session to `/app`.

## Email verification

After sign-up (`RegisterFormNew`), or a sign-in attempt by an unverified user (`SignIn`), the email is saved to `sessionStorage` under `better-auth-ui.verify-email` and the user goes to `/auth/verify-email`. That page reads the email back to show which inbox to check and to resend the link. A resent link redirects to `/app` once clicked.

`VerifyEmailPage` turns off `refetchOnWindowFocus` for its session query. Otherwise, switching back from the email tab would remount `VerifyEmail` and reset its resend cooldown.

## Loading the app: `pages/MapApp.tsx`

`MapAppBetterAuth` doesn't check a token: `RequireAuth` has already checked the session. It loads the user's details, opens the websocket, and loads their maps. `MapAppShell` renders the same UI for both variants.

The websocket client in `actions/WebSocketActions.ts` no longer sends a token. The browser sends the cookie with the handshake.

## When the session expires

Two things catch a 401:

- **Better Auth requests:** `authClient`'s `onError`, above.
- **Our API requests (axios):** `redirectOnUnauthorized()` in `src/lib/auth/redirect-on-unauthorized.ts`, registered in `index.tsx`. It signs out first, because a session can be valid to Better Auth but have no linked app user. Without signing out, the sign-in page would see the session and send the user straight back to `/app`.

With the flag on, `RequestActions.ts` no longer dispatches `sessionTimedOut`.

## Components

`src/components/auth/` and most of the new `src/components/ui/` files come from [Better Auth UI](https://better-auth-ui.com)'s shadcn registry (`@better-auth-ui` in `components.json`). They're copied into the repo, so we own them and can restyle them. Re-adding one from the registry overwrites local changes.

Our own pieces:

- `pages/Register/RegisterForm/RegisterFormNew.tsx`, `RegisterFormFields.tsx` and `RegisterFormSchema.ts`: the registration form, which sends our extra `user` fields to `/api/auth/sign-up/email`. See [Registration](registration.md).
- `TopBarNew` in `components/top-bar/TopBar.tsx`, which uses Better Auth UI's `UserButton`.

## Debugging

`ReactQueryDevtools` is mounted in `index.tsx`, and the query client is on `window.__TANSTACK_QUERY_CLIENT__` for the browser extension. Better Auth UI's session queries show up there.
