import { eq, sql } from "drizzle-orm";
import db from "@/db";
import * as schema from "@/db/schema";
import { Options as BlocklistOptions } from "@/strategies/blocklist";
import { Options as PromptOptions } from "@/strategies/prompt";

const PRESETS: {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  blocklist?: string[];
}[] = [
  {
    id: "cm5vg3rah00025vl52pgd2ha4",
    name: "Adult content",
    description: "Adult content unacceptable to payment processors and banks",
    prompt: `Allowed:
- Nude images that are artistic or celebrate the human body, for example, nude reference poses for art

Not allowed:
- Nude images of humans that are clearly sexual or fetish driven
- Overtly sexual images with exaggerated body parts`,
  },
  {
    id: "cm5vg3rij00055vl57gdyge06",
    name: "Spam",
    description: "Content that is unsolicited, repetitive, or designed to artificially manipulate engagement",
    prompt: `Allowed:
- Most content, including solicitations

Not allowed:
- Massive unsolicited bulk messaging
- Extremely repetitive content
- Obvious artificial engagement manipulation

Note: Only flag content that is overwhelmingly spammy. Normal promotional content is acceptable.`,
  },
];

export async function updatePresets() {
  await db.delete(schema.presetStrategies);

  const existingPresets = await db.select().from(schema.presets);
  const existingIds = new Set(existingPresets.map((p) => p.id));

  for (const preset of PRESETS) {
    if (existingIds.has(preset.id)) {
      await db
        .update(schema.presets)
        .set({
          name: preset.name,
          description: preset.description,
        })
        .where(eq(schema.presets.id, preset.id));
    } else {
      await db.insert(schema.presets).values({
        id: preset.id,
        name: preset.name,
        description: preset.description,
      });
    }

    if (preset.blocklist) {
      await db.insert(schema.presetStrategies).values({
        presetId: preset.id,
        type: "Blocklist",
        options: { blocklist: preset.blocklist } satisfies BlocklistOptions,
      });
    }

    if (preset.prompt) {
      await db.insert(schema.presetStrategies).values({
        presetId: preset.id,
        type: "Prompt",
        options: { prompt: preset.prompt, topic: preset.name, skipImages: false } satisfies PromptOptions,
      });
    }
  }

  const presetIds = PRESETS.map((p) => p.id);
  await db.delete(schema.presets).where(sql`${schema.presets.id} NOT IN (${sql.join(presetIds, sql`, `)})`);
}
