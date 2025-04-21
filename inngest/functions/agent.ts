import { inngest } from "@/inngest/client";
import SlackContext from "@/app/api/v1/slack/agent/context";
import SlackEventHandler from "@/app/api/v1/slack/agent/slack-event-handler";
import { SlackEventPayload } from "@/app/api/v1/slack/agent/types";

const handleSlackEvent = inngest.createFunction(
  { id: "handle-slack-event" },
  { event: "slack/event" },
  async ({ event, step }) => {
    const payload = event.data;

    if (!payload) {
      throw new Error("Missing payload in event data");
    }

    await step.run("process-slack-event", async () => {
      const ctx = new SlackContext(payload as SlackEventPayload<"message">);
      await ctx.initialize();
      const handler = new SlackEventHandler(ctx);

      try {
        await handler.handleEvents();
      } catch (error) {
        throw error;
      }
    });
  },
);

export default [handleSlackEvent];
