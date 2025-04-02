import { generateObject, UserContent } from "ai";
import { z } from "zod";

import { StrategyInstance } from "./types";
import { LinkData, Context, StrategyResult } from "@/services/moderations";
import sampleSize from "lodash/sampleSize";
import { aiConfig, getModelFromConfig } from "@/lib/ai-config";

const getMultiModalInput = (context: Context, skipImages?: boolean): UserContent => {
  const images = skipImages ? [] : sampleSize(context.record.imageUrls, 3);
  return [
    {
      type: "text" as const,
      text: context.record.text,
    },
    ...images.map((url) => ({
      type: "image" as const,
      image: url,
    })),
    ...(context.externalLinks.length > 0
      ? [
          {
            type: "text" as const,
            text: formatExternalLinksAsXml(context.externalLinks),
          },
        ]
      : []),
  ];
};

export function formatExternalLinksAsXml(externalLinks: LinkData[]): string {
  return externalLinks
    .map(
      (link) =>
        `<externalLink><url>${link.originalUrl}</url>` +
        `${link.finalUrl !== link.originalUrl ? `<finalUrl>${link.finalUrl}</finalUrl>` : ""}` +
        `<title>${link.title}</title><description>${link.description}</description>` +
        `<bodySnippet>${link.snippet}</bodySnippet></externalLink>`,
    )
    .join("");
}

export const type = "Prompt";

export const optionsSchema = z.object({
  topic: z.string(),
  prompt: z.string(),
  skipImages: z.boolean().optional().default(false),
});

export type Options = z.input<typeof optionsSchema>;

export class Strategy implements StrategyInstance {
  name = "Prompt";

  private options: z.infer<typeof optionsSchema>;

  constructor(options: unknown) {
    this.options = optionsSchema.parse(options);
  }

  async accepts(context: Context): Promise<boolean> {
    return true;
  }

  async test(context: Context): Promise<StrategyResult> {
    let overrideWarning = "";
    if (context.lastManualModeration) {
      const status = context.lastManualModeration.status === "Flagged" ? "flagged" : "compliant";
      let message = `A human moderator previously overrode your automated moderation, marking a prior version of this content ${status}`;
      if (context.lastManualModeration.reasoning) {
        message += `, and providing the reasoning: "${context.lastManualModeration.reasoning}"`;
      }
      overrideWarning = `${message}. Unless you are ABSOLUTELY sure that the human moderator made a mistake, you should not override their decision. Regardless of the position you take, you should be EXTREMELY certain in your reasoning, and provide definitive reasoning for why you agree or disagree with the human moderator. Emphasize this certainty in your reasoning.`;
    }

    const { object, usage } = await generateObject({
      model: getModelFromConfig(aiConfig.moderationModel),
      schema: z.object({
        flagged: z.boolean().describe("True if the content is not acceptable, false otherwise"),
        reasoning: z.string().optional().describe("A brief explanation of why the content is not acceptable"),
      }),
      messages: [
        {
          role: "user",
          content: getMultiModalInput(context, this.options.skipImages),
        },
      ],
      system: `You are a content moderation expert, trained to identify examples of ${this.options.topic} that are not allowed.

      Here are the rules you must follow:
      ${this.options.prompt}

      You will be asked to moderate the following content based on these rules.

      Is the content acceptable? If it isn't OBVIOUSLY unacceptable, mark the content as not flagged.

      ${context.externalLinks.length > 0 ? "For external links in <externalLink> tags, flag if ANY content is questionable - zero tolerance. When writing your reasoning, write in EXTREMELY certain terms that the content is unacceptable." : ""}
      ${overrideWarning}`,
    });

    context.tokens += usage.totalTokens;

    if (object.flagged) {
      const { object: uncertaintyObject, usage: uncertaintyUsage } = await generateObject({
        model: getModelFromConfig(aiConfig.judgeModel),
        schema: z.object({
          uncertain: z.boolean().describe("True if there's uncertainty in the reasoning, false otherwise"),
        }),
        messages: [
          {
            role: "user",
            content: `Given the following moderation reasoning, is there any uncertainty in the decision? Reasoning: ${object.reasoning}`,
          },
        ],
        system: "You are an AI assistant tasked with evaluating the certainty of content moderation decisions.",
      });
      context.tokens += uncertaintyUsage.totalTokens;

      return {
        status: uncertaintyObject.uncertain ? "Compliant" : "Flagged",
        reasoning: object.reasoning ? [object.reasoning] : [],
      };
    }

    return {
      status: "Compliant",
      reasoning: object.reasoning ? [object.reasoning] : [],
    };
  }
}
