import { tool, Tool, ToolSet } from "ai";
import SlackContext from "./context";
import getUserInfo from "./tool-methods/get-user-info";
import suspendUsers from "./tool-methods/suspend-users";
import unsuspendUsers from "./tool-methods/unsuspend-users";
import getCurrentSlackChannelUsers from "./tool-methods/get-current-slack-channel-users";
import { z } from "zod";

// Method Inputs excluding ctx
export type SlackToolMethodArgHelper<
  T extends keyof typeof SlackAgentToolMethods = keyof typeof SlackAgentToolMethods,
> = Omit<Parameters<(typeof SlackAgentToolMethods)[T]>[0], "ctx">;

// Method with Inputs including ctx
export type SlackToolMethod<T extends keyof typeof SlackAgentToolMethods> = (
  args: SlackToolMethodArgHelper<T> & { ctx: SlackContext<"app_mention"> },
) => Promise<{ result: string }>;

// Methods
export const SlackAgentToolMethods = {
  getUserInfo,
  suspendUsers,
  unsuspendUsers,
  getCurrentSlackChannelUsers,
};

// Tool Definitions
export const SLACK_AGENT_TOOLS: ToolSet = {
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
};
