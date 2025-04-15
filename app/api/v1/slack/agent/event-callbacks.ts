import { handleAppMention } from "../events/app-mention";
import { SlackEventCallbacks, SupportedSlackEvents } from "./types";

const slackCallbacks: SlackEventCallbacks<SupportedSlackEvents> = {
  app_mention: [handleAppMention],
} as SlackEventCallbacks<SupportedSlackEvents>;

export { slackCallbacks };
