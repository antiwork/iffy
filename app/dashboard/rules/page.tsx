import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules | Iffy",
};
import db from "@/db";
import { Rules } from "./rules";
import { getRules } from "@/services/rules";
import { findOrCreateDefaultRuleset } from "@/services/ruleset";

async function Page() {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const defaultRuleset = await findOrCreateDefaultRuleset(orgId);

  const rules = await getRules(orgId, defaultRuleset.id);

  const presets = await db.query.presets.findMany({
    orderBy: (presets, { asc }) => [asc(presets.createdAt)],
  });

  return (
    <div className="px-12 py-8">
      <Rules rulesetId={defaultRuleset.id} rules={rules} presets={presets} />
    </div>
  );
}

export default Page;
