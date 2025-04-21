import { Tool, tool, ToolSet } from "ai";
import { z } from "zod";

import getUserInfo from "./tool-methods/get-user-info";
import suspendUsers from "./tool-methods/suspend-users";
import unsuspendUsers from "./tool-methods/unsuspend-users";
import getCurrentSlackChannelUsers from "./tool-methods/get-current-slack-channel-users";
import addNewInboxAdmin from "./tool-methods/inbox-admins-add-new";
import removeInboxAdmin from "./tool-methods/inbox-admins-remove";
import getInboxAdmins from "./tool-methods/get-inbox-admins";
import SlackContext from "./context";

export function getAuthorizedAgentTools(ctx: SlackContext, isAdmin?: boolean) {
  type AuthedTools = {
    [K in keyof typeof SLACK_AGENT_TOOLS]: boolean;
  };

  // If true, it requires authentication to use the tool
  const AUTHED_TOOLS: AuthedTools = {
    getUserInfo: true,
    suspendUsers: true,
    addNewInboxAdmin: true,
    getBotAdmins: true,
    removeInboxAdmin: true,
    unsuspendUsers: true,
    getCurrentSlackChannelUsers: false,
  };

  const SLACK_AGENT_TOOLS = {
    getUserInfo: tool({
      type: "function",
      description: "Get information about a user using their email address, client ID, or user ID",
      parameters: z.object({
        userId: z
          .string()
          .describe(
            "The identifier of the user to get information about. This can be an email address, client ID, or user ID",
          ),
      }),
      execute: getUserInfo,
    }),
    suspendUsers: tool({
      type: "function",
      description: "Suspend one or more users using their email address, client ID, or user ID",
      parameters: z.object({
        reasoning: z.string().describe("The reason for the suspension"),
        userIds: z
          .array(z.string())
          .describe("The identifiers of the users to suspend. This can be an email address, client ID, or user ID"),
      }),
      execute: suspendUsers,
    }),
    unsuspendUsers: tool({
      type: "function",
      description: "Unsuspend one or more users using their email address, client ID, or user ID",
      parameters: z.object({
        reasoning: z.string().describe("The reason for the unsuspension"),
        userIds: z
          .array(z.string())
          .describe("The identifiers of the users to unsuspend. This can be an email address, client ID, or user ID"),
      }),
      execute: unsuspendUsers,
    }),
    getCurrentSlackChannelUsers: tool({
      type: "function",
      description: "Get the list of users in the current Slack channel",
      parameters: z.object({}),
      execute: getCurrentSlackChannelUsers,
    }),
    addNewInboxAdmin: tool({
      type: "function",
      description: "Add a user as a new admin of the bot (requires they have Clerk OAuth for full access)",
      parameters: z.object({
        userSlackId: z.string().describe("The Slack ID of the user to add as an admin").startsWith("U"),
      }),
      execute: addNewInboxAdmin,
    }),
    removeInboxAdmin: tool({
      type: "function",
      description: "Remove a user as an admin of the bot, revoking their authorization to use all tools",
      parameters: z.object({
        userSlackId: z.string().describe("The Slack ID of the user to remove as an admin").startsWith("U"),
      }),
      execute: removeInboxAdmin,
    }),
    getBotAdmins: tool({
      type: "function",
      description: "Get a list of all admins of the bot",
      parameters: z.object({}),
      execute: getInboxAdmins,
    }),
  };

  // Create new tool instances bound to this specific context
  Object.values(SLACK_AGENT_TOOLS).forEach((tool: Tool) => {
    const originalExecute = tool.execute;
    if (originalExecute) {
      tool.execute = originalExecute.bind(ctx);
    }
  });

  if (isAdmin) {
    return SLACK_AGENT_TOOLS;
  }

  return Object.entries(SLACK_AGENT_TOOLS).reduce((acc, [key, tool]) => {
    if (AUTHED_TOOLS[key as keyof AuthedTools]) {
      acc[key as keyof ToolSet] = tool;
    }
    return acc;
  }, {} as ToolSet);
}
