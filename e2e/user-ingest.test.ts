import { shortest } from "@antiwork/shortest";
import { faker } from "@faker-js/faker";
import { type APIRequestContext } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

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

shortest("Successfully ingest a user", async ({ page }) => {
  const userData = {
    clientId: `user_${faker.string.nanoid(3)}`,
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    clientUrl: faker.internet.url(),
    stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
    protected: faker.datatype.boolean(),
  };

  const response = await apiContext!.post(`/api/v1/ingest/user`, {
    data: userData,
  });
  expect(response.ok()).toBeTruthy();
  const responseData = await response.json();
  expect(responseData.message).toBe("Success");

  // Verify user appears in dashboard
  await page.goto(frontendUrl + "/dashboard/users", { waitUntil: "networkidle" });
  await page.waitForSelector("table tbody");
  const userRow = page.locator("table tbody tr").filter({ hasText: userData.email }).first();
  expect(await userRow.isVisible()).toBeTruthy();
});

shortest("Fail to ingest user with invalid API key", async ({ playwright }) => {
  const invalidContext = await playwright.request.newContext({
    extraHTTPHeaders: {
      Authorization: `Bearer invalid_key`,
    },
  });

  const response = await invalidContext.post(`/api/v1/ingest/user`, {
    data: {
      clientId: `user_${faker.string.nanoid(3)}`,
      name: faker.person.fullName(),
    },
  });
  expect(response.status()).toBe(401);
  const data = await response.json();
  expect(data.error.message).toBe("Invalid API key");
});

shortest("Fail to ingest user with invalid data", async () => {
  const response = await apiContext!.post(`/api/v1/ingest/user`, {
    data: {
      // Missing required clientId
      name: faker.person.fullName(),
      clientUrl: "not-a-url", // Invalid URL format
    },
  });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error.message).toContain("clientId");
});

shortest.afterAll(async ({ page }) => {
  await page.goto(frontendUrl + "/dashboard/developer");
  const menuButtons = page.getByRole("button").filter({ hasText: "open menu" });
  await menuButtons.last().click();

  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").waitFor();
  await page.locator('[role="alertdialog"] button:has-text("Delete")').click();

  await page.waitForTimeout(1000);
});
