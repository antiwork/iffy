import { NextResponse } from "next/server";
import SlackContext from "../agent/context";

export async function handleUrlVerification(ctx: SlackContext<"url_verification">): Promise<NextResponse> {
  const { payload } = ctx;
  const { challenge } = payload.event;
  const response = { challenge };
  return NextResponse.json(response, { status: 200 });
}
