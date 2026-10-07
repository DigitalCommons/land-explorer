import { Link, render } from "react-email";
import {
  BRAND_GREEN,
  EmailHeading,
  Layout,
  Paragraph,
  PrimaryButton,
  SignOff,
} from "../components/Layout";
import { LOGO_PREVIEW_SRC } from "../components/logo";
import { formatExpiry } from "../helper";

export type VerificationEmailProps = {
  name?: string;
  email: string;
  url: string;
  expiryMinutes: number;
  logoSrc?: string;
};

const VerificationEmailEmail = ({ name, email, url, expiryMinutes, logoSrc }: VerificationEmailProps) => {
  const expiry = formatExpiry(expiryMinutes);

  return (
    <Layout
      preview={`Verify email address for LandExplorer. This link expires in ${expiry}.`}
      logoSrc={logoSrc}
    >
      <EmailHeading>Verify email address</EmailHeading>
      <Paragraph>{name ? `Dear ${name},` : "Hi,"}</Paragraph>
      <Paragraph>
        {`Click the button below to verify your email address ${email} for your LandExplorer account.`}
      </Paragraph>
      <PrimaryButton href={url}>Verify Email address</PrimaryButton>
      <Paragraph muted>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <Link href={url} style={{ color: BRAND_GREEN, wordBreak: "break-all" }}>
          {url}
        </Link>
      </Paragraph>
      <Paragraph muted>
        {`This link expires in ${formatExpiry(expiryMinutes)}.`}
      </Paragraph>
      <Paragraph muted>
        If you didn't request this email, you can safely ignore it. Someone else might have typed your email address by mistake.
      </Paragraph>
      <SignOff />
    </Layout>
  );
};

// This is for the dev server
VerificationEmailEmail.PreviewProps = {
  name: "Laura",
  email: "laura@email.com",
  url: "https://localhost:28080/auth/verify-email?token=abc123",
  expiryMinutes: 60,
  logoSrc: LOGO_PREVIEW_SRC,
} satisfies VerificationEmailProps;

export default VerificationEmailEmail;

export const renderVerificationEmail = (props: VerificationEmailProps) =>
  render(<VerificationEmailEmail {...props} />);
