import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

async function openApp(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.locator('[data-hydrated="true"]').waitFor();
}

async function navigate(
  page: import("@playwright/test").Page,
  destination: string,
) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: destination, exact: true }).click();
}

test("creates, compares, approves and runs a scripted procurement", async ({
  page,
}) => {
  await openApp(page);
  await expect(
    page.getByRole("heading", {
      name: "Describe the outcome. We coordinate the work.",
    }),
  ).toBeVisible();
  await navigate(page, "New Task");
  await expect(
    page.getByRole("heading", { name: "What should ProcurePilot deliver?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate procurement plan" }).click();
  await expect(page.getByText("PROPOSED PROCUREMENT PLAN")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByText("Why this provider ranked first").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve plan" }).click();
  await expect(
    page.getByRole("button", { name: "Run simulated procurement" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run simulated procurement" }).click();
  await expect(page.getByText("FINAL DELIVERABLE")).toBeVisible({
    timeout: 15_000,
  });
  await navigate(page, "Payments");
  await expect(page.getByText("Simulation boundary active")).toBeVisible();
});

test("budget-exceeded scenario cannot be approved", async ({ page }) => {
  await openApp(page);
  await navigate(page, "New Task");
  await page.getByRole("button", { name: "Budget exceeded" }).click();
  await page.getByRole("button", { name: "Generate procurement plan" }).click();
  await expect(page.getByText("BUDGET BLOCKED")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve plan" }),
  ).toBeDisabled();
});

test("provider profiles, reputation and audit export are inspectable", async ({
  page,
}) => {
  await openApp(page);
  await navigate(page, "Provider Market");
  await expect(page.getByText("Compare specialist agents")).toBeVisible();
  const profileButtons = page.getByRole("button", { name: "View profile" });
  await profileButtons.first().click();
  await expect(page.getByText("Raw technical information")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await navigate(page, "Reputation");
  await expect(page.getByText("Registration not configured")).toBeVisible();
  await navigate(page, "Audit Trail");
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
});

test("mobile navigation remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await navigate(page, "Integrations");
  await expect(
    page.getByText("Configuration is not the same as proof"),
  ).toBeVisible();
});
