# Better Auth: back end

How the back end uses Better Auth when `FEATURE_USE_BETTERAUTH=true`. For env vars and the tables, see the [overview](overview.md).

## Config: `src/utils/auth.ts`

`auth` is the Better Auth instance. It has its own `mysql2` pool, separate from Sequelize.

| Setting | Why |
| --- | --- |
| `modelName: "auth_*"` | Keeps Better Auth's tables apart from our `user` table |
| `user.additionalFields.appUserId` | Links `auth_user` to `user`. `input: false`, so clients can't set it |
| `cookiePrefix: "lx"` | Cookies are named `lx.session_token` and so on |
| `advanced.ipAddress.ipAddressHeaders: ["x-client-ip"]` | Rate limits are per IP. The front end's Caddy sets `X-Client-IP` to the user's address (see `apps/front-end/Dockerfile`). `X-Forwarded-For` only shows the Coolify proxy, which would put every user in one shared bucket |
| `rateLimit.customRules` | Allows 10 a minute on `/email-otp/verify-email` and `/email-otp/change-email`. The plugin's default of 3 matched the code's own 3 tries, so a 4th try got a 429 instead of `TOO_MANY_ATTEMPTS`, which tells the user to request a new code |
| `session.cookieCache` (5 minutes) | Saves a database read per request. A revoked or signed-out session can keep working for up to 5 minutes if its `lx.session_data` cookie is still sent, e.g. a copied cookie. Browsers clear it on sign-out |
| `emailAndPassword.password` | bcrypt with cost 10, the same as the old auth, so existing hashes still verify |
| `minPasswordLength: 6` | Matches the old rule. The front end's `AuthProviderWrapper` uses the same value |
| `requireEmailVerification` | Users can't sign in until they've verified their email, see [Email verification](#email-verification) |
| `sendResetPassword` | Our SendGrid email, see [Emails](#emails) |
| `emailVerification` | When verification codes are sent and what happens after, see [Email verification](#email-verification) |
| `databaseHooks.user.create` | Writes our `user` row during sign-up, see [Registration](registration.md) |
| `databaseHooks.user.update` | `preUserUpdateFlow`, which copies name and email changes to `user`, see [Account settings](account-settings.md#keeping-user-in-step) |
| `hooks.before` | `confirmPasswordForEmailChange`, which checks the password before an email change code is sent, see [Account settings](account-settings.md#email) |
| `revokeSessionsOnPasswordReset` | A password reset signs the user out on every device. Other devices keep working until their cookie cache expires |
| `generateId` | Lets MySQL auto-increment `user.id`; Better Auth's own tables get Better Auth ids |
| `appUserPlugin()` | Describes `user` to Better Auth so the sign-up hook can write it |
| `emailOTP()` | Verifies emails with a 6-digit code instead of a link, see [Email verification](#email-verification). `changeEmail` lets users change their email with a code too, see [Account settings](account-settings.md#email). `disableSignUp: true`, so users can only sign up through `/sign-up/email`, where our `user` row is written |
| `disabledPaths` | Turns off the `emailOTP` plugin's code sign-in and code password reset, which we don't use. Password reset is still link-based |

## Routes: `src/server.ts`

### `/api/auth/*`

All of Better Auth's endpoints (sign-in, sign-up, sign-out, get-session, password reset and so on) go through one catch-all route:

```ts
server.route({
  method: "*",
  path: "/api/auth/{path*}",
  options: { auth: false, payload: { parse: false, output: "stream" } },
  handler: async (request, h) => {
    await toNodeHandler(auth)(request.raw.req, request.raw.res);
    return h.abandon;
  },
});
```

`payload.parse: false` matters: if Hapi reads the body first, Better Auth gets an empty stream. `h.abandon` tells Hapi that Better Auth has already sent the response.

### The `session` strategy

A custom `betterauth` scheme replaces the bearer-token `simple` strategy and becomes the default:

1. Call `auth.api.getSession` with the request's headers (the cookie).
2. No session, or a session without `appUserId`: respond 401.
3. Otherwise, authenticate with `credentials: { user_id: appUserId }`.

Route handlers still read `request.auth.credentials.user_id`, so they don't change.

### Legacy routes

`userAuthRoutes()` in `routes/user.ts` returns `legacyUserAuthRoutes` only when the flag is off:

- `POST /api/user/register`
- `POST /api/user/password-reset`
- `POST /api/token`
- `POST /api/user/email`
- `POST /api/user/password`

The rest of `userRoutes` (details, feedback, consent and so on) is the same either way. So is `userOrgRoutes` (`routes/userOrganisation.ts`), which saves organisation details from the settings modal, see [Account settings](account-settings.md#organisation-details).

## Websockets: `src/websockets/server.ts`

Authentication is now `io.use` middleware, so a bad connection is refused before `connection` fires. With the flag on, it reads the cookie from the handshake and looks up the session the same way as the Hapi strategy. A missing session or `appUserId` gets `next(new Error("unauthorized"))`.

As before, nothing in here may throw: an uncaught error crash-loops the server.

## Emails

The auth emails are sent by functions in `src/emails/email.ts`:

| Email | Function | Sent by | Expires after |
| --- | --- | --- | --- |
| Password reset (a link) | `sendPasswordReset` | Better Auth | `RESET_PASSWORD_EXPIRY_SECONDS` (1 hour) |
| Email verification (a code) | `sendVerificationOTP` | The `emailOTP` plugin, at sign-up, at sign-in when unverified, and when changing email | `VERIFICATION_CODE_EXPIRY_SECONDS` (15 minutes) |
| Successful registration | `sendRegisteredEmail` | `postEmailVerificationFlow`, once a new user verifies | Doesn't expire |

The reset tokens and verification codes are stored in `auth_verification`.

`sendVerificationOTP` is called for every kind of code the plugin can send, but only sends `email-verification` and `change-email` codes, both with the same template. Any other type is logged as an error, because those flows are switched off in `disabledPaths`.

For how emails are built, previewed and sent, see [Emails](../back-end/emails.md).

## Email verification

With `requireEmailVerification: true`, an unverified user can't sign in. Users verify by entering a 6-digit code from the email, rather than clicking a link.

The `emailOTP` plugin, with `overrideDefaultEmailVerification: true`, replaces Better Auth's verification link with a code:

| Setting | Effect |
| --- | --- |
| `overrideDefaultEmailVerification` | Better Auth's verification emails send a code (`sendVerificationOTP`) instead of a link |
| `expiresIn` | Codes expire after 15 minutes |

Better Auth's defaults also apply: codes are 6 digits, and a code can be tried 3 times before the user has to request a new one.

The `emailVerification` settings say when a code is sent and what happens after:

| Setting | Effect |
| --- | --- |
| `sendOnSignUp` | Sends a code at sign-up. Sign-up doesn't create a session |
| `sendOnSignIn` | Sends a fresh code when an unverified user tries to sign in |
| `autoSignInAfterVerification` | A correct code signs the user in, so they land in the app |
| `afterEmailVerification` | `postEmailVerificationFlow`, which sends the welcome email to new sign-ups |

The front end posts the code to `/api/auth/email-otp/verify-email`. That sets `emailVerified`, runs `afterEmailVerification`, then creates the session and sets the cookie. There's no redirect: the front end sends the user to `/app`. The full sign-up flow is in [Registration](registration.md).

The migration script creates existing users unverified, so they verify on their first sign-in: `sendOnSignIn` emails them a code, and `autoSignInAfterVerification` signs them in once they enter it.

## Migrations

| Migration | Creates |
| --- | --- |
| `20260925091551-create-better-auth-user-table` | `auth_user` |
| `20260925091552-create-better-auth-session-table` | `auth_session` |
| `20260925091553-create-better-auth-account-table` | `auth_account` |
| `20260925091554-create-better-auth-verification-table` | `auth_verification` |
| `20260925120501-add-appuserid-to-authuser-table` | `auth_user.appUserId`, unique, foreign key to `user.id`, `ON DELETE SET NULL` |

These are Sequelize migrations rather than Better Auth's CLI, so `be-migrate` runs them with everything else. If a Better Auth upgrade or a new plugin needs schema changes, write them as a Sequelize migration. `npx @better-auth/cli generate` can show what SQL it expects.

## Tests

`src/services/authUser.test.ts` covers the hooks in `src/services/authUser.ts`: registration, email verification, and changing name and email.
