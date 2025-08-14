import * as React from "react";
import { createClerkClient } from "@clerk/backend";
import { Liquid } from "liquidjs";
import { z } from "zod";
import { render as renderComponent, Text } from "@react-email/components";

import DefaultEmail from "./components/default";
import SuspendedTemplate from "./templates/suspended";
import CompliantTemplate from "./templates/compliant";
import BannedTemplate from "./templates/banned";
import { DefaultTemplateContent, RenderedTemplate } from "./types";
import { findOrCreateOrganization } from "@/services/organizations";
import { AppealButton } from "./components/appeal-button";
import * as schema from "@/db/schema";

const clerkSecret = process.env.CLERK_SECRET_KEY;
if (!clerkSecret) {
  throw new Error("Missing environment variable: CLERK_SECRET_KEY");
}
const clerk = createClerkClient({ secretKey: clerkSecret });

type EmailTemplateType = (typeof schema.emailTemplateType.enumValues)[number];

export function parseContent(content: any | undefined, type: EmailTemplateType) {
  const defaultContent = templates[type].defaultContent;
  const contentSchema = z
    .object({
      subject: z.string().default(defaultContent.subject),
      heading: z.string().default(defaultContent.heading),
      body: z.string().default(defaultContent.body),
    })
    .default({});

  return contentSchema.parse(content);
}

export function validateContent(content: DefaultTemplateContent) {
  for (const [_, value] of Object.entries(content)) {
    liquid.parse(value);
  }
}

const liquid = new Liquid();

async function replacePlaceholders(content: DefaultTemplateContent, placeholders: Record<string, any>) {
  let processedContent: any = {};
  for (const [key, value] of Object.entries(content)) {
    let rendered = await liquid.parseAndRender(value, placeholders);
    // trim trailing whitespace
    rendered = rendered.trim();
    // replace newlines with double newlines
    rendered = rendered.replace(/[\r\n]+/g, "\n\n");
    processedContent[key] = rendered;
  }
  return processedContent as DefaultTemplateContent;
}

const templates = {
  ["Suspended"]: SuspendedTemplate,
  ["Compliant"]: CompliantTemplate,
  ["Banned"]: BannedTemplate,
} as const;

export async function render<T extends EmailTemplateType>({
  clerkOrganizationId,
  content,
  type,
  appealUrl,
}: {
  clerkOrganizationId: string;
  content: DefaultTemplateContent;
  type: T;
  appealUrl?: string;
}): Promise<RenderedTemplate> {
  const settings = await findOrCreateOrganization(clerkOrganizationId);

  const { name: clerkOrganizationName, imageUrl: clerkOrganizationImageUrl } =
    await clerk.organizations.getOrganization({ organizationId: clerkOrganizationId });

  const { subject, heading, body } = await replacePlaceholders(content, {
    ORGANIZATION_NAME: clerkOrganizationName,
    ORGANIZATION_IMAGE_URL: clerkOrganizationImageUrl,
  });

  const paragraphs = body.split("\n\n");

  const email = (
    <DefaultEmail
      organizationName={clerkOrganizationName}
      organizationImageUrl={clerkOrganizationImageUrl}
      subject={subject}
      heading={heading}
    >
      {paragraphs.map((p, i) => (
        <Text key={i}>{p}</Text>
      ))}
      {settings.appealsEnabled && type === "Suspended" && appealUrl && (
        <AppealButton appealUrl={appealUrl}>Appeal</AppealButton>
      )}
    </DefaultEmail>
  );

  const html = await renderComponent(email);

  return {
    html,
    subject,
    heading,
    body,
  };
}
