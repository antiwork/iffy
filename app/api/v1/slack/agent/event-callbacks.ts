import { SlackEventCallbacks, SupportedSlackEvents } from "./types";
import handleMessage from "../events/message";

const slackCallbacks: SlackEventCallbacks<SupportedSlackEvents> = {
  message: [handleMessage],
} as SlackEventCallbacks<SupportedSlackEvents>;

export { slackCallbacks };
