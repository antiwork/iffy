import { RegExpMatcher, englishDataset, englishRecommendedTransformers, DataSet, EnglishProfaneWord } from "obscenity";
import partition from "lodash/partition";
import { Context, StrategyResult } from "@/services/moderations";
import { StrategyInstance } from "./types";
import { z } from "zod";

const generateDataset = () => {
  return new DataSet<{ originalWord: EnglishProfaneWord }>().addAll(englishDataset);
};

const createObscenityMatcher = (blocklist: string[]) => {
  const dataset = generateDataset();
  dataset.removePhrasesIf((phrase) => {
    const inBlocklist = phrase.metadata?.originalWord && blocklist.includes(phrase.metadata.originalWord);
    return !inBlocklist;
  });

  const matcher = new RegExpMatcher({
    ...dataset.build(),
    ...englishRecommendedTransformers,
  });

  return (text: string) => {
    const blockedWords = new Set<string>();
    const matches = matcher.getAllMatches(text);
    for (let match of matches) {
      const { phraseMetadata } = dataset.getPayloadWithPhraseMetadata(match);
      if (phraseMetadata?.originalWord) {
        blockedWords.add(phraseMetadata.originalWord);
      }
    }
    return Array.from(blockedWords);
  };
};

const escapeRegExp = (s: string) => {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createNaiveMatcher = (blocklist: string[], exactMatch: boolean) => {
  if (exactMatch) {
    const regexes = blocklist.map((word) => ({
      word,
      regex: new RegExp(`\\b${escapeRegExp(word)}\\b`, "i"),
    }));

    return (text: string) => {
      const blockedWords = new Set<string>();
      for (const { word, regex } of regexes) {
        if (regex.test(text)) {
          blockedWords.add(word);
        }
      }
      return Array.from(blockedWords);
    };
  } else {
    return (text: string) => {
      const blockedWords = new Set<string>();
      for (let word of blocklist) {
        if (text.toLowerCase().includes(word.toLowerCase())) {
          blockedWords.add(word);
        }
      }
      return Array.from(blockedWords);
    };
  }
};

const isSupportedByObscenityMatcher = (word: string) => {
  let match = false;
  const dataset = generateDataset();
  // weirdly, this is the only way to iterate over the dataset...
  // the boolean return value, and the filtered dataset are unused
  // we just care if we found a match or not
  dataset.removePhrasesIf((phrase) => {
    if (phrase.metadata?.originalWord && phrase.metadata.originalWord === word) {
      match = true;
    }
    return false;
  });
  return match;
};

// tier 1: obscenity
// tier 2: naive, no text transforms
export const checkBlocklist = async (
  text: string,
  blocklist: string[],
  exactMatch: boolean,
): Promise<[true, string[]] | [false, null]> => {
  if (blocklist.length === 0) {
    return [false, null];
  }

  let matches: string[];
  const blockedWords = new Set<string>();

  let obscenityBlocklist: string[];
  [obscenityBlocklist, blocklist] = partition(blocklist, (word) => isSupportedByObscenityMatcher(word));

  const obscenityMatcher = createObscenityMatcher(obscenityBlocklist);
  const naiveMatcher = createNaiveMatcher(blocklist, exactMatch);

  matches = obscenityMatcher(text);
  matches.forEach((item) => blockedWords.add(item));

  matches = naiveMatcher(text);
  matches.forEach((item) => blockedWords.add(item));

  const isBlocked = blockedWords.size > 0;
  if (isBlocked) {
    return [isBlocked, Array.from(blockedWords)];
  }
  return [isBlocked, null];
};

export const type = "Blocklist";

export const optionsSchema = z.object({
  blocklist: z.array(z.string()),
  matcher: z
    .object({
      exactMatch: z.boolean().default(false),
    })
    .default({ exactMatch: false }),
});

export type Options = z.infer<typeof optionsSchema>;

export class Strategy implements StrategyInstance {
  name = "Blocklist";

  private readonly options: Options;

  constructor(options: unknown) {
    this.options = optionsSchema.parse(options);
  }

  async accepts(context: Context): Promise<boolean> {
    return true;
  }

  async test(context: Context): Promise<StrategyResult> {
    const [isBlocked, blockedWords] = await checkBlocklist(
      context.record.text,
      this.options.blocklist,
      this.options.matcher.exactMatch,
    );
    return {
      status: isBlocked ? "Flagged" : "Compliant",
      reasoning: blockedWords ? blockedWords.map((word) => `Content contains blocked word: ${word}`) : undefined,
    };
  }
}
