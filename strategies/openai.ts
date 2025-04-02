import OpenAI from "openai";
import { Context, StrategyResult } from "@/services/moderations";
import { StrategyInstance } from "./types";
import { env } from "@/lib/env";
import { entries } from "@/lib/utils";
import { z } from "zod";

const openai = new OpenAI({
  baseURL: env.OPENAI_BASE_URL,
  apiKey: env.OPENAI_API_KEY,
});

const MODEL = "omni-moderation-latest";

const reasons = {
  harassment: "Content expresses, incites, or promotes harassing language towards any target",
  "harassment/threatening": "Harassment content that also includes violence or serious harm towards any target",
  hate: "Content expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste",
  "hate/threatening":
    "Hateful content that also includes violence or serious harm towards the targeted group based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste",
  illicit: "Content gives advice or instruction on how to commit illicit acts",
  "illicit/violent": "Content gives advice or instruction on how to commit violence or procure a weapon",
  "self-harm":
    "Content promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders",
  "self-harm/intent":
    "Content where the speaker expresses that they are engaging or intend to engage in acts of self-harm, such as suicide, cutting, and eating disorders",
  "self-harm/instructions":
    "Content encourages performing acts of self-harm, such as suicide, cutting, and eating disorders, or gives instructions or advice on how to commit such acts",
  sexual:
    "Content arouses sexual excitement, such as the description of sexual activity, or promotes sexual services (excluding sex education and wellness)",
  "sexual/minors": "Content is sexual and includes an individual who is under 18 years old",
  violence: "Content depicts death, violence, or physical injury",
  "violence/graphic": "Content depicts death, violence, or physical injury in graphic detail",
} as const;

export const type = "OpenAI";

export const optionsSchema = z.object({
  thresholds: z.record(z.string(), z.number()),
});

export type Options = z.input<typeof optionsSchema>;

export class Strategy implements StrategyInstance {
  name = "OpenAI Moderation";

  private readonly options: z.infer<typeof optionsSchema>;

  constructor(options: unknown) {
    this.options = optionsSchema.parse(options);
  }

  async accepts(context: Context): Promise<boolean> {
    return true;
  }

  async test(context: Context): Promise<StrategyResult> {
    let status: "Compliant" | "Flagged" = "Compliant";
    let reasoning: string[] = [];

    const moderation = await openai.moderations.create({
      model: MODEL,
      input: context.record.text,
    });

    const result = moderation.results[0];
    if (!result) {
      throw new Error("Unexpected OpenAI response");
    }

    for (const [category, score] of entries(result.category_scores)) {
      if (this.options.thresholds[category] && score > this.options.thresholds[category]) {
        status = "Flagged";
        reasoning.push(reasons[category]);
      }
    }

    return { status, reasoning };
  }
}
