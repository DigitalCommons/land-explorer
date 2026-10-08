# Emails

Going forward, every email the back end sends should be a [React Email](https://react.email) template in `apps/back-end/src/emails/`, sent through SendGrid by `Email.ts`. Templates are React components, so emails share one layout and look consistent, and we can preview them in a browser before sending.

The older emails in `src/queries/mails.ts` build HTML from strings: map sharing, plus the registration success and password reset emails the legacy auth routes still send. Don't add new emails there. When one of them needs changing, move it to a React Email template instead.

## Layout

```
src/emails/
├─ Email.ts              send functions, one per email
├─ helper.ts             shared helpers, e.g. formatExpiry ("1 hour", "30 minutes")
├─ templates/            one component per email, e.g. ResetPasswordEmail.tsx
├─ components/
│  ├─ Layout.tsx         shared layout and building blocks
│  └─ logo.ts            the logo, attached inline
└─ static/logo.png
```

`components/Layout.tsx` provides:

- `Layout`: the logo, white card, green top border and Digital Commons footer. `preview` is the text inboxes show after the subject line.
- `EmailHeading`, `Paragraph` (`muted` for grey text), `PrimaryButton` and `SignOff`.
- `BRAND_GREEN`.

Use these rather than styling each email, so every email stays on brand.

## Adding an email

1. **Write the template** in `templates/`, e.g. `templates/WelcomeEmail.tsx`, using `ResetPasswordEmail.tsx` as a model:

   ```tsx
   export type WelcomeEmailProps = { name: string; logoSrc?: string };

   const WelcomeEmail = ({ name, logoSrc }: WelcomeEmailProps) => (
     <Layout preview="Welcome to LandExplorer" logoSrc={logoSrc}>
       <EmailHeading>Welcome</EmailHeading>
       <Paragraph>Dear {name},</Paragraph>
       <SignOff />
     </Layout>
   );

   // sample data for the preview server
   WelcomeEmail.PreviewProps = {
     name: "Laura",
     logoSrc: LOGO_PREVIEW_SRC,
   } satisfies WelcomeEmailProps;

   export default WelcomeEmail;

   export const renderWelcomeEmail = (props: WelcomeEmailProps) =>
     render(<WelcomeEmail {...props} />);
   ```

   The default export and `PreviewProps` are for the preview server. The `render…` function is what `Email.ts` calls.

2. **Add a send function** to `Email.ts` that renders the template and calls `sgMail.send` with `attachments: [logoAttachment()]`.

3. **Preview it** (see below).

## Previewing

```sh
cd apps/back-end
npm run email:dev
```

This starts the React Email preview server on http://localhost:3030 and lists every template in `src/emails/templates`, rendered with its `PreviewProps`. It reloads as you edit.

## The logo

Sent emails attach `static/logo.png` and point at it with `cid:` (`logoAttachment()` and `LOGO_CID_SRC` in `components/logo.ts`). Most email clients block remote images, and Gmail and Outlook don't render SVG, so the logo is a PNG sent with the email.

The preview server can't show `cid:` images, so templates take a `logoSrc` prop. `PreviewProps` sets it to `LOGO_PREVIEW_SRC`, and sent emails leave it unset.

## Sending

- **Catch every error.** A rejected SendGrid promise that nothing handles stops the server (`server.ts` exits on `unhandledRejection`). Catch and log instead.
- **Don't make responses depend on whether an email was sent.** `sendPasswordReset` and `sendVerificationEmail` don't await SendGrid, because Better Auth waits for it, and a slower response for registered emails would tell an attacker which emails have accounts. Do the same for any email sent in response to an unauthenticated request.
- **Sender:** `LandExplorer <landexplorer@digitalcommons.coop>`. `SENDGRID_API_KEY` must be set, or nothing is sent.

## Current emails

| Email | Template | Sent by |
| --- | --- | --- |
| Password reset | `templates/ResetPasswordEmail.tsx` | `sendPasswordReset`, called by Better Auth (`sendResetPassword` in `utils/auth.ts`). Links expire after `RESET_PASSWORD_EXPIRY_SECONDS` (1 hour) |
| Email verification | `templates/EmailVerificationEmail.tsx` | `sendVerificationEmail`, called by Better Auth (`emailVerification.sendVerificationEmail` in `utils/auth.ts`) at sign-up and when an unverified user signs in. Links expire after `VERIFICATION_EMAIL_EXPIRY_SECONDS` (1 hour) |
| Successful registration | `templates/RegisteredEmail.tsx` | `sendRegisteredEmail`, called by `postEmailVerificationFlow` in `services/authUser.ts` once a new user verifies. Links to `${BETTER_AUTH_URL}/app` |
