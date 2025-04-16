import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Img,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface TemplateProps {
  organizationImageUrl: string;
  organizationName: string;
  subject: string;
  heading: string;
}

const globalStyles = `
  body, html {
    margin: 0;
    padding: 0;
    background-color: #fff;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
    padding: 30px 20px;
    line-height: 1.2;
  }

  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
    max-width: 100%;
  }

  * {
    box-sizing: border-box;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    padding: 0;
    font-weight: bold;
  }

  .email-heading {
    margin-bottom: 20px;
    text-align: center;
  }

  .email-content  {
    padding-bottom: 20px;
    border: 1px solid rgb(0,0,0, 0.1);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .email-content p {
    font-size: 16px !important;
    margin-top: 0px !important;
    margin-bottom: 16px !important;
  }

  .email-footer {
    text-align: center;
  }

  .email-footer-text {
    margin: 8px 0;
    color: #999;
  }

  .email-footer-text p {
    margin: 0px !important;
  }

  .email-footer-text a {
    color: inherit !important;
    text-decoration: underline !important;
  }

  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 20px;
  }

  h3 {
    font-size: 18px;
  }

  hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 16px 0;
  }
      @media (prefers-color-scheme: dark) {
    body, html {
      background-color: rgb(39 39 42);
      color: rgba(255, 255, 255, 0.8);
    }

    .email-content {
      border-color: rgb(63 63 70);
    }
  }
`;

export const DefaultEmail = ({
  organizationImageUrl: organizationImageUrl,
  organizationName: organizationName,
  heading,
  subject,
  children,
}: TemplateProps & { children: React.ReactNode }) => {
  return (
    <Html>
      <Head>
        <title>{subject}</title>
        <style>{globalStyles}</style>
      </Head>
      <Preview>{heading}</Preview>
      <Body>
        <Container>
          <Heading className="email-heading">{heading}</Heading>
          <Section className="email-content">{children}</Section>
          <Section className="email-footer">
            <Row>
              <Column align="center">
                <Img alt="Instagram" height="36" src={organizationImageUrl} width="36" />
              </Column>
            </Row>
            <Row className="email-footer-text">
              <Column align="center">
                <Text>from {organizationName}</Text>
                <Text>
                  powered by <Link href="https://iffy.com">iffy.com</Link>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DefaultEmail;
