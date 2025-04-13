import { NextResponse } from "next/server";
import SlackContext from "../agent/context";

export async function handleAppUninstall(ctx: SlackContext<"app_uninstalled">): Promise<NextResponse> {
  console.log("App uninstalled event received:", ctx.payload);
  return NextResponse.json({ status: "success" }, { status: 200 });
}

export async function handleAppInstall(ctx: SlackContext<"app_installed">): Promise<NextResponse> {
  const { payload, client } = ctx;
  const { user_id, team_id, app_id, app_name, app_owner_id, event_ts, team_domain } = payload.event;
  console.log(
    `Hello! You have successfully installed the app ${app_name} (ID: ${app_id}) in team ${team_id} owned by ${app_owner_id} at ${event_ts} on ${team_domain}.`,
  );
  await client.chat.postMessage({
    channel: user_id,
    text: `Hello! You have successfully installed the app ${app_name} (ID: ${app_id}) in team ${team_id} owned by ${app_owner_id} at ${event_ts} on ${team_domain}.`,
  });

  return NextResponse.json({ status: "success" }, { status: 200 });
}
