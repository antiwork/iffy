import LinkifyIt from "linkify-it";
import tlds from "tlds";

const linkifyParser = new LinkifyIt().tlds(tlds).set({ fuzzyLink: true, fuzzyIP: true, fuzzyEmail: false });

export function findUrlsInText(inputText: string): string[] {
  const matches = linkifyParser.match(inputText);
  if (!matches) return [];
  return matches.map((match) => match.url);
}


