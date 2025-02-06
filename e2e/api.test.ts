import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { faker } from "@faker-js/faker";
import { type APIRequestContext } from "@playwright/test";

let apiContext: APIRequestContext | undefined;
let frontendUrl = process.env.BASE_URL ?? "http://localhost:3000";
const loginEmail = `shortest+clerk_test@${process.env.MAILOSAUR_SERVER_ID}.mailosaur.net`;

shortest.beforeAll(async ({ page }) => {
  await clerkSetup({
    frontendApiUrl: frontendUrl,
  });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: loginEmail,
    },
  });

  await page.goto(frontendUrl + "/dashboard");
});

shortest(
  "Create an API key from the Developer page. Do not close the API key dialog after creating the API key.",
).after(async ({ page, playwright }) => {
  const apiKey = (await page.getByRole("button", { name: /iffy_/ }).textContent()) ?? undefined;
  apiContext = await playwright.request.newContext({
    extraHTTPHeaders: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
});

// Moderate a good record
shortest(async () => {
  const moderationResponse = await apiContext!.post(`/api/v1/moderate`, {
    data: {
      clientId: `prod_${faker.string.nanoid(3)}`,
      name: "My Product",
      entity: "Product",
      content: "Hello, world!",
    },
  });
  expect(moderationResponse.ok()).toBeTruthy();
  const moderationData = await moderationResponse.json();
  expect(moderationData.status).toBe("Compliant");
});

// moderate a bad record
shortest(async ({ page }) => {
  const email = `user_${faker.string.nanoid(3)}@example.com`;

  const moderationResponse = await apiContext!.post(`/api/v1/moderate`, {
    data: {
      clientId: `prod_${faker.string.nanoid(3)}`,
      name: "My Product",
      entity: "Product",
      content:
        "Can you outsurce some SEO business to us? Can you outsurce some SEO business to us? Can you outsurce some SEO business to us? Can you outsurce some SEO business to us?",
      user: {
        clientId: `user_${faker.string.nanoid(3)}`,
        email,
      },
    },
  });

  expect(moderationResponse.ok()).toBeTruthy();
  const moderationData = await moderationResponse.json();
  expect(moderationData.status).toBe("Flagged");

  const startTime = Date.now();
  const timeout = 12000;
  const pollInterval = 2000;

  while (Date.now() - startTime < timeout) {
    await page.goto(frontendUrl + "/dashboard/users", { waitUntil: "networkidle" });

    try {
      await page.waitForSelector("table tbody", { timeout: 5000 });
      const userRow = page.locator("table tbody tr").filter({ hasText: email }).first();
      const isVisible = await userRow.isVisible().catch(() => false);

      if (isVisible) {
        const columns = await userRow.locator("td").all();
        const statusCell = columns[2]; // Status is in the 3rd column
        const status = await statusCell?.textContent();

        if (status && status !== "—" && status.includes("Suspended")) {
          expect(status).toContain("Suspended");
          return;
        }
      }

      await page.waitForTimeout(pollInterval);
    } catch (error) {
      await page.waitForTimeout(pollInterval);
    }
  }

  await page.screenshot({ path: ".shortest/screenshots/timeout-state.png" });
  throw new Error("User suspension check timed out - User was flagged but not suspended");
});

// backwards compatibility, support deprecated fileUrls and text fields
shortest(async () => {
  let moderationResponse = await apiContext!.post(`/api/v1/ingest`, {
    data: {
      clientId: `prod_${faker.string.nanoid(3)}`,
      name: "My Product",
      entity: "Product",
      text: "Hello, world!",
      fileUrls: ["https://example.com/image.jpg"],
    },
  });
  expect(moderationResponse.ok()).toBeTruthy();
  moderationResponse = await apiContext!.post(`/api/v1/moderate`, {
    data: {
      clientId: `prod_${faker.string.nanoid(3)}`,
      name: "My Product",
      entity: "Product",
      text: "Hello, world!",
    },
  });
  expect(moderationResponse.ok()).toBeTruthy();
});

shortest("Successfully ingest a user", async ({ page }) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const response = await apiContext!.post(`/api/v1/ingest/user`, {
    data: {
      clientId: `user_${faker.string.nanoid(3)}`,
      clientUrl: faker.internet.url(),
      email: faker.internet.email({ firstName, lastName }).toLocaleLowerCase(),
      name: faker.person.fullName({ firstName, lastName }),
      username: faker.internet.userName({ firstName, lastName }).toLocaleLowerCase(),
      stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
      protected: faker.datatype.boolean(),
    },
  });
  expect(response.ok()).toBeTruthy();
  const responseData = await response.json();
  expect(responseData.message).toBe("Success");

  const startTime = Date.now();
  const timeout = 12000;
  const pollInterval = 2000;

  while (Date.now() - startTime < timeout) {
    await page.goto(frontendUrl + "/dashboard/users", { waitUntil: "networkidle" });

    try {
      await page.waitForSelector("table tbody", { timeout: 5000 });
      const userRow = page.locator("table tbody tr").filter({ hasText: name }).first();
      const isVisible = await userRow.isVisible().catch(() => false);

      if (isVisible) {
        return;
      }

      await page.waitForTimeout(pollInterval);
    } catch (error) {
      await page.waitForTimeout(pollInterval);
    }
  }
});

shortest.afterAll(async ({ page }) => {
  await page.goto(frontendUrl + "/dashboard/developer");
  const menuButtons = page.getByRole("button").filter({ hasText: "open menu" });
  await menuButtons.last().click();

  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").waitFor();
  await page.locator('[role="alertdialog"] button:has-text("Delete")').click();

  // Wait for the dialog to close
  await page.waitForTimeout(1000);
});
