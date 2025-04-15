import OpenAI from "openai";
import SlackContext from "./context";
import getUserInfo from "./tool-methods/get-user-info";
import suspendUsers from "./tool-methods/suspend-users";
import unsuspendUsers from "./tool-methods/unsuspend-users";
import getCurrentSlackChannelUsers from "./tool-methods/get-current-slack-channel-users";

// Method Inputs excluding ctx
export type SlackToolMethodArgHelper<
  T extends keyof typeof SlackAgentToolMethods = keyof typeof SlackAgentToolMethods,
> = Omit<Parameters<(typeof SlackAgentToolMethods)[T]>[0], "ctx">;

// Method Inputs including ctx
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
export const SLACK_AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getUserInfo",
      description: "Get information about a user using their email address, client ID, or user ID",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description:
              "The identifier of the user to get information about. This can be an email address, client ID, or user ID",
          },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suspendUsers",
      description: "Suspend one or more users using their email address, client ID, or user ID",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "The reason for the suspension",
          },
          userIds: {
            type: "array",
            items: {
              type: "string",
              description: "The identifier of the user to suspend. This can be an email address, client ID, or user ID",
            },
          },
        },
        additionalProperties: false,
        required: ["reason", "userIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unsuspendUsers",
      description: "Unsuspend one or more users using their email address, client ID, or user ID",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "The reason for the unsuspension",
          },
          userIds: {
            type: "array",
            items: {
              type: "string",
              description:
                "The identifier of the user to unsuspend. This can be an email address, client ID, or user ID",
            },
          },
        },
        additionalProperties: false,
        required: ["reason", "userIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCurrentSlackChannelUsers",
      description: "Get the list of users in the current Slack channel",
      strict: true,
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];
