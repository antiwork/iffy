<p align="center">
  <img src="./public/iffy-logo.png#gh-light-mode-only" alt="Iffy logo" width="128" />
  <img src="./public/iffy-logo-dark.png#gh-dark-mode-only" alt="Iffy logo" width="128" />
</p>
<p align="center">
    <a href="https://iffy.com/">iffy.com</a> |
    <a href="https://iffy.com/docs">Docs</a>
</p>

# Iffy

Intelligent content moderation at scale. Keep unwanted content off your platform without managing a team of moderators.

Features:

- **Moderation Dashboard:** View and manage all content moderation activity from a single place.
- **User Lifecycle:** Automatically suspend users with flagged content (and handle automatic compliance when moderated content is removed).
- **Appeals Management:** Handle user appeals efficiently through email notifications and a user-friendly web form.
- **Powerful Rules & Presets:** Create rules to automatically moderate content based on your unique business needs.

## Getting Started

### Dependencies

Install postgres with a username `postgres` and password `postgres`:

```bash
brew install postgresql
brew services start postgresql
createdb
psql -c "CREATE USER postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```

Install dependencies:

```bash
npm i
```

### Environment & Services

Copy `.env.example` to `.env.local`.

Generate a `FIELD_ENCRYPTION_KEY`:

```bash
npx @47ng/cloak generate | head -1 | cut -d':' -f2 | tr -d ' *'
```

Generate a `SECRET_KEY`:

```bash
openssl rand -base64 32
```

### Running locally

Set up the database, run migrations, and add seed data:

```bash
createdb iffy_development
npm run dev:db:setup
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

--

To enable public sign-ups:

```
# .env.local
ENABLE_PUBLIC_SIGNUP=true
```

To enable subscriptions and billing with Stripe:

```
# .env.local
STRIPE_API_KEY=sk_test_...
ENABLE_BILLING=true
```

<details>
<summary>Clerk</summary>

1. Go to [clerk.com](https://clerk.com) and create a new app.
1. Name the app and **disable all login methods except Email**.
1. Under "Configure > Email, phone, username", limit authentication strategies to "Email verification link" and "Email verification code". Turn on "Personal information > Name"
1. (Optional) Under "Configure > Restrictions", turn on "Sign-up mode > Restricted"
1. Under "Configure > Organization Management", turn on "Enable organizations"
1. Under "Configure > API Keys", add `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to your `.env.local` file.
1. Under "Organizations", create a new organization and add your email to the "Members" list.
1. Add the organization ID to your `.env.local` file as `SEED_CLERK_ORGANIZATION_ID`.
1. (Optional, for testing) In the Clerk dashboard, disable the "Require the same device and browser" setting to ensure tests with Mailosaur work properly.

</details>

<details>
<summary>OpenAI</summary>

1. Create an account at [openai.com](https://openai.com).
1. Create a new API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
1. Add the API key to your `.env.local` file as `OPENAI_API_KEY`.

</details>

<details>
<summary>Resend (Optional, for email notifications)</summary>

In order to send email with Iffy, you will additionally need a Resend API key.

1. Create an account at [resend.com](https://resend.com/).
1. Create and verify a new domain. Add the desired from email (e.g. `no-reply@iffy.com`) to your `.env.local` file as `RESEND_FROM_EMAIL`.
1. Add the desired from name (e.g. `Iffy`) to your `.env.local` file as `RESEND_FROM_NAME`.
1. Create a new API key at [API Keys](https://resend.com/api-keys) with at least sending permissions.
1. Add the API key to your `.env.local` file as `RESEND_API_KEY`.
</details>

<details>
<summary>Resend Audience (Optional, for customer communication)</summary>

1. Create an account at [resend.com](https://resend.com/).
1. Create a new audience (or use the default audience) at [Audiences](https://resend.com/audiences).
1. Add the audience ID to your `.env.local` file as `RESEND_AUDIENCE_ID`.
1. Create a new API key at [API Keys](https://resend.com/api-keys) with full permissions.
1. Add the API key to your `.env.local` file as `RESEND_API_KEY`.
1. Additionally, go to Clerk and create a new webhook at [Webhooks](https://clerk.com/settings/webhooks).
1. Use the URL `https://<your-app-url>/api/webhooks/clerk` for the webhook URL.
1. Subscribe to the `user.created` event.
1. Add the webhook secret to your `.env.local` file as `CLERK_WEBHOOK_SECRET`.
</details>

<details>
<summary>Shortest (Optional, for testing)</summary>

In order to write and run natural language AI tests with [Shortest](https://shortest.com), you will additionally need an Anthropic API key and a Mailosaur API key.

1. Create an account at [anthropic.com](https://www.anthropic.com/).
1. Create a new API key at [Account Settings](https://console.anthropic.com/account/keys).
1. Add the API key to your `.env.local` file as `SHORTEST_ANTHROPIC_API_KEY`.
1. Create an account at [mailosaur.com](https://mailosaur.com/app/signup).
1. Create a new Inbox/Server.
1. Go to [API Keys](https://mailosaur.com/app/keys) and create a standard key.
1. Update the environment variables:
   - `MAILOSAUR_API_KEY`: Your API key
   - `MAILOSAUR_SERVER_ID`: Your server ID

</details>

### Jobs (Optional)

To run asynchronous jobs, you will need to set up a local Inngest server. In a separate terminal, run:

```bash
npm run dev:inngest
```

## Testing

Start the development server

```bash
npm run dev
```

Start the local Inngest server (for asynchronous jobs)

```bash
npm run dev:inngest
```

Run API (unit) tests

```bash
npm run test
```

Run app (end-to-end) tests

```bash
npm run shortest
npm run shortest -- --no-cache # with arguments
```

## Iffy Cloud vs Iffy Community

You may self-host Iffy Community for free, if your business has less than 1 million USD total revenue in the prior tax year, and less than 10 million USD GMV (Gross Merchandise Value). For more details, see the [Iffy Community License 1.0](LICENSE.md).

Here are the differences between the managed, hosted [Iffy Cloud](https://iffy.com) and the free Iffy Community version.

|                    | Iffy Cloud | Iffy Community |
| ------------------ | ---------- | -------------- |
| **Infrastructure** | Easy setup. We manage everything. | You set up a server and dependent services. You are responsible for installation, maintenance, upgrades, uptime, security, and service costs. |
| **Rules/Presets**  | **9 powerful presets**: Adult content, Spam, Harassment, Non-fiat currency, Weapon components, Government services, Gambling, IPTV, and Phishing | 2 basic presets: Adult content and Spam |
