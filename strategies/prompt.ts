import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import * as schema from "@/db/schema";
import { StrategyInstance } from "./types";
import { LinkData, Context, StrategyResult } from "@/services/moderations";
import { env } from "@/lib/env";
import sampleSize from "lodash/sampleSize";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";

const getMultiModalInput = (
  record: typeof schema.records.$inferSelect,
  skipImages?: boolean,
): OpenAI.Chat.Completions.ChatCompletionContentPart[] => {
  const images = skipImages ? [] : sampleSize(record.imageUrls, 3);
  return [
    {
      type: "text" as const,
      text: record.text,
    },
    ...images.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
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
  skipImages: z.boolean().optional(),
});

export type Options = z.infer<typeof optionsSchema>;

export class Strategy implements StrategyInstance {
  name = "Prompt";

  private options: Options;

  constructor(options: unknown) {
    this.options = optionsSchema.parse(options);
  }

  async accepts(context: Context): Promise<boolean> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: getMultiModalInput(context.record, this.options.skipImages),
      },
      {
        role: "user",
        content: formatExternalLinksAsXml(context.externalLinks),
      },
      {
        role: "system",
        content: `You are an AI assistant tasked with determining if the above content is related to a specific topic. The topic is: ${this.options.topic}.`,
      },
      {
        role: "user",
        content: `Is the above content related to the topic "${this.options.topic}"? Respond with true or false only.`,
      },
    ];

    const response = await openai.beta.chat.completions.parse({
      model: MODEL,
      messages,
      response_format: zodResponseFormat(
        z.object({
          isRelated: z.boolean().describe("True if the content is related to the topic, false otherwise"),
        }),
        "result",
      ),
    });

    context.tokens += response.usage?.total_tokens ?? 0;

    const result = response.choices[0]?.message?.parsed;
    if (!result) throw new Error("Unexpected OpenAI response");

    return result.isRelated;
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

    const externalLinksXml = formatExternalLinksAsXml(context.externalLinks);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: getMultiModalInput(context.record, this.options.skipImages),
      },
      {
        role: "user",
        content: externalLinksXml,
      },
      {
        role: "system",
        content: `You are a content moderation expert for the topic: ${this.options.topic}.

              Here are the rules for this category:
              ${this.options.prompt}

              You will be asked to moderate the above content based on these rules.

              Is the content acceptable for the topic ${this.options.topic}? If it isn't OBVIOUSLY unacceptable, mark the content as not flagged.

              ${externalLinksXml ? "For external links in <externalLink> tags, flag if ANY content is questionable - zero tolerance. When writing your reasoning, write in EXTREMELY certain terms that the content is unacceptable." : ""}
              ${overrideWarning}`,
      },
    ];

    const response = await openai.beta.chat.completions.parse({
      model: MODEL,
      messages,
      response_format: zodResponseFormat(
        z.object({
          flagged: z.boolean().describe("True if the content is not acceptable, false otherwise"),
          reasoning: z.string().describe("A brief explanation of why the content is not acceptable"),
        }),
        "result",
      ),
    });

    context.tokens += response.usage?.total_tokens ?? 0;

    const result = response.choices[0]?.message?.parsed;
    if (!result) throw new Error("Unexpected OpenAI response");

    if (result.flagged) {
      const uncertaintyResponse = await openai.beta.chat.completions.parse({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an AI assistant tasked with evaluating the certainty of content moderation decisions.",
          },
          {
            role: "user",
            content: `Given the following moderation reasoning, is there any uncertainty in the decision? Reasoning: ${result.reasoning}`,
          },
        ],
        response_format: zodResponseFormat(
          z.object({
            uncertain: z.boolean().describe("True if there's uncertainty in the reasoning, false otherwise"),
          }),
          "result",
        ),
      });
      context.tokens += uncertaintyResponse.usage?.total_tokens ?? 0;

      const uncertaintyResult = uncertaintyResponse.choices[0]?.message?.parsed;
      if (!uncertaintyResult) throw new Error("Unexpected OpenAI response");

      return {
        status: uncertaintyResult.uncertain ? "Compliant" : "Flagged",
        reasoning: [result.reasoning],
      };
    }

    return {
      status: "Compliant",
      reasoning: [result.reasoning],
    };
  }
}
