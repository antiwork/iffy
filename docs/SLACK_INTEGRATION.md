# Slack Integration for Iffy

## Overview

The Slack integration enables the following features:

1. Suspend one or several users based on their IDs
2. Un-suspend users
3. Get information about specific users
4. Get the list of admins for the current inbox
5. Add a new admin to the current inbox
6. Remove an admin from the current inbox

All these actions can be performed by mentioning the Iffy bot in Slack after integrating into a workspace.

## Configuration

### Environment Variables

The Slack integration requires the following environment variable:

- `SLACK_SIGNING_SECRET`: The signing secret from your Slack app to verify requests
- `SLACK_CLIENT_SECRET`: The Client Secret from your Slack app used during OAuth
- `LOCAL_HOST_PROXY_URL`: Slack does not allow `localhost` redirects so you must use a proxy during development
- `NEXT_PUBLIC_SLACK_CLIENT_ID`: The client ID from your slack app to allow OAuth from within `/dashboard/settings`

### Setup Instructions

1. Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add the "bot" OAuth scope with the following permissions:

- `incoming-webhook`
- `chat:write`
- `channels:read`
- `channels:history`
- `groups:history`
- `im:history`
- `users:read`
- `users:read.email`
- `users.profile:read`

3. Install the app to your workspace and save the `Bot User OAuth Token` to your `.env.local`.
4. Spin up your proxy and update the `Redirect URLs` with your `LOCAL_HOST_PROXY_URL` adding the following paths:

- `/api/v1/oauth/callback`
- `/dashboard/settings`

5. Enable `Incoming Webhooks` from your Slack app settings.
6. Configure Event Subscriptions in your Slack app updating the `Request URL` to `LOCAL_HOST_PROXY_URL/api/v1/slack`.
7. Subscribe to the "app_mention" bot event
8. Save your changes
9. From `Basic Information` of your Slack app save to your `.env.local` the following info:

- `Signing Secret` (sensitive)
- `Client Secret` (sensitive)
- `Client ID`

## Usage

Once configured, users can interact with the Iffy agent by either of the following:

- Outside of an existing thread: Use direct mentions like `@Iffy ....`
- In an existing thread: Iffy will auto-respond to any subsequent messages sent within the thread as if they are directed towards Iffy, no mentions required.

## Agent Features

The Agent can identify a `User` using one of the following: Email, ClientId, IffyId.

The following tools are available to the agent:

- `suspendUsers`: Suspends one or several users based on their IDs with a supplied reason. (Admin only w/ Clerk OAuth)
- `unsuspendUsers`: Un-suspends users based on their IDs with a supplied reason. (Admin only w/ Clerk OAuth)

- `getUserInfo`: Returns the `User` object unfiltered. (Admin only)

- `getInboxAdmins`: Returns the list of admins for the current inbox. (Admin only)
- `addNewInboxAdmin`: Adds a new admin to the current inbox. (Admin only)
- `removeInboxAdmin`: Removes an admin from the current inbox. (Admin only)

- `getCurrentSlackChannelUsers`: Returns the list of users in the current Slack channel.

## Security

The Slack integration uses encrypted tokens and signature verification to ensure that only authorized Slack workspaces can trigger actions. The access tokens and webhook urls are encrypted.

## Implementation Details

Key components of the implementation include:

1. **API Endpoint**: `app/api/v1/slack/route.ts` handles incoming Slack events and commands
2. **Service Layer**: `services/slack.ts` contains the business logic for processing Slack commands
3. **Database**: `slackInboxes` table stores the mapping between Slack channels and Iffy organizations.
4. **UI Component**: `app/dashboard/settings/slack-settings.tsx` provides the configuration UI

## Troubleshooting

If the integration is not working as expected, check the following:

1. Ensure the `SLACK_SIGNING_SECRET` environment variable is correctly set
2. Verify that the Bot Token has the necessary scopes and permissions
3. Check that the Event Subscriptions URL is correctly configured in Slack
4. Ensure the bot is invited to the channels where it will be used
5. Ensure you have updated the `LOCAL_HOST_PROXY_URL` in `Incoming Webhooks` and `OAuth & Permissions` if your domain is ephemeral like free plan Ngrok.
