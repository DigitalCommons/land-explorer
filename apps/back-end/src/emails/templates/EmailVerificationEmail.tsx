import { render } from "react-email";
import {
  CodeBox,
  EmailHeading,
  Layout,
  Paragraph,
  SignOff,
} from "../components/Layout";
import { LOGO_PREVIEW_SRC } from "../components/logo";
import { formatExpiry } from "../helper";

export type VerificationEmailProps = {
  email: string;
  code: string;
  expiryMinutes: number;
  logoSrc?: string;
};

// The user types the code on the verify page they were sent to after signing up or in
// or in My Account when changing their email to this address
const VerificationEmailEmail = ({ email, code, expiryMinutes, logoSrc }: VerificationEmailProps) => {
  const expiry = formatExpiry(expiryMinutes);

  return (
    <Layout
      preview={`Your code to verify your LandExplorer email address. It expires in ${expiry}.`}
      logoSrc={logoSrc}
    >
      <EmailHeading>Verify email address</EmailHeading>
      <Paragraph>Hi,</Paragraph>
      <Paragraph>
        {`Enter this code in LandExplorer to verify your email address ${email}:`}
      </Paragraph>
      <CodeBox code={code} />
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

// This is for the dev server
VerificationEmailEmail.PreviewProps = {
  email: "laura@email.com",
  code: "123456",
  expiryMinutes: 15,
  logoSrc: LOGO_PREVIEW_SRC,
} satisfies VerificationEmailProps;

export default VerificationEmailEmail;

export const renderVerificationEmail = (props: VerificationEmailProps) =>
  render(<VerificationEmailEmail {...props} />);
