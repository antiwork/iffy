import * as React from "react";
import { Liquid } from "liquidjs";
import { z } from "zod";
import { render as renderComponent, Text } from "@react-email/components";

import DefaultEmail from "./components/default";
import SuspendedTemplate from "./templates/suspended";
import CompliantTemplate from "./templates/compliant";
import BannedTemplate from "./templates/banned";
import InvitationTemplate from "./templates/invitation";
import MagicLinkTemplate from "./templates/magiclink";
import { DefaultTemplateContent, RenderedTemplate } from "./types";
import { findOrCreateOrganization } from "@/services/organizations";
import { AppealButton } from "./components/appeal-button";
import * as schema from "@/db/schema";
import { getOrganizationMetadata } from "@/services/auth";

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
  ["Invitation"]: InvitationTemplate,
  ["MagicLink"]: MagicLinkTemplate,
} as const;

export async function render<T extends EmailTemplateType>({
  organizationId,
  content,
  type,
  appealUrl,
}: {
  organizationId: string;
  content: DefaultTemplateContent;
  type: T;
  appealUrl?: string;
}): Promise<RenderedTemplate> {
  const settings = await findOrCreateOrganization({ id: organizationId });

  const { organizationName, organizationLogo: organizationImageUrl } = await getOrganizationMetadata(organizationId);

  const { subject, heading, body } = await replacePlaceholders(content, {
    organizationName,
    organizationImageUrl,
  });

  const paragraphs = body.split("\n\n");

  const email = (
    <DefaultEmail
      organizationName={organizationName}
      organizationImageUrl={organizationImageUrl}
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
