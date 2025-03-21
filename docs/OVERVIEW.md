This codebase represents a content moderation system called "Iffy," designed to help platforms manage and filter unwanted content. It offers automated moderation, user appeals, detailed analytics, and developer tools. Here's a breakdown of its major components and architecture:

**Purpose:**

Iffy aims to automate the content moderation process, reducing the need for manual review while providing tools for user engagement and appeals. It uses a combination of predefined rules, custom rules, and AI-powered analysis to identify and flag potentially inappropriate content.

**Architecture:**

The system is built with Next.js, uses Drizzle ORM for database interactions (PostgreSQL), and leverages Inngest for asynchronous task processing. It integrates with Clerk for authentication and organization management, OpenAI for AI-powered moderation, and optionally with Resend for email notifications and Stripe for payment control of connected accounts.

**Major Components:**

1. **API Routes (`app/api`):** Handles incoming moderation requests, manages API keys, and interacts with the TRPC server. This is the primary interface for external systems to interact with Iffy. Versioned API is available under `/api/v1`. Separate endpoint `/api/inngest` accepts asynchronous tasks from Inngest. TRPC API is used for client-side dashboard functionality.

2. **Dashboard (`app/dashboard`):** Provides a web interface for managing moderations, users, rules, analytics, and settings. It allows administrators to review flagged content, take action on user accounts, configure moderation rules, monitor moderation activity, and manage API keys and webhooks. The dashboard is further broken down into sections:

   - `analytics`: Displays moderation statistics and trends.
   - `developer`: Manages API keys, webhooks, and other developer settings.
   - `emails`: Customizes email templates for user notifications (suspension, ban, compliance).
   - `inbox`: Manages user appeals.
   - `moderations`: Lists and filters moderation records.
   - `records`: Displays details about individual records and their moderation history.
   - `rules`: Allows the creation and management of custom moderation rules and presets.
   - `settings`: Configures global settings like email notifications, test mode, appeals, and moderation percentage.
   - `users`: Manages user accounts and their associated data.
   - `subscription`: Manages the subscription for the organization.

3. **Inngest Functions (`inngest/functions`):** Defines background tasks processed by the Inngest platform. These functions handle asynchronous operations like updating user statuses after moderation, sending webhooks, refreshing analytics views, and performing automated actions.

4. **Services (`services`):** Contains reusable logic for various tasks, including:

   - `api-keys`: Manages the creation, validation, and deletion of API keys.
   - `appeal-actions`: Handles actions related to user appeals.
   - `appeals`: Manages the creation and validation of appeals.
   - `email`: Sends email notifications using Resend.
   - `encrypt`: Handles encryption and decryption of sensitive data.
   - `messages`: Manages messages between users and administrators.
   - `moderations`: Core logic for content moderation, including interacting with OpenAI and applying rules.
   - `organizations`: Manages organization-level settings.
   - `records`: Manages the creation, updating, and deletion of records.
   - `rules`: Manages moderation rules and presets.
   - `ruleset`: Manages rulesets.
   - `stripe/accounts`: Manages Stripe connected accounts on behalf of customers (uses Stripe API key from customer)
   - `stripe/subscriptions`: Manages Stripe subscriptions
   - `stripe/usage`: Records and reports per-customer organization usage
   - `url-moderation`: Extracts URLs from text and fetches page data for analysis.
   - `user-actions`: Manages actions taken on user accounts (e.g., suspension, ban).
   - `webhook`: Sends webhook notifications to external systems.

5. **Strategies (`strategies`):** Defines different moderation strategies, including:

   - `blocklist`: Checks content against a list of blocked words and phrases.
   - `openai`: Uses OpenAI's moderation API to analyze content.
   - `prompt`: Uses OpenAI's language models to evaluate content based on custom prompts.

6. **Database (`db`):** Defines the database schema, relations, and views using Drizzle ORM. Includes seeding scripts for populating the database with sample data.

7. **Emails (`emails`):** Contains email templates and rendering logic for user notifications.

8. **Components (`components`):** Reusable UI components for the dashboard and other parts of the application.

9. **Hooks (`hooks`):** Custom React hooks for managing application state and logic.

10. **UI Components (`components/ui`):** A set of reusable UI components based on Radix UI and Tailwind CSS.

11. **End-to-End Tests (`e2e`):** Automated tests using Playwright and Shortest.

This structure allows for a clear separation of concerns and makes the codebase easier to maintain and extend. The use of Inngest enables efficient handling of asynchronous tasks, while the combination of rules and AI provides a flexible and powerful content moderation system.
