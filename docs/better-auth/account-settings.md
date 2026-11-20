# Account settings

How users change their name, email, password, privacy and organisation details when Better Auth is enabled. For the rest of the Better Auth work, see the [overview](overview.md).

## Keeping `user` in step

The name and email are stored twice: in `auth_user` for Better Auth, and in `user` for the rest of the app (see the [overview](overview.md#tech-debt-duplicated-user-details)). Two hooks in `src/services/authUser.ts` keep them the same. Both run from `databaseHooks.user.update.before` through `preUserUpdateFlow`, inside Better Auth's update, so if writing `user` fails, `auth_user` isn't changed either.

| Hook | Runs on | Writes to `user` |
| --- | --- | --- |
| `preNameChangeFlow` | `/update-user` with a `name` | `first_name`, `last_name` |
| `preEmailChangeFlow` | `/email-otp/change-email` with an `email` | `username` |

Both find the `user` row from the session's `appUserId`, and do nothing without one.

## Name

The profile has a single name field, Better Auth's `auth_user.name`. `preNameChangeFlow` splits it with `splitName`: the first word is the first name and the rest is the last name, so "Betty Bo Blueberry" is saved as "Betty" / "Bo Blueberry".

`user.first_name` and `user.last_name` are both required, so a name needs at least two words. The profile form checks this, and `preNameChangeFlow` checks it again in case the form is skipped, rejecting a single or blank name with `INVALID_NAME`.

The avatar is saved by Better Auth UI to `auth_user.image` as a resized data URL. It isn't copied to `user`.

## Email

Users change their email with a code sent to the new address, using the `emailOTP` plugin's `changeEmail` option. Better Auth's own link-based `/change-email` is left off.

```
ChangeEmailOtp
├─ 1. new email      checked on the front end, must differ from the current one
├─ 2. password       POST /api/auth/email-otp/request-email-change { newEmail, password }
│                    └─ confirmPasswordForEmailChange (hooks.before)
│                         ├─ checks the password    → INVALID_PASSWORD
│                         └─ checks the new email   → INVALID_NEW_EMAIL
│                    └─ sendVerificationOTP emails a code to the new address
└─ 3. code           POST /api/auth/email-otp/change-email { newEmail, otp }
                     └─ preEmailChangeFlow (user.update.before)
                          ├─ checks the new email again → INVALID_NEW_EMAIL
                          └─ sets user.username
```

- **The password check** isn't something the plugin offers, so `confirmPasswordForEmailChange` adds it as a `hooks.before` middleware. Without it, anyone using a signed-in device could take over the account. The front end sends the password through `fetchOptions.body`, because Better Auth's types don't include it.
- **The password is checked before the email**, so only the account owner can find out whether another account uses an address.
- **The new email is checked twice**, in case another account takes it between the code being sent and entered. `assertValidNewEmail` uses `Validation.validateChangeEmail`: a valid email, at most 100 characters, and not already a `user.username`.
- **Errors** go back to the step they belong to: `INVALID_NEW_EMAIL` to the email step, anything else to the current step.
- **After the change**, `auth_user.emailVerified` is true, as the user has entered a code sent to the address. `postEmailVerificationFlow` skips the welcome email for this endpoint.

Not changed by an email change: the Buttondown newsletter subscription, and maps shared with the new address before it was theirs (`pending_user_map` is only read at registration).

## Password

`ChangePassword` calls Better Auth's `/change-password` with `revokeOtherSessions: true`, so other devices are signed out. They can keep working until their session cookie cache expires (up to 5 minutes).

The form also rejects a new password that's the same as the current one, which Better Auth would accept. A wrong current password (`INVALID_PASSWORD`) shows in the form and clears that field.

`user.password` isn't updated, because Better Auth signs people in with `auth_account.password`. This is why the [migration script](migrating-users.md) mustn't be run after switching over.

Users who have forgotten their password use forgot password instead. Better Auth's `revokeSessionsOnPasswordReset` signs them out everywhere after a reset.

## Privacy

`Privacy` shows a switch for analytics consent that saves as soon as it's changed, through `setAnalyticsConsent` in `actions/UserActions.ts` (the same action as the consent banner on the map). That posts to `/api/user/analytics-consent`, which sets `user.analytics_consent_granted_at` or `analytics_consent_revoked_at`, then opts Mixpanel in or out. If saving fails, the switch goes back to the saved setting.

## Organisation details

`OrganisationDetails` posts to `POST /api/userOrganisation/details` (`routes/userOrganisation.ts`, `services/userOrganisation.ts`), which updates the logged-in user's row in `user`:

| Payload | Column | Max length |
| --- | --- | --- |
| `organisation` | `organisation` | 100 |
| `organisationNumber` | `organisation_number` | 100 |
| `organisationType` | `organisation_type` | 100 |
| `organisationActivity` | `organisation_activity` | 100 |
| `address1`, `address2`, `city` | same names | 100 |
| `postcode` | `postcode` | 10 |

Every field is required in the payload but may be empty, and unknown fields are rejected. A failed check returns 400 with `{ message }`. On success, the front end dispatches `USER_ORGANISATION_DETAILS_UPDATED` to update the store.

When type or activity is "Other", the typed text is saved in place of `other`. A saved value that isn't in the form's lists is shown as "Other" with the value in the text box.

**Known issue:** the registration form and this form have different lists of organisation types and activities, so values saved at registration show as "Other". They need reconciling.

## Tests

- `src/services/authUser.test.ts`: `splitName`, `preNameChangeFlow`, `confirmPasswordForEmailChange`, `preEmailChangeFlow` and `preUserUpdateFlow`
- `src/routes/userOrganisation.test.ts`: the organisation details endpoint
- `src/routes/user.test.ts`: analytics consent
