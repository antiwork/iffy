"use server";

import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createUserAction } from "./user-actions";

type SlackCommand = {
  type: "suspend" | "unsuspend" | "info";
  userIds: string[];
  reasoning?: string;
};

/**
 * Parse a Slack command message to identify the requested action
 */
export async function parseSlackCommand(text: string): Promise<SlackCommand | null> {
  // Remove mentions and normalize whitespace
  const cleanedText = text.replace(/<@[A-Z0-9]+>/g, "").trim();

  // Match suspend command: suspend user_id1, user_id2 because reason
  const suspendMatch = cleanedText.match(/^suspend\s+((?:user_[a-zA-Z0-9]+(?:[\s,]+)?)+)(?:\s+because\s+(.+))?$/i);
  if (suspendMatch && suspendMatch[1]) {
    // Split user IDs by comma or whitespace and filter out empty strings
    const userIds = suspendMatch[1].split(/[\s,]+/).filter(Boolean);
    const reasoning = suspendMatch[2] ? suspendMatch[2].trim() : "Suspended via Slack command";
    console.log("Parsed suspend command:", { userIds, reasoning });
    return {
      type: "suspend",
      userIds,
      reasoning,
    };
  }

  // Match unsuspend command: unsuspend user_id1, user_id2
  const unsuspendMatch = cleanedText.match(/^unsuspend\s+((?:user_[a-zA-Z0-9]+(?:[\s,]+)?)+)(?:\s+because\s+(.+))?$/i);
  if (unsuspendMatch && unsuspendMatch[1]) {
    // Split user IDs by comma or whitespace and filter out empty strings
    const userIds = unsuspendMatch[1].split(/[\s,]+/).filter(Boolean);
    return {
      type: "unsuspend",
      userIds,
      reasoning: unsuspendMatch[2] ? unsuspendMatch[2].trim() : "Unsuspended via Slack command",
    };
  }

  // Match info command: info user_id
  const infoMatch = cleanedText.match(/^info\s+(user_[a-zA-Z0-9]+)$/i);
  if (infoMatch && infoMatch[1]) {
    return {
      type: "info",
      userIds: [infoMatch[1]],
    };
  }

  return null;
}

/**
 * Handle a Slack command and execute the requested action
 */
export async function handleSlackCommand(
  clerkOrganizationId: string,
  command: SlackCommand,
): Promise<{ text: string }> {
  try {
    switch (command.type) {
      case "suspend":
        return await suspendUsers(clerkOrganizationId, command.userIds, command.reasoning);
      case "unsuspend":
        return await unsuspendUsers(clerkOrganizationId, command.userIds, command.reasoning);
      case "info":
        if (!command.userIds[0]) {
          return { text: "User ID is required for the info command." };
        }

        if (command.userIds.length > 1) {
          return { text: "Only one user ID is allowed for the info command." };
        }

        return await getUserInfo({ clerkOrganizationId, clientId: command.userIds[0] });
      default:
        return { text: "Unrecognized command. Try 'suspend [userIds]', 'unsuspend [userIds]', or 'info [userId]'." };
    }
  } catch (error) {
    console.error("Error handling Slack command:", error);
    return {
      text: `Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Suspend one or more users
 */
async function suspendUsers(
  clerkOrganizationId: string,
  userIds: string[],
  reasoning = "Suspended via Slack command",
): Promise<{ text: string }> {
  const results = await Promise.allSettled(
    userIds.map(async (clientId) => {
      // Find the user by clientId
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.clientId, clientId)),
      });

      if (!user) {
        throw new Error(`User with ID ${clientId} not found`);
      }

      // Check if user is already suspended or banned
      if (user.actionStatus === "Suspended") {
        return { id: clientId, status: "already suspended" };
      }

      if (user.actionStatus === "Banned") {
        return { id: clientId, status: "banned (cannot suspend)" };
      }

      // Check if user is protected
      if (user.protected) {
        return { id: clientId, status: "protected (cannot suspend)" };
      }

      // Suspend the user
      await createUserAction({
        clerkOrganizationId,
        clerkUserId: clientId,
        userId: user.id,
        status: "Suspended",
        via: "Manual",
        reasoning,
      });

      return { id: clientId, status: "suspended" };
    }),
  );

  const formatted = results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return `• ${result.value.id}: ${result.value.status}`;
      } else {
        return `• ${userIds[index]}: failed (${result.reason.message})`;
      }
    })
    .join("\n");

  return {
    text: `Suspension results for ${userIds.length} user(s):\n${formatted}`,
  };
}

/**
 * Unsuspend one or more users
 */
async function unsuspendUsers(
  clerkOrganizationId: string,
  userIds: string[],
  reasoning = "Unsuspended via Slack command",
): Promise<{ text: string }> {
  const results = await Promise.allSettled(
    userIds.map(async (clientId) => {
      // Find the user by clientId
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.clientId, clientId)),
      });

      if (!user) {
        throw new Error(`User with ID ${clientId} not found`);
      }

      // Check if user is already unsuspended or compliant
      if (user.actionStatus === "Compliant") {
        return { id: clientId, status: "already compliant" };
      }

      if (user.actionStatus === "Banned") {
        return { id: clientId, status: "banned (cannot unsuspend)" };
      }

      // Unsuspend the user
      await createUserAction({
        clerkOrganizationId,
        clerkUserId: clientId,
        userId: user.id,
        status: "Compliant",
        via: "Manual",
        reasoning,
      });

      return { id: clientId, status: "unsuspended" };
    }),
  );

  // Format the response
  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const formatted = results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return `• ${result.value.id}: ${result.value.status}`;
      } else {
        return `• ${userIds[index]}: failed (${result.reason.message})`;
      }
    })
    .join("\n");

  return {
    text: `Unsuspension results for ${userIds.length} user(s):\n${formatted}`,
  };
}

/**
 * Get information about a user
 */
async function getUserInfo({
  clerkOrganizationId,
  clientId,
}: {
  clerkOrganizationId: string;
  clientId: string;
}): Promise<{ text: string }> {
  // // Find the user by clientId
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.clientId, clientId)),
    with: {
      records: {
        where: eq(schema.records.moderationStatus, "Flagged"),
        columns: {
          name: true,
          id: true,
          entity: true,
          clientUrl: true,
        },
      },
    },
  });

  if (!user) {
    return { text: `User with ID ${clientId} not found.` };
  }

  // Format user information
  const userInfo = [
    `*User ID*: ${user.clientId}`,
    `*Status*: ${user.actionStatus || "Compliant"}`,
    `*Protected*: ${user.protected ? "Yes" : "No"}`,
    `*Email*: ${user.email || "Not provided"}`,
    `*Name*: ${user.name || "Not provided"}`,
    `*Username*: ${user.username || "Not provided"}`,
    `*Created At*: ${user.createdAt.toISOString().split("T")[0]}`,
    `*Flagged Records Count*: ${user.flaggedRecordsCount}`,
  ];

  // Add recent flagged records if any
  if (user.records.length > 0) {
    userInfo.push("\n*Recent Flagged Records*:");
    user.records.forEach((record) => {
      userInfo.push(
        `• ${record.name || record.id}: ${record.entity} ${record.clientUrl ? `- <${record.clientUrl}|Link>` : ""}`,
      );
    });
  }

  // Add metadata if available
  if (user.metadata) {
    userInfo.push("\n*Metadata*:");
    for (const [key, value] of Object.entries(user.metadata)) {
      userInfo.push(`• ${key}: ${value}`);
    }
  }

  return { text: userInfo.join("\n") };
}
