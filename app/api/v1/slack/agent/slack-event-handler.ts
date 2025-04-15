"use server";
import { NextResponse } from "next/server";
import { SupportedSlackEvents } from "./types";
import { slackCallbacks } from "./event-callbacks";
import SlackContext from "./context";

class SlackEventHandler<T extends SupportedSlackEvents = SupportedSlackEvents> {
  private ctx: SlackContext<T>;

  constructor(ctx: SlackContext<T>) {
    this.ctx = ctx;
  }

  async handleEvents(): Promise<NextResponse> {
    console.log(`Handling Slack event: ${this.ctx.eventName}`);
    const { eventName } = this.ctx;
    const callbacks = slackCallbacks[eventName] || [];

    if (callbacks.length === 0) {
      console.warn(`No callbacks found for event: ${eventName}`);
      return NextResponse.json({ message: "No callbacks found for this event" }, { status: 404 });
    }

    const promises = await Promise.allSettled(callbacks.map((callback) => callback(this.ctx)));

    const fulfilled = promises.find((result) => result.status === "fulfilled");
    const rejected = promises.find((result) => result.status === "rejected");

    if (fulfilled && fulfilled.value) {
      console.log(`Event handled successfully: ${eventName}`);
      return fulfilled.value;
    } else if (rejected && rejected.reason) {
      console.error("Event handling failed:", rejected.reason);
      return NextResponse.json({ message: "Event handling failed" }, { status: 500 });
    }

    return NextResponse.json({ message: "No events processed" }, { status: 204 });
  }
}

export default SlackEventHandler;
