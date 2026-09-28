import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Button,
  Container,  
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import { LOGO_CID_SRC } from "./logo";

export const BRAND_GREEN = "#27ae60";

const fontFamily = "Lato, sans-serif";

export type LayoutProps = {  
  preview: string; // Inbox preview text shown after the subject line
  children: ReactNode;  
  logoSrc?: string; // Override only for the preview server - sent emails use the inline cid: attachment
};

/** Shared LandExplorer email shell: logo, white card and footer */
export const Layout = ({ preview, children, logoSrc = LOGO_CID_SRC }: LayoutProps) => (
  <Html lang="en">   
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={card}>
        <Section style={{ padding: "32px 32px 8px", textAlign: "center" }}>
          <Img
            src={logoSrc}
            width="220"
            height="40"
            alt="LandExplorer"
            style={{ margin: "0 auto" }}
          />
        </Section>
        <Section style={{ padding: "16px 32px 32px" }}>
          {children}
        </Section>
      </Container>
      <Container style={{ maxWidth: "560px" }}>
        <Text style={footer}>
          LandExplorer by{" "}
          <Link href="https://www.digitalcommons.coop" style={{ color: "#888888", textDecoration: "underline" }}>
            Digital Commons
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const EmailHeading = ({ children }: { children: ReactNode }) => (
  <Text style={heading}>{children}</Text>
);

export const Paragraph = ({ children, muted: muted }: { children: ReactNode; muted?: boolean }) => (
  <Text style={muted ? greyText : text}>{children}</Text>
);

export const PrimaryButton = ({ href, children }: { href: string; children: ReactNode }) => (
  <Section style={{ padding: "6px 0 24px", textAlign: "center" }}>
    <Button href={href} style={button}>
      {children}
    </Button>
  </Section>
);

export const SignOff = () => (
  <Text style={{ ...text, margin: 0 }}>
    Many thanks,
    <br />
    The Digital Commons Team
  </Text>
);

const body: CSSProperties = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: "#f4f6f5",
  fontFamily,
};

const card: CSSProperties = {
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  borderTop: `4px solid ${BRAND_GREEN}`,
};

const heading: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "22px",
  lineHeight: "30px",
  fontWeight: "bold",
  color: "#222222",
};

const text: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "14px",
  lineHeight: "24px",
  color: "#333333",
};

const greyText: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "14px",
  lineHeight: "22px",
  color: "#555555",
};

const button: CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  backgroundColor: BRAND_GREEN,
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
};

const footer: CSSProperties = {
  margin: 0,
  padding: "16px 32px",
  textAlign: "center",
  fontSize: "12px",
  lineHeight: "18px",
  color: "#888888",
};
