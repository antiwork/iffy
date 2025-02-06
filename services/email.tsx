import db from "@/db";
import * as schema from "@/db/schema";
import { findOrCreateOrganizationSettings } from "./organization-settings";
import { Resend } from "resend";
import { parseContent, render } from "@/emails/render";
import { env } from "@/lib/env";

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

interface EmailRenderOptions {
  react: React.ReactNode;
  html: string;
  text: string;
}

interface Attachment {
  content?: string | Buffer;
  filename?: string | false | undefined;
  path?: string;
  contentType?: string;
}

type Tag = {
  name: string;
  value: string;
};

interface CreateEmailBaseOptions {
  attachments?: Attachment[];
  headers?: Record<string, string>;
  subject: string;
  tags?: Tag[];
  scheduledAt?: string;
}

type CreateEmailOptions = RequireAtLeastOne<EmailRenderOptions> & CreateEmailBaseOptions;

type EmailTemplateType = (typeof schema.emailTemplateType.enumValues)[number];

export async function renderEmailTemplate<T extends EmailTemplateType>({
  clerkOrganizationId,
  type,
  appealUrl,
}: {
  clerkOrganizationId: string;
  type: T;
  appealUrl?: string;
}) {
  const template = await db.query.emailTemplates.findFirst({
    where: (templates, { and, eq }) =>
      and(eq(templates.clerkOrganizationId, clerkOrganizationId), eq(templates.type, type)),
  });

  const content = parseContent(template?.content, type);
  return await render<T>({
    clerkOrganizationId,
    content,
    type,
    appealUrl,
  });
}

export async function sendEmail({
  clerkOrganizationId,
  userId,
  ...payload
}: {
  clerkOrganizationId: string;
  userId: string;
} & CreateEmailOptions) {
  const { emailsEnabled } = await findOrCreateOrganizationSettings(clerkOrganizationId);

  if (!emailsEnabled || !env.RESEND_API_KEY) {
    console.log(userId, payload.subject, payload.text, payload.html);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const user = await db.query.users.findFirst({
    where: (users, { and, eq }) => and(eq(users.clerkOrganizationId, clerkOrganizationId), eq(users.id, userId)),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const email = user.email;
  if (!email) {
    throw new Error("User has no email");
  }

  if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log(userId, payload.subject, payload.text, payload.html);
    return;
  }

  const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  const { data, error } = await resend.emails.send({
    ...payload,
    from: fromEmail,
    to: [email],
  });

  if (error) {
    throw error;
  }

  return data;
}
