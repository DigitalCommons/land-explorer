# Spike: should we use an auth vendor, an auth library, or roll our own?
https://github.com/DigitalCommons/land-explorer/issues/159

Our current auth is written in house. The backend issues a JWT that's valid for 365 days with no way to revoke a token, no sessions and no rate limiting/brute force protection. 

We're going to be extending auth to add email verification and it's a good time to review what we currently have and whether we want to continue writing/building on top of our own auth or use some third party tools/services.

This spike compares options for implementing auth going forwards. It looks at hosted third-party auth vendors, self hosted auth vendors, auth libraries and continuing to build and maintain our own auth.


## Feature overview for providers investigated
| Feature | Clerk | KeyCloak | SuperTokens | BetterAuth | Roll our own |
| ----  | --- | --- | --- | --- | --- |
| Self hosted |❌️|✅|✅|✅|✅|
| Free/Open source |❌️|✅|✅⚠️ Lots of features behind paywall |✅|✅⚠️ Maintenance costs|
| Email Verification |✅|✅|✅|✅|❌️|
| Migration of passwords |✅|✅⚠️ Not straightforward|✅|✅| N/A |
| Password reset |✅|✅|✅|✅|✅|
| Email Update |✅|✅|✅|✅|❌️ Exists but doesn't follow best practice|
| Password Update |✅|✅|✅|✅|❌️Exists but doesn't follow best practice|
| Prebuilt UI components |✅ |✅ |✅ |✅ with the BetterAuth UI package |❌️|
| Battle tested |✅|✅|✅|⚠️ 2 years old|❌️|
| Maintained |✅|✅|✅|✅|❌️|
| Simple Setup |✅|❌️|✅|✅|N/A|
| Machine to machine (future proof) |✅|✅|⚠️ paid only|✅|❌️|
| Permissions/roles (future proof) |✅|✅|✅|✅|❌️|
| Organisations (future proof) |✅|✅|⚠️ paid only|✅|❌️ |
| MFA (future proof) |✅|✅|⚠️ paid only|✅|❌️|
| Socials login (future proof) |✅|✅|✅|✅|❌️|


## Clerk

Clerk is a third party hosted auth service. It isn't free - pricing is based on Monthly Active Users: $20/month for up to 50,000 MAU, then $0.02 per user after that (https://clerk.com/pricing).


See this link for a view of the different components they provide: https://clerk.com/components/theme-editor

For a deeper look at how it works, see https://clerk.com/docs/guides/how-clerk-works/overview.

- Since it is hosted there is no infrastructure setup or maintenance for us.
- It ships prebuilt React UI components for sign in, sign up, account management etc. (https://clerk.com/docs/react/reference/components/overview), so in the common case we wouldn't need to write the auth UI or define the flows ourselves. 
- It's extensible for our future needs - supports 2FA, OAuth, API keys.
- It's very developer friendly with a straightforward setup via a dashboard.
- It sends all emails for us - templates can be configured in settings so we don't need another email provider.
- It has a migration tool to help migrate existing users - it accepts our existing password hashes, so no forced password reset would be needed.

#### Risks 
- User data (email, password, first name, last name) would no longer be stored on our own servers.
- Vendor lock-in risk: price rises or the vendor shutting down would be a risk.


## Keycloak
Keycloak is a third party self hosted auth service provider. 
- It's available as a Cloudron package so no new infrastructure would be needed to set this up, and Cloudron can handle backups/updates.
- It's free and open source and all our user data would stay within our own infrastructure. 
- It's extensible for our future needs - supports 2FA, OAuth (not API Keys).
- Keycloak doesn't ship embeddable React components but it does have its own hosted sign in and register components. It works by redirecting your app to Keycloak's own hosted login pages (which are themeable) using an OIDC client library. 

Keycloak seems quite complex and I think would be overkill for our use case. It is more for the situation where you have multiple applications/services that need to share the same login.

**Risks**
- Complicated setup - could take a lot of work to understand, setup and maintain.
- Migrating existing users looks like it is more complex as it doesn't support our current password hashing strategy out of the box.


## SuperTokens

SuperTokens is an open source auth solution. We can either self-host the core ourselves or use SuperTokens' managed cloud version of it. 
- Self hosting the core version is free with no MAU limit. 
- The managed cloud version is free for the first 5,000 MAU and $0.02/MAU after that (https://supertokens.com/pricing). 
- The core auth features we need (email/password, prebuilt sign in/up UI, email verification, password reset, session management) are included free either way. 
- Several features sit behind extra per-MAU pricing rather than the base plan such as MFA and machine-to-machine auth.
- Similarly to Clerk, it ships prebuilt React UI components for sign in/up, email verification, password reset etc.
- It supports migrating existing users, including custom password hashes.

**Risks**
- Less future proof - many features are gated behind a paywall e.g. MFA, machine to machine auth
- If self-hosting, we take on running and updating a separate service ourselves - more operational overhead than Clerk, and not packaged for easy provisioning the way Keycloak is via Cloudron
- If we choose the cloud option, user data (email, password, first name, last name) would no longer be stored on our own servers

## Better Auth

Better Auth is a TypeScript auth framework with a comprehensive feature set plus a plugin ecosystem for things like 2FA and SSO. It is installed as a library inside our app against our own database rather than routing auth through a third party.

- It's free and open source.
- All user data would stay in our existing database.- 
- No new infrastructure required as it is just a library installed into our app.
- It's extensible for our future needs - supports 2FA, OAuth, API Keys etc.
- There is a corresponding UI library https://better-auth-ui.com/ that gives us embeddable React components for Login, Register, User account management etc.
- It supports migrating existing users and you can set a custom password hash/verify function, so we can use bcrypt to verify our existing hashes rather than forcing everyone to reset their password. 

**Risks**
- Recently acquired by Vercel - unclear whether that changes the open-source model over time.
- No Sequelize adapter - would mean running Kysely alongside Sequelize for querying the auth tables. I don't think this is a massive issue though

## Lucia Auth
I looked at Lucia Auth (another Typescript auth library), but it's been deprecated in favour of Better Auth.

## Auth.js
This is another Typescript auth library. It has been acquired by Better Auth's team but is still maintained as a separate library. It has more limited functionality than Better Auth and would require much of the same integration work. Its one advantage is a Sequelize adapter, but I don't think this is enough of a pro to consider it over BetterAuth.

## Roll our own auth

Building on top of our existing auth would involve first reviewing what we have and fixing the known issues such as the non revokable 365 day JWT tokens.
As can be seen from the overview table above, there's a lot missing feature wise from our own auth. 
There's a fair amount of work just in adding email verification and any future extensions will be substantial work (like adding MFA for example). 

Security considerations we'd need to address first:
- Currently tokens are signed JWTs with no revocation mechanism and a 365 day expiry. A leaked or stolen token stays valid for up to a year with no way to invalidate it.
- There's currently no session store - auth is purely stateless JWT verification, so "log out everywhere" or forcing re-authentication isn't possible without us building a session/revocation layer from scratch.
- There's currently no rate limiting or lockout on login attempts anywhere in the backend. 

**Risks**
- Higher risk of security flaws than a widely used vendor or library.
- Scope balloons quickly once we want 2FA, OAuth, API keys or similar in future.
- We'd first need to fix the existing known issues with our auth before building on top of it.
- All UI/UX flows would need to be designed and built by ourselves



## Effort, cost, maintenance & security comparison

| | Clerk | Keycloak | SuperTokens | BetterAuth | Roll our own |
| --- | --- | --- | --- | --- | --- |
| Implementation effort | **Low** - hosted, prebuilt UI, migration tool accepts our existing bcrypt hashes | **High** - realms/OIDC clients/redirect flow to build, plus a custom password-hash provider needed to migrate our bcrypt hashes | **Low/Medium** - has a Hapi module and prebuilt UI, migration supports existing password hashes, but if self-hosting we also stand up and connect to the separate core service | **Medium** - library integration; no Sequelize adapter so Kysely runs alongside it for the auth tables | **High** - email verification, sessions plus all future API-auth work (keys, OAuth2, rate limiting) built from scratch |
| Ongoing maintenance | **Low** - fully hosted; the vendor patches and upgrades it. We'd still need to update the embedded React UI components ourselves. | **Low/Medium** - Cloudron handles backups and package updates for us. We would need to do package updates ourselves for the integration libraries. | **Low** if using the managed cloud (SuperTokens runs the core); **Medium** if self-hosting, since we'd own updates/uptime of the core service ourselves | **Low/Medium** - no separate service to run, but we absorb library upgrades ourselves | **High** - every future feature and every security fix is ours indefinitely |
| Security | **High** - vendor-managed, dedicated security team, widely used | **High** - mature project, but we own the operational security (config, patching) | **Good** - open source and SOC2 compliant, but MFA and other security-relevant add-ons sit behind paid pricing rather than the free tier | **Very Good** - actively maintained, but only ~2 years old so less battle-tested than Clerk/Keycloak | **Lowest** - no dedicated security review; current implementation already has known gaps (see below) |
| Cost | $20/mo up to 50k MAU, then $0.02/MAU (https://clerk.com/pricing) | Free/open source, but our hosting + engineering time to run it | Free core; M2M, orgs and MFA are paid-only | Free/open source | No licence cost, but highest ongoing engineering time cost |
| Flexibility for future needs | **High** - 2FA, OAuth, orgs, M2M, API keys all built in | **High** - 2FA, OAuth, orgs, M2M, permissions all built in, just more setup | **Medium** - MFA/orgs/M2M exist but require a paid plan | **High** - 2FA, OAuth, orgs, M2M, permissions all supported | **Low** - every item is new build work |


## Conclusions

From the above research, my recommendation would be to go with either BetterAuth or Clerk.

- Both satisfy all the requirements that this spike was scoped against - email verification plus enough extensibility for the API auth work coming later (API keys/OAuth2). 
- Both options hand the auth logic to a maintained project instead of us carrying that risk.
- Both options give us prebuilt React components for SignIn etc.

I would go with Clerk if we're happy to pay for a provider and for our user data (email, password, first name, last name) to live in a third party database. It's more user friendly - you get a dashboard to change settings rather than having to update them in code, it handles emails for us and the implementation cost would be lower as it is easier to setup.

However, if we want a free and open source option where all user data stays in our own database then BetterAuth is the better choice for us.

**Why not the others:**
- **Keycloak** - matches on features but its setup and ongoing operation is considerably more effort than either Clerk or Better Auth for a single app use case - it's built for bigger organisations sharing login across multiple services.
- **SuperTokens** - a lot of features are behind a paywall and if we self hosted, this would be more setup and maintenance effort.
- **Rolling our own** - this is both the highest effort and highest risk path. We'd need to fix existing security gaps before starting on email verification, then build every future feature ourselves with no dedicated security review behind it.

---
### Work involved in switching to any third party provider
---

This is the work that's common to Clerk and BetterAuth followed by what's different for each. It may not be a comprehensive list but is worth documenting what I've found/thought about whilst doing this spike.

#### Common to both providers

- Strip out the existing auth code in both the frontend and backend.
- Install/configure the chosen provider.
- Update the backend auth strategy for both HTTP and WebSocket connections to validate the provider's tokens instead of our own JWTs.
- Potentially rework registration:
  - Our registration form collects more than any provider's prebuilt sign-up UI supports (organisation details, subscription plan etc), so we may want to consifer moving those fields to a "getting to know you" step shown after first login instead of at sign-up.
  - Registration currently does more than create a user - it migrates guest user maps, tracks analytics, and signs the user up to a marketing newsletter. These side effects need to be re-triggered from wherever the new provider creates a user (a webhook, or our own endpoint calling the provider's API - see per-provider notes).
- Link our existing user-keyed tables to the new provider's identity rather than migrating them: add a new ID column (e.g. `clerkUserId`/`authUserId` etc.) to our own user table so `UserMap`, `UserFeedback` and `UserGroupMembership` can keep working off our existing `user_id`.
- Migrate existing users and their password hashes (method differs per provider).
- Replace the sign in flows with the embeddable React UI components. Both also have Account management components, which would simplify the planned redesign of the account settings page.
- Update tests.

#### Clerk

- Use Clerk's `user.created` webhook to set `clerkUserId` on our user table and to trigger the registration side effects above.
- Configure Clerk itself: separate dev/prod instances, and settings such as 2FA, email code vs. email link verification, session lifetime, etc.

#### BetterAuth

- Install Kysely for querying the auth tables (there is no Sequelize adaptor)

