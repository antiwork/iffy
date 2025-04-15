import { SlackEvent } from "@slack/web-api";
import { NextResponse } from "next/server";
import SlackContext from "./context";
import { SlackInbox } from "@/db/tables";
import { schema } from "@/db";

export type SupportedSlackEvents = SlackEvent["type"] | "url_verification";

type SlackEventWithUrlVerification = Pick<SlackEvent, "type"> & {
  challenge: string;
  token: string;
  type: "url_verification";
};

export type SlackEventPayload<T extends SupportedSlackEvents> = {
  type: T;
  teamId: string;
  appId: string;
  inbox?: SlackInbox;
  organization?: schema.Organization;
  event: T extends "url_verification" ? SlackEventWithUrlVerification : Omit<Extract<SlackEvent, { type: T }>, "type">;
};

export type SlackEventCallbacks<T extends SupportedSlackEvents> = {
  [K in T]: Array<(ctx: SlackContext<K>) => Promise<NextResponse>>;
};
