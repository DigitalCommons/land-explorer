import { Link, render } from "react-email";
import {
  BRAND_GREEN,
  EmailHeading,
  Layout,
  Paragraph,
  PrimaryButton,
  SignOff,
} from "./components/Layout";
import { LOGO_PREVIEW_SRC } from "./components/logo";

export type ResetPasswordEmailProps = {
  name?: string;
  url: string;
  expiryMinutes: number;
  logoSrc?: string;
};

const formatExpiry = (minutes: number) =>
  minutes % 60 === 0
    ? `${minutes / 60} hour${minutes === 60 ? "" : "s"}`
    : `${minutes} minutes`;

const ResetPasswordEmail = ({ name, url, expiryMinutes, logoSrc }: ResetPasswordEmailProps) => {
  const expiry = formatExpiry(expiryMinutes);

  return (
    <Layout
      preview={`Reset your LandExplorer password. This link expires in ${expiry}.`}
      logoSrc={logoSrc}
    >
      <EmailHeading>Reset your password</EmailHeading>
      <Paragraph>{name ? `Dear ${name},` : "Hi,"}</Paragraph>
      <Paragraph>
        We received a request to reset your LandExplorer password. Click the button below to
        choose a new one.
      </Paragraph>
      <PrimaryButton href={url}>Reset password</PrimaryButton>
      <Paragraph muted>
        This link will expire in {expiry}. After that, you'll need to request a new password reset.
      </Paragraph>
      <Paragraph muted>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <Link href={url} style={{ color: BRAND_GREEN, wordBreak: "break-all" }}>
          {url}
        </Link>
      </Paragraph>
      <Paragraph muted>
        If you didn't request a password reset, you can safely ignore this email - your password
        won't change.
      </Paragraph>
      <SignOff />
    </Layout>
  );
};

// This is for the dev server
ResetPasswordEmail.PreviewProps = {
  name: "Laura",
  url: "https://localhost:28080/auth/reset-password?token=abc123",
  expiryMinutes: 60,
  logoSrc: LOGO_PREVIEW_SRC,
} satisfies ResetPasswordEmailProps;

export default ResetPasswordEmail;

export const renderResetPasswordEmail = (props: ResetPasswordEmailProps) =>
  render(<ResetPasswordEmail {...props} />);
