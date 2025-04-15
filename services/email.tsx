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
    where: (templates, { and, eq }) =>
      and(eq(templates.organizationId, organizationId), eq(templates.type, type)),
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
  userId,
  ...payload
}: {
  organizationId: string;
  userId: string;
} & CreateEmailOptions) {
  const { emailsEnabled } = await findOrCreateOrganization(organizationId);

  if (!emailsEnabled || !env.RESEND_API_KEY) {
    console.log(userId, payload.subject, payload.text, payload.html);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const user = await db.query.endUsers.findFirst({
    where: (users, { and, eq }) => and(eq(users.organizationId, organizationId), eq(users.id, userId)),
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



export async function sendVerificationOTP({ email, otp, type }) {
  const subject = type === 'signup'
    ? 'Verify your account'
    : 'Login verification';

  //TODO: make template for signup and login
  const text = `Your ${type === 'signup' ? 'verification' : 'login'} otp is: ${otp}`;
  const html = `<p>${text}</p>`;

  if (type === 'signup') {

    // Send direct email for signup verification
    if (!env.RESEND_API_KEY) {
      console.log('Signup verification', email, subject, text);
      return;
    }

    const resend = new Resend(env.RESEND_API_KEY);
    const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

    if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
      console.log('Signup verification', email, subject, text);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject,
      text,
      html
    });

    if (error) {
      throw error;
    }

    return data;
  }
  // For login verification
  else if (type === 'login') {
    // WARN: I have test this functionality
    // We only need to verify the email exists in our system
    // const user = await db.query.endUsers.findFirst({
    //   where: (users, { eq }) => eq(users.email, email),
    // });
    // if (!user) {
    //   console.error(`User with email ${email} not found for login verification`);
    //   throw new Error("User not found");
    // }

    // Send direct email for login verification
    if (!env.RESEND_API_KEY) {
      console.log('Login verification', email, subject, text);
      return;
    }

    const resend = new Resend(env.RESEND_API_KEY);
    const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

    if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
      console.log('Login verification', email, subject, text);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject,
      text,
      html
    });

    if (error) {
      throw error;
    }

    return data;
  }
}

