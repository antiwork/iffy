import { handleAppMention } from "../events/app-mention";
import { handleUrlVerification } from "../events/url-verification";
import { SlackEventCallbacks, SupportedSlackEvents } from "./types";

const slackCallbacks: SlackEventCallbacks<SupportedSlackEvents> = {
  url_verification: [handleUrlVerification],
  app_mention: [handleAppMention],
  // assistant_thread_started: [],
  // assistant_thread_context_changed: [],
} as SlackEventCallbacks<SupportedSlackEvents>;

export { slackCallbacks };
