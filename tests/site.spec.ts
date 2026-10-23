import { expect, test, type Page } from "@playwright/test";

// Pages checked on every release, in both viewports
const pages = [
  { name: "home", path: "/", fullPage: true },
  { name: "home-nl", path: "/nl/" },
  { name: "services", path: "/services/", fullPage: true },
  { name: "services-nl", path: "/nl/services/" },
  { name: "hardware", path: "/hardware/", fullPage: true },
  { name: "hardware-nl", path: "/nl/hardware/" },
  { name: "industries", path: "/industries/" },
  { name: "contact", path: "/contact/" },
  { name: "blog", path: "/blog/" },
  { name: "blog-cra", path: "/blog/cra/" },
  { name: "blog-ab-updates-nl", path: "/nl/blog/ab-updates/" },
  { name: "tools", path: "/tools/" },
  { name: "tool-cra-check", path: "/tools/cra-check/" },
  { name: "tool-sbom", path: "/tools/sbom/" },
  { name: "tool-websocket", path: "/tools/websocket/" },
  { name: "tool-sfont", path: "/tools/sfont/" },
  { name: "not-found", path: "/this-page-does-not-exist/" },
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

async function loadFully(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(async () => {
    // Scroll through the page so lazy images load, then return to the top
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);

    // Load every image now, so broken ones are caught and screenshots are complete
    const images = [...document.images];
    images.forEach((img) => (img.loading = "eager"));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
      )
    );
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
}

for (const { name, path, fullPage } of pages) {
  test(`${name} renders cleanly`, async ({ page }) => {
    const errors = trackErrors(page);
    await loadFully(page, path);

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImages: [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src),
      emDash: document.body.innerText.includes("—"),
    }));

    // 404 pages log a failed request for the page itself
    const relevant = name === "not-found" ? [] : errors;
    expect(relevant, "console errors").toEqual([]);
    expect(layout.overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
    expect(layout.brokenImages, "broken images").toEqual([]);
    expect(layout.emDash, "em dash in page text").toBe(false);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage,
      mask: [page.locator(".legal")],
    });
  });
}

test("CRA self-check scores answers and lists gaps", async ({ page }) => {
  await page.goto("/tools/cra-check/");
  const questions = page.locator("fieldset");
  await expect(questions).toHaveCount(15);

  for (const question of await questions.all()) {
    await question.getByText("Yes", { exact: true }).click();
  }
  await expect(page.locator(".cra-score")).toContainText("100%");
  await expect(page.locator(".cra-gaps li")).toHaveCount(0);

  await questions.first().getByText("No", { exact: true }).click();
  await expect(page.locator(".cra-gaps.critical li")).toHaveCount(1);
  await expect(page.locator(".cra-score")).not.toContainText("100%");

  // Answers survive a reload
  await page.reload();
  await expect(page.locator(".cra-gaps.critical li")).toHaveCount(1);
});

test("SBOM viewer parses the example and rejects bad input", async ({
  page,
}) => {
  await page.goto("/tools/sbom/");
  await page.getByRole("button", { name: "Load example" }).click();

  const tiles = page.locator(".sbom-tile");
  await expect(tiles.nth(0)).toContainText("7");
  await expect(page.locator("tbody tr")).toHaveCount(7);

  await page.getByLabel("Only show components with gaps").check();
  await expect(page.locator("tbody tr")).toHaveCount(4);

  await page.locator("#sbom-text").fill("{ not json");
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("alert")).toHaveText("That isn’t valid JSON.");
});

test("pages link their translation", async ({ page }) => {
  await page.goto("/services/");
  await expect(page.locator('link[rel="alternate"][hreflang="nl"]')).toHaveAttribute(
    "href",
    "https://alsoft.nl/nl/services/"
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://alsoft.nl/services/"
  );
});
