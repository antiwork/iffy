import { findOrCreateDefaultRuleset } from "@/services/ruleset";
import { seedAppeals } from "./appeals";
import { seedRules } from "./rules";
import { seedUsers } from "./record-users";
import { seedRecords } from "./records";
import { seedOrganization } from "./organization";
import { env } from "@/lib/env";
import { close } from "@/db";
import { seedUserActions } from "./record-user-actions";

async function main() {
  if (!env.SEED_CLERK_ORGANIZATION_ID) {
    console.error("SEED_CLERK_ORGANIZATION_ID is not set");
    process.exit(1);
  }

  const clerkOrganizationId = env.SEED_CLERK_ORGANIZATION_ID;
  await seedOrganization(clerkOrganizationId);
  const defaultRuleset = await findOrCreateDefaultRuleset(clerkOrganizationId);
  await seedRules(clerkOrganizationId);
  const users = await seedUsers(clerkOrganizationId);
  await seedRecords(clerkOrganizationId, defaultRuleset, users);
  await seedUserActions(clerkOrganizationId);
  await seedAppeals(clerkOrganizationId);
}

main()
  .then(() => {
    console.log("Seeding completed successfully.");
    close();
  })
  .catch((e) => {
    console.error(e);
    close();
    process.exit(1);
  });
