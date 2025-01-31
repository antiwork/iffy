This document provides guidance for engineers working on the Iffy API, outlining key considerations for adding features or fixing bugs.

## Architecture Overview

The Iffy API is built with Next.js and uses API routes (`app/api`) to handle external requests. It interacts with a PostgreSQL database via Drizzle ORM and leverages Inngest for asynchronous tasks. tRPC is used for dashboard functionality but not for these endpoints.

## Key Components and Concepts

- **API Routes (`app/api/v1`):** These files define the API endpoints. Each HTTP method (POST, GET, DELETE, etc.) has a corresponding handler function.
- **Services (`services` folder):** Contain the core business logic for moderation, user management, and other API operations. API routes should delegate to these services.
- **Drizzle ORM (`db` folder):** Used for database interactions. The schema is defined in `db/schema.ts`. Always use Drizzle for database operations instead of raw SQL.
- **Inngest (`inngest` folder):** Handles asynchronous tasks triggered by events. Use Inngest functions for operations that shouldn't block the API response, such as sending emails or webhooks.
- **Strategies (`strategies` folder):** Implement different moderation approaches (e.g., blocklist, OpenAI, prompt). If adding new moderation logic, create a new strategy here.
- **Type Safety:** The project uses TypeScript. Maintain type safety and add appropriate type annotations.
- **Testing:** Write comprehensive unit tests using Vitest (in the `tests` folder) and end-to-end tests with Playwright/Shortest (in the `e2e` folder).

## Modifying or Adding API Endpoints

1. **Identify the Relevant Service:** Determine which service in the `services` directory is responsible for the functionality you are modifying or adding. For example, changes related to moderation should be made in the `services/moderations.ts` file.

2. **Update or Create API Route Handler:** Modify the existing API route handler in `app/api/v1` or create a new one if needed. Keep handler logic minimal; delegate to the appropriate service.

3. **Implement or Update the Service Logic:** Implement the new feature or bug fix within the identified service. Use Drizzle ORM for database interactions.

4. **Asynchronous Tasks:** If your changes involve asynchronous operations (e.g., sending emails), trigger an Inngest event in the service. Create or modify the corresponding Inngest function in `inngest/functions`.

5. **Error Handling:** Implement robust error handling in both the API route handler and the service. Throw appropriate errors that can be handled by the caller. The global action client in `lib/action-client.ts` shows how to handle server-side errors from actions.

6. **Testing:** Write unit tests for the modified or new service logic. Update or create end-to-end tests to cover the entire API workflow.

7. **API Versioning:** If making breaking changes, consider introducing a new API version (e.g., `/api/v2`) to maintain backward compatibility. Deprecate old endpoints in the previous version, redirecting requests or using warnings in responses.

8. **Documentation:** Update this documentation to reflect any changes to the API.

## Example: Adding a New Moderation Category

Let's say you need to add a new moderation category for "hate speech." Here's a possible approach:

1. **New Strategy:** Create a new strategy in `strategies` (e.g., `hateSpeech.ts`) implementing the `StrategyInstance` interface. This strategy will contain the logic for detecting hate speech.

2. **Update Moderation Service:** Modify `services/moderations.ts` to incorporate the new strategy. The `moderate` function should now call the new strategy and include its results in the moderation output.

3. **API Route Changes (If Needed):** If the API request body needs to change (e.g., to accept new parameters), update the corresponding API route handler in `app/api/v1`.

4. **Database Changes (If Needed):** If the new category requires storing additional data, update the database schema (`db/schema.ts`) and create a migration.

5. **Inngest Changes (If Needed):** If asynchronous tasks are involved (e.g., notifying administrators of severe hate speech violations), create or modify Inngest functions.

6. **Testing:** Write unit tests for the new strategy and update existing tests for `services/moderations.ts`. Add end-to-end tests to verify the API behavior.

7. **Documentation:** Update the API documentation to describe the new category and any API changes.

By following these steps, you can ensure consistent, high-quality API development while maintaining the project's structure and conventions. Always consider the entire system when making changes, from the user interface to the database and background tasks.
