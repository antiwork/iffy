import { faker } from "@faker-js/faker";
import sample from "lodash/sample";
import db from "../index";
import * as schema from "../schema";
import { eq, sql, inArray } from "drizzle-orm";

const COUNT = 256;

const PRODUCTS = [
  { name: "Ultimate Blender Asset Pack" },
  { name: "Python for Data Science Course" },
  { name: "Minimal iOS Icon Set" },
  { name: "Digital Art Masterclass" },
  { name: "Indie Game Dev Toolkit" },
  { name: "Professional Lightroom Presets" },
  { name: "Writing Better Stories Guide" },
  { name: "Unity Shader Collection" },
  { name: "Productivity Journal Template" },
  { name: "Music Production Essentials" },
  { name: "3D Character Rigging Tutorial" },
  { name: "Social Media Strategy Playbook" },
  { name: "Watercolor Brush Pack" },
  { name: "Game Sound Effects Library" },
  { name: "Email Marketing Templates" },
  { name: "Architectural Visualization Guide" },
  { name: "Stock Photo Collection" },
  { name: "React Components Library" },
  { name: "Character Design Workshop" },
  { name: "Mindfulness Meditation Course" },
  { name: "Video Editing Transitions Pack" },
  { name: "Fantasy Art Assets Bundle" },
  { name: "SEO Optimization Handbook" },
  { name: "Lo-fi Music Sample Pack" },
  { name: "UX Design Case Studies" },
  { name: "Creative Writing Prompts Pack" },
  { name: "Indie Film Making Guide" },
  { name: "Web Development Starter Kit" },
  { name: "Digital Marketing Playbook" },
  { name: "Game Asset Mega Bundle" },
  { name: "Private Photo Collection 😉", rule: "Adult content" },
  { name: "Exclusive VIP Content 🔞", rule: "Adult content" },
  { name: "Totally Legal Hacking Guide", rule: "Spam" },
  { name: "Crypto Pump Signals Group", rule: "Spam" },
  { name: "Special Dating Techniques", rule: "Adult content" },
  { name: "Follow My Instagram, Follow My Instagram", rule: "Spam" },
  { name: "Easy Money Secrets Revealed", rule: "Spam" },
  { name: "Premium Private Content", rule: "Adult content" },
  { name: "Restricted Access Bundle 🔐", rule: "Adult content" },
  { name: "Financial System Loopholes", rule: "Spam" },
  { name: "Special Adult Collection", rule: "Adult content" },
];

export async function seedRecords(
  organizationId: string,
  ruleset: { id: string },
  users: (typeof schema.endUsers.$inferSelect)[],
) {
  const rules = await db.query.rules.findMany({
    where: eq(schema.rules.rulesetId, ruleset.id),
    with: {
      preset: true,
    },
  });

  const products = [...Array(COUNT)].map(() => sample(PRODUCTS)!);

  const records = await db
    .insert(schema.records)
    .values(
      products.map((product) => {
        return {
          organizationId,
          clientId: `prod_${faker.string.nanoid(10)}`,
          name: product.name,
          entity: "Product",
          text: faker.lorem.paragraph(),
          metadata: {
            price: faker.commerce.price({ max: 20 }),
            material: faker.commerce.productMaterial(),
          },
          userId: sample(users)?.id,
          createdAt: faker.date.recent({ days: 10 }),
          protected: sample([true, false, false, false, false]),
          externalUrls: [...Array(faker.number.int({ min: 0, max: 3 }))].map(() => faker.internet.url()),
        };
      }),
    )
    .returning();

  console.log("Seeded Records");

  for (let i = 0; i < products.length; i++) {
    const product = products[i]!;
    const record = records[i]!;

    const isFlagged = product.rule !== undefined;

    const [moderation] = await db
      .insert(schema.moderations)
      .values({
        organizationId,
        status: isFlagged && !record.protected ? "Flagged" : "Compliant",
        reasoning: faker.lorem.paragraph(2),
        recordId: record.id,
        rulesetId: ruleset.id,
        createdAt: record.createdAt,
      })
      .returning();

    if (!moderation) {
      continue;
    }

    const rule = rules.find((rule) => rule.name === product.rule || rule.preset?.name === product.rule);
    if (isFlagged && rule) {
      await db.insert(schema.moderationsToRules).values({
        moderationId: moderation.id,
        ruleId: rule.id,
      });
    }

    await db
      .update(schema.records)
      .set({
        moderationStatus: moderation.status,
        moderationStatusCreatedAt: moderation.createdAt,
        moderationPending: moderation.pending,
        moderationPendingCreatedAt: moderation.createdAt,
      })
      .where(eq(schema.records.id, record.id));

    if (record.userId && isFlagged) {
      await db
        .update(schema.endUsers)
        .set({
          flaggedRecordsCount: sql`flagged_records_count + 1`,
        })
        .where(eq(schema.endUsers.id, record.userId));
    }
  }

  console.log("Seeded Moderations");

  await db.refreshMaterializedView(schema.moderationsAnalyticsDaily).concurrently();
  await db.refreshMaterializedView(schema.moderationsAnalyticsHourly).concurrently();

  return records;
}
