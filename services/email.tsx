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



// export async function sendVerificationOTP({ email, token, url }) {
//   const subject = type === 'signup'
//     ? 'Verify your account'
//     : 'Login verification';
//
//   //TODO: make template for signup and login
//   const text = `Your ${type === 'signup' ? 'verification' : 'login'} otp is: ${otp}`;
//   const html = `<p>${text}</p>`;
//
//   if (type === 'signup') {
//
//     // Send direct email for signup verification
//     if (!env.RESEND_API_KEY) {
//       console.log('Signup verification', email, subject, text);
//       return;
//     }
//
//     const resend = new Resend(env.RESEND_API_KEY);
//     const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;
//
//     if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
//       console.log('Signup verification', email, subject, text);
//       return;
//     }
//
//     const { data, error } = await resend.emails.send({
//       from: fromEmail,
//       to: [email],
//       subject,
//       text,
//       html
//     });
//
//     if (error) {
//       throw error;
//     }
//
//     return data;
//   }
//   // For login verification
//   else if (type === 'login') {
//     // WARN: I have test this functionality
//     // We only need to verify the email exists in our system
//     // const user = await db.query.endUsers.findFirst({
//     //   where: (users, { eq }) => eq(users.email, email),
//     // });
//     // if (!user) {
//     //   console.error(`User with email ${email} not found for login verification`);
//     //   throw new Error("User not found");
//     // }
//
//     // Send direct email for login verification
//     if (!env.RESEND_API_KEY) {
//       console.log('Login verification', email, subject, text);
//       return;
//     }
//
//     const resend = new Resend(env.RESEND_API_KEY);
//     const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;
//
//     if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
//       console.log('Login verification', email, subject, text);
//       return;
//     }
//
//     const { data, error } = await resend.emails.send({
//       from: fromEmail,
//       to: [email],
//       subject,
//       text,
//       html
//     });
//
//     if (error) {
//       throw error;
//     }
//
//     return data;
//   }
// }

export async function sendVerificationOTP({ email, token, url }) {
  const subject = 'Your verification code';

  const text = `
Verification code: ${token}

Or use this link to verify automatically: ${url}

To protect your account, do not share this code or link.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #333;">Verification code</h2>
      <p style="font-size: 16px; line-height: 1.5; color: #666;">
        Enter the following verification code when prompted:
      </p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 0;">
          ${token}
        </p>
      </div>
      <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
        To protect your account, do not share this code.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; color: #666; margin-bottom: 15px;">Or click the button below to verify automatically:</p>
        <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 16px;">
          Verify Now
        </a>
      </div>
      <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center;">
        If you didn't request this verification, you can safely ignore this email.
      </p>
    </div>
  `;

  // Skip email sending if RESEND_API_KEY is not available
  if (!env.RESEND_API_KEY) {
    console.log('Verification email', email, subject, text);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  // Skip sending real emails in non-production environments unless using a test email
  if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
    console.log('Verification email', email, subject, text);
    return;
  }

  // Send the email
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject,
    text,
    html
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }

  return data;
}
