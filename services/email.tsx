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
  authOrganizationId,
  type,
  appealUrl,
}: {
  authOrganizationId: string;
  type: T;
  appealUrl?: string;
}) {
  const template = await db.query.emailTemplates.findFirst({
    where: (templates, { and, eq }) =>
      and(eq(templates.authOrganizationId, authOrganizationId), eq(templates.type, type)),
  });

  const content = parseContent(template?.content, type);
  return await render<T>({
    authOrganizationId: authOrganizationId,
    content,
    type,
    appealUrl,
  });
}

export async function sendEmail({
  authOrganizationId,
  userId,
  ...payload
}: {
  authOrganizationId: string;
  userId: string;
} & CreateEmailOptions) {
  const { emailsEnabled } = await findOrCreateOrganization(authOrganizationId);

  if (!emailsEnabled || !env.RESEND_API_KEY) {
    console.log(userId, payload.subject, payload.text, payload.html);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const user = await db.query.endUsers.findFirst({
    where: (users, { and, eq }) => and(eq(users.authOrganizationId, authOrganizationId), eq(users.id, userId)),
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


type SendVerificationOTPParams = {
  email: string;
  otp: string;
  type: string;
};

export async function sendVerificationOTP({ email, otp, type }: SendVerificationOTPParams) {

  if (type !== "sign-in") {
    console.log(`Email not sent: Type "${type}" is not supported. Only "sign-in" is allowed.`);
    return null;
  }

  const subject = 'Verification Code';
  const text = `Your verification code is: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Verification Code</h2>
      <p>Please use the following code to verify your account:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
        ${otp}
      </div>
      <p style="margin-top: 20px;">This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log('Verification code:', email, subject, text);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`;

  if (process.env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log('Verification code:', email, subject, text);
    return;
  }

  try {
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
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

type InvitationPayload = {
  email: string
  inviteLink: string
  inviterName: string
  organizationName: string
  invitationId: string
}

export async function sendInvitation({ email, inviteLink, inviterName, organizationName, invitationId }: InvitationPayload) {
  const subject = `${inviterName} invited you to join ${organizationName}`;
  const acceptUrl = `${inviteLink}?action=accept&invitationId=${invitationId}`;
  const declineUrl = `${inviteLink}?action=decline&invitationId=${invitationId}`;

  const text = `
You've been invited by ${inviterName} to join ${organizationName}.

Accept: ${acceptUrl}
Decline: ${declineUrl}
`;

  const html = `
    <h2>You've Been Invited!</h2>
    <p>${inviterName} has invited you to join <strong>${organizationName}</strong>.</p>
    <p>Click a button below to respond to the invitation:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}" style="background-color: #4A5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Accept Invitation
      </a>
      &nbsp;&nbsp;
      <a href="${declineUrl}" style="background-color: #E53E3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Decline Invitation
      </a>
    </div>
  `;

  // Check for Resend API key
  if (!process.env.RESEND_API_KEY) {
    console.log('Invitation details:', email, subject, text);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`;

  // Log emails in non-production environments unless they're @resend.dev
  if (process.env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log('Invitation details:', email, subject, text);
    return;
  }

  try {
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
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}
