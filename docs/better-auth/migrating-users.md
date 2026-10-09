# Migrating users to Better Auth

Existing users are in our `user` table. To sign in with Better Auth they need an `auth_user` and an `auth_account` row. `src/scripts/migrateUsersToAuth.ts` creates them.

## What the script does

For each `user` row, it finds the `auth_user` linked by `appUserId` and:

| Situation | What happens |
| --- | --- |
| No `auth_user` | Creates `auth_user` and a `credential` `auth_account` |
| Email or name differ | Updates `auth_user` |
| No `credential` account | Creates one |
| Password hash differs | Copies `user.password` over `auth_account.password` |
| Email already belongs to another `auth_user` | Skips the user and reports a conflict |

- The email is `user.username`, trimmed and lowercased, because Better Auth lowercases emails at sign-in.
- The name is `first_name last_name`.
- `emailVerified` is `false`, so existing users verify their email the first time they sign in. Their sign-in is refused, and they're emailed a link that signs them in. Only users already in `auth_user` keep their current value.
- `user.created_date` becomes `createdAt`. That also stops migrated users getting the welcome email when they verify, because it only goes to users created in the last 7 days.
- Password hashes are copied as they are. Both auths use bcrypt, so nobody has to reset their password.

Everything runs in one transaction. If anything fails, nothing is saved. Running it again is safe.

## Running it

Build first, then run from `apps/back-end` with the usual database env vars:

```sh
npm run build
node lib/scripts/migrateUsersToAuth.js --dry-run   # rolls back, just reports
node lib/scripts/migrateUsersToAuth.js
```

The output counts `created`, `details updated`, `passwords updated`, `accounts created`, `unchanged` and `conflicts`, and lists each conflict.

## Switching over

Until the flag is on, `user` is the source of truth. Afterwards, `auth_account` is. That decides when to run the script:

1. Deploy with both flags off. `be-migrate` creates the `auth_*` tables.
2. Run with `--dry-run` and sort out any conflicts.
3. Run it for real.
4. Turn on `FEATURE_USE_BETTERAUTH` and `VITE_FEATURE_USE_BETTERAUTH`, and redeploy. The front end needs a rebuild.
5. Run it once more, to catch registrations and password changes made between steps 3 and 4.
6. Don't run it again. Once Better Auth owns passwords, `user.password` goes stale, and the script would overwrite newer passwords with old ones.

Before step 4, check the back end has `FEATURE_USE_BETTERAUTH`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (see the [overview](overview.md#environment-variables)).

Everyone is signed out at the switch: old JWTs aren't accepted any more. Then, because migrated users are unverified, each user's first sign-in sends them a verification email instead of signing them in. Make sure SendGrid is working before switching over.

## Conflicts

A conflict means two `user` rows end up with the same email, usually because they differ only in case or whitespace. Decide which account to keep and fix the other in `user`, then run the script again.
