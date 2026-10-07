import { render } from "react-email";
import {
  EmailHeading,
  Layout,
  Paragraph,
  PrimaryButton,
  SignOff,
} from "../components/Layout";
import { LOGO_PREVIEW_SRC } from "../components/logo";

export type RegisteredEmailProps = {
  name?: string;
  url: string;
  logoSrc?: string;
};

const RegisteredEmail = ({ name, url, logoSrc }: RegisteredEmailProps) => (
  <Layout
    preview="Thank you for registering with LandExplorer."
    logoSrc={logoSrc}
  >
    <EmailHeading>Welcome to LandExplorer</EmailHeading>
    <Paragraph>{name ? `Dear ${name},` : "Hi,"}</Paragraph>
    <Paragraph>
      Thank you for registering with LandExplorer. Your email address is verified and your
      account is ready to use.
    </Paragraph>
    <PrimaryButton href={url}>Open LandExplorer</PrimaryButton>
    <Paragraph>
      We're excited to see how you use this tool to find information on the land around you!
    </Paragraph>
    <SignOff />
  </Layout>
);

// This is for the dev server
RegisteredEmail.PreviewProps = {
  name: "Laura",
  url: "https://localhost:28080/app",
  logoSrc: LOGO_PREVIEW_SRC,
} satisfies RegisteredEmailProps;

export default RegisteredEmail;

export const renderRegisteredEmail = (props: RegisteredEmailProps) =>
  render(<RegisteredEmail {...props} />);
