# Registration with Better Auth

How a user registers when Better Auth is enabled and how our `user` table stays in step with Better Auth's tables.

## The two user tables

- `auth_user`, `auth_account`, `auth_session` and `auth_verification` belong to Better Auth: name, email, password and sessions.
- `user` is our app user: the rest of the registration form, used by the rest of the back end.

`auth_user.appUserId` links them (a foreign key to `user.id`). The Hapi `session` auth strategy in `src/server.ts` reads it as `user_id`, so every authenticated route needs it.

## Request flow

`RegisterFormNew.tsx` posts to `/api/auth/sign-up/email` with Better Auth's `name`, `email` and `password` plus our extra fields. Better Auth ignores the extra fields, but our hooks can read them from `ctx.body`.

```
POST /api/auth/sign-up/email
└─ Better Auth transaction
   ├─ preRegistrationFlow (user.create.before)
   │    ├─ validate the form
   │    └─ insert `user`
   ├─ insert auth_user, with appUserId
   ├─ insert auth_account
   └─ insert auth_session, set the cookie
── commit ──
postRegistrationFlow (user.create.after)
   ├─ sign up to marketing
   ├─ move maps shared before registering
   └─ track User_Register
```

Both hooks are in `src/services/authUser.ts` and only act on `/sign-up/email`.

## Why `user` is written through Better Auth

Writing `user` inside Better Auth's transaction makes registration all-or-nothing: if any insert fails, nothing is left behind. A leftover `user` row would stop the email registering again.

Sequelize can't join that transaction, so the hook uses Better Auth's adapter:

```ts
const adapter = await getCurrentAdapter(ctx.context.adapter);
const appUser = await adapter.create({ model: APP_USER_MODEL, data: toUserRow(registration) });
```

This needs:

- **`appUserPlugin.ts`**, which describes `user` to Better Auth as the `appUser` model ([plugin schema docs](https://better-auth.com/docs/concepts/plugins#schema)). `disableMigration: true` leaves the table to our Sequelize migrations.
- **`generateId`** in `auth.ts`, which returns `false` for `appUser` so MySQL's auto-increment sets `user.id`.
- **A unique `username`**, so the adapter can find the inserted row (MySQL has no `INSERT ... RETURNING`).

## Errors

| What fails | User sees | Database |
| --- | --- | --- |
| Validation or email already registered | Errors under each field | Nothing written |
| Any insert in the transaction | Generic error toast | Rolled back |
| A step in `postRegistrationFlow` | Nothing, registration succeeds | Error logged |

`postRegistrationFlow` must not throw: it runs after commit, so an error would turn a successful registration into a 500.

## Making changes

- **New required `user` column** with no default: add it to `toUserRow`, `appUserPlugin.ts` and the Sequelize `User` model.
- **New registration field**: send it from the front-end, validate it in `validateUserRegister` and map it in `toUserRow` and `appUserPlugin.ts`.
- **New post-registration step**: add it inside the `try` in `postRegistrationFlow`.
