import db from "@/db";
import * as schema from "@/db/schema";
import { findOrCreateOrganization } from "./organizations";
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
  organizationId,
  type,
  appealUrl,
}: {
  organizationId: string;
  type: T;
  appealUrl?: string;
}) {
  const template = await db.query.emailTemplates.findFirst({
    where: (templates, { and, eq }) => and(eq(templates.organizationId, organizationId), eq(templates.type, type)),
  });

  const content = parseContent(template?.content, type);
  return await render<T>({
    organizationId,
    content,
    type,
    appealUrl,
  });
}

export async function sendEmail({
  organizationId,
  userRecordId,
  ...payload
}: {
  organizationId: string;
  userRecordId: string;
} & CreateEmailOptions) {
  const { emailsEnabled } = await findOrCreateOrganization({ id: organizationId });

  if (!emailsEnabled || !env.RESEND_API_KEY) {
    console.log(userRecordId, payload.subject, payload.text, payload.html);

    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const userRecord = await db.query.userRecords.findFirst({
    where: (userRecords, { and, eq }) =>
      and(eq(userRecords.organizationId, organizationId), eq(userRecords.id, userRecordId)),
  });

  if (!userRecord) {
    throw new Error("User not found");
  }

  const email = userRecord.email;
  if (!email) {
    throw new Error("User has no email");
  }

  if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log(userRecordId, payload.subject, payload.text, payload.html);
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

export async function sendTenantEmail({ email, ...payload }: { email: string } & CreateEmailOptions) {
  if (!env.RESEND_API_KEY) {
    console.log(payload.subject, payload.text, payload.html);
  }

  const resend = new Resend(env.RESEND_API_KEY);

  if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log(payload.subject, payload.text, payload.html);
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
