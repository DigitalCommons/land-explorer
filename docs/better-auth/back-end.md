# Better Auth: back end

How the back end uses Better Auth when `FEATURE_USE_BETTERAUTH=true`. For env vars and the tables, see the [overview](overview.md).

## Config: `src/utils/auth.ts`

`auth` is the Better Auth instance. It has its own `mysql2` pool, separate from Sequelize.

| Setting | Why |
| --- | --- |
| `modelName: "auth_*"` | Keeps Better Auth's tables apart from our `user` table |
| `user.additionalFields.appUserId` | Links `auth_user` to `user`. `input: false`, so clients can't set it |
| `cookiePrefix: "lx"` | Cookies are named `lx.session_token` and so on |
| `session.cookieCache` (5 minutes) | Saves a database read per request. A revoked session can keep working for up to 5 minutes |
| `emailAndPassword.password` | bcrypt with cost 10, the same as the old auth, so existing hashes still verify |
| `minPasswordLength: 6` | Matches the old rule. The front end's `AuthProviderWrapper` uses the same value |
| `requireEmailVerification` | Users can't sign in until they've verified their email, see [Email verification](#email-verification) |
| `sendResetPassword` | Our SendGrid email, see [Emails](#emails) |
| `emailVerification` | Verification email settings, see [Email verification](#email-verification) |
| `databaseHooks.user.create` | Writes our `user` row during sign-up, see [Registration](registration.md) |
| `generateId` | Lets MySQL auto-increment `user.id`; Better Auth's own tables get Better Auth ids |
| `plugins: [appUserPlugin()]` | Describes `user` to Better Auth so the sign-up hook can write it |

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

The rest of `userRoutes` (details, feedback, consent and so on) is the same either way.

## Websockets: `src/websockets/server.ts`

Authentication is now `io.use` middleware, so a bad connection is refused before `connection` fires. With the flag on, it reads the cookie from the handshake and looks up the session the same way as the Hapi strategy. A missing session or `appUserId` gets `next(new Error("unauthorized"))`.

As before, nothing in here may throw: an uncaught error crash-loops the server.

## Emails

The auth emails are sent by functions in `src/emails/Email.ts`:

| Email | Function | Sent by | Link expires after |
| --- | --- | --- | --- |
| Password reset | `sendPasswordReset` | Better Auth | `RESET_PASSWORD_EXPIRY_SECONDS` (1 hour) |
| Email verification | `sendVerificationEmail` | Better Auth | `VERIFICATION_EMAIL_EXPIRY_SECONDS` (1 hour) |
| Successful registration | `sendRegisteredEmail` | `postEmailVerificationFlow`, once a new user verifies | Doesn't expire |

The reset and verification tokens are stored in `auth_verification`.

For how emails are built, previewed and sent, see [Emails](../back-end/emails.md).

## Email verification

With `requireEmailVerification: true`, an unverified user can't sign in. The `emailVerification` settings:

| Setting | Effect |
| --- | --- |
| `sendOnSignUp` | Sends the verification email at sign-up. Sign-up doesn't create a session |
| `sendOnSignIn` | Sends a fresh link when an unverified user tries to sign in |
| `autoSignInAfterVerification` | Clicking the link signs the user in, so they land in the app |
| `expiresIn` | 1 hour |
| `afterEmailVerification` | `postEmailVerificationFlow`, which sends the welcome email to new sign-ups |

The link goes to `/api/auth/verify-email`, which then redirects into the app. The full sign-up flow is in [Registration](registration.md).

The migration script creates existing users unverified, so they verify on their first sign-in: `sendOnSignIn` emails them a link, and `autoSignInAfterVerification` signs them in once they click it.

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

`src/services/authUser.test.ts` covers the registration hooks.
