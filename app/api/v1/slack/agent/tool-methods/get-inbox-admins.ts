import SlackContext from "@/app/api/v1/slack/agent/context";

async function getInboxAdmins(this: SlackContext<"message">) {
  if (!(await this.checkPayloadUserIsAdmin())) {
    return {
      result: "You are not authorized to perform this action.",
    };
  }

  const admins = await Promise.all(
    this.inbox.adminSlackUserIds.map(async (userSlackId) => {
      return await this.getIffyUserFromSlackId(userSlackId);
    }),
  );

  return {
    result: `Admins of the inbox:\n ${JSON.stringify(admins)}`,
  };
}

export default getInboxAdmins;
