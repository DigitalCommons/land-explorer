import type { CSSProperties } from "react";
import { render, Section, Text } from "react-email";
import {
  BRAND_GREEN,
  EmailHeading,
  Layout,
  Paragraph,
  SignOff,
} from "../components/Layout";
import { LOGO_PREVIEW_SRC } from "../components/logo";
import { formatExpiry } from "../helper";

export type VerificationEmailProps = {
  name?: string;
  email: string;
  code: string;
  expiryMinutes: number;
  logoSrc?: string;
};

// The user types the code on the verify page they were sent to after signing up or in
const VerificationEmailEmail = ({ name, email, code, expiryMinutes, logoSrc }: VerificationEmailProps) => {
  const expiry = formatExpiry(expiryMinutes);

  return (
    <Layout
      preview={`Your code to verify your LandExplorer email address. It expires in ${expiry}.`}
      logoSrc={logoSrc}
    >
      <EmailHeading>Verify email address</EmailHeading>
      <Paragraph>{name ? `Dear ${name},` : "Hi,"}</Paragraph>
      <Paragraph>
        {`Enter this code in LandExplorer to verify your email address ${email}:`}
      </Paragraph>
      <Section style={codeBox}>
        <Text style={codeText}>{code}</Text>
      </Section>
      <Paragraph muted>
        {`This code expires in ${expiry}.`}
      </Paragraph>
      <Paragraph muted>
        If you didn't request this email, you can safely ignore it. Someone else might have typed your email address by mistake.
      </Paragraph>
      <SignOff />
    </Layout>
  );
};

const codeBox: CSSProperties = {
  margin: "6px 0 24px",
  padding: "12px 0",
  backgroundColor: "#f4f6f5",
  borderRadius: "6px",
  textAlign: "center",
};

const codeText: CSSProperties = {
  margin: 0,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: "bold",
  letterSpacing: "8px",
  color: BRAND_GREEN,
};

// This is for the dev server
VerificationEmailEmail.PreviewProps = {
  name: "Laura",
  email: "laura@email.com",
  code: "123456",
  expiryMinutes: 15,
  logoSrc: LOGO_PREVIEW_SRC,
} satisfies VerificationEmailProps;

export default VerificationEmailEmail;

export const renderVerificationEmail = (props: VerificationEmailProps) =>
  render(<VerificationEmailEmail {...props} />);
