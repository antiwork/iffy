import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findOrCreateOrganization } from "@/services/organizations";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Templates | Iffy",
};
import { Preview } from "./preview";
import ContentForm from "./form";
import { Separator } from "@/components/ui/separator";
import { parseContent, render } from "@/emails/render";
import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

const EmailEditor = async <T extends (typeof schema.emailTemplateType.enumValues)[number]>({
  organizationId,
  type,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & Omit<Parameters<typeof render<T>>[0], "content">) => {
  const template = await db.query.emailTemplates.findFirst({
    where: and(
      eq(schema.emailTemplates.authOrganizationId, organizationId),
      eq(schema.emailTemplates.type, type),
    ),
  });

  const content = parseContent(template?.content, type);

  return (
    <div className="-mx-4">
      <Separator />
      <div className="mx-8 my-4 grid grid-cols-1 gap-4 p-4 md:grid-cols-3" aria-hidden="true">
        <ContentForm content={content} type={type} />
        <div className="col-span-1 pt-2 md:col-span-2">
          <EmailPreview
            content={content}
            className="rounded-lg"
            organizationId={organizationId}
            type={type}
          />
        </div>
      </div>
      <Separator />
    </div>
  );
};

const EmailPreview = async <T extends (typeof schema.emailTemplateType.enumValues)[number]>({
  organizationId,
  content,
  type,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "content"> & Parameters<typeof render<T>>[0]) => {
  const { html } = await render<T>({
    organizationId,
    content,
    type,
    appealUrl: type === "Suspended" ? "#" : undefined,
  });

  return <Preview html={html} {...props} />;
};

const Emails = async () => {
  const { orgId } = await authWithOrgSubscription();

  const organization = await findOrCreateOrganization(orgId);
  if (!organization.emailsEnabled) {
    return notFound();
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 pt-4 pl-8 text-2xl font-bold">Email Templates</h2>
      <Tabs defaultValue="suspended" className="w-full">
        <TabsList className="mb-2 ml-8">
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="compliant">Compliant</TabsTrigger>
          <TabsTrigger value="banned">Banned</TabsTrigger>
        </TabsList>
        <TabsContent value="suspended">
          <EmailEditor organizationId={orgId} type="Suspended" />
        </TabsContent>
        <TabsContent value="compliant">
          <EmailEditor organizationId={orgId} type="Compliant" />
        </TabsContent>
        <TabsContent value="banned">
          <EmailEditor organizationId={orgId} type="Banned" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Emails;
