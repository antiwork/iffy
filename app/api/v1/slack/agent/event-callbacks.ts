import { handleAppInstall, handleAppUninstall } from "../events/app-install";
import { handleAppMention } from "../events/app-mention";
import { handleUrlVerification } from "../events/url-verification";
import { SlackEventCallbacks, SupportedSlackEvents } from "./types";

const slackCallbacks: SlackEventCallbacks<SupportedSlackEvents> = {
  url_verification: [handleUrlVerification],
  app_installed: [handleAppInstall],
  app_mention: [handleAppMention],
  app_uninstalled: [handleAppUninstall],
} as SlackEventCallbacks<SupportedSlackEvents>;

export { slackCallbacks };
