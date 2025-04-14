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
  if (!env.SEED_ORGANIZATION_ID) {
    console.error("SEED_ORGANIZATION_ID is not set");
    process.exit(1);
  }

  const organizationId = env.SEED_ORGANIZATION_ID;
  await seedOrganization(organizationId);
  const defaultRuleset = await findOrCreateDefaultRuleset(organizationId);
  await seedRules(organizationId);
  const users = await seedUsers(organizationId);
  await seedRecords(organizationId, defaultRuleset, users);
  await seedUserActions(organizationId);
  await seedAppeals(organizationId);
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
