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
  { name: "tool-impedance", path: "/tools/impedance/", fullPage: true },
  { name: "tool-impedance-nl", path: "/nl/tools/impedance/", fullPage: true },
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
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    // instant: the site scrolls smoothly, and a capture taken mid-scroll is a different picture
    window.scrollTo({ top: 0, behavior: "instant" });

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
    // and decoded: a big AVIF can be complete but not yet painted, so two full-page captures differ
    await Promise.all(images.map((img) => img.decode().catch(() => null)));
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
}

for (const { name, path, fullPage } of pages) {
  test(`${name} renders cleanly`, async ({ page }) => {
    const errors = trackErrors(page);
    await loadFully(page, path);
    if (name.startsWith("tool-impedance")) {
      // the solver's answer (and the loss behind it) changes what is on the page: capture after it
      await expect(page.getByTestId("zdiff")).toContainText("Ω");
      await expect(page.getByTestId("loss")).not.toHaveText("–");
    }

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
      // a long image-led page needs two full-page captures that agree, which takes longer than the default 5 s
      timeout: 30_000,
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

// The impedance calculator runs the field solver as WebAssembly. The numbers below are the native solver's
// (mesh 4, the calculator's setting) for the same geometry; the module is proven equal to it digit for digit.
test("impedance calculator matches the native solver", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/tools/impedance/");
  await expect(page.getByTestId("zdiff")).toContainText("Ω"); // the default pair, solved

  // bare copper, no mask: the case where the closed-form formula reads low
  await page.getByLabel("Solder mask over the trace").uncheck();
  await expect(page.getByTestId("zdiff")).toHaveText("103.6 Ω");
  await expect(page.getByTestId("zeven")).toHaveText("82.2 Ω");
  await expect(page.getByTestId("zodd")).toHaveText("51.8 Ω");
  await expect(page.getByTestId("zcm")).toHaveText("41.1 Ω");
  await expect(page.getByTestId("closed-value")).toHaveText("99.3 Ω");
  await expect(page.getByTestId("compare")).toContainText("4.1 % lower");
  await expect(page.locator(".imp-meta")).toContainText(/Solved in \d+ ms/);

  // the thin-prepreg example, in mil too
  await page.getByRole("button", { name: "Thin prepreg, bare copper" }).click();
  await expect(page.getByTestId("zdiff")).toHaveText("103.9 Ω");
  await page.getByRole("button", { name: "mil", exact: true }).click();
  await expect(page.getByLabel("Trace width")).toHaveValue("5");
  await expect(page.getByTestId("zdiff")).toHaveText("103.9 Ω");
  expect(errors).toEqual([]);
});

test("impedance synthesis round-trips", async ({ page }) => {
  await page.goto("/tools/impedance/");
  await page.getByLabel("Solder mask over the trace").uncheck();
  await page.getByRole("button", { name: "Dimension for a target impedance" }).click();
  await page.getByLabel("Target impedance").fill("100");
  const found = page.getByTestId("found");
  await expect(found).toHaveText(/^0\.\d{3} mm$/);
  await expect(page.locator(".imp-hero-sub")).toContainText(/Zdiff 100\.0 Ω/);

  await page.getByRole("button", { name: /Use this trace width/ }).click();
  await expect(page.getByTestId("zdiff")).toHaveText(/^(99\.9|100\.0|100\.1) Ω$/);
});

test("impedance calculator: Dutch page and a target nobody reaches", async ({ page }) => {
  await page.goto("/nl/tools/impedance/");
  await expect(page.getByTestId("zdiff")).toContainText(/\d,\d Ω/);
  await page.getByRole("button", { name: "Afmeting voor een doelimpedantie" }).click();
  await page.getByLabel("Doelimpedantie").fill("900");
  // the solver widens its search until it knows the target is out of reach: a few seconds on a slow CI machine
  await expect(page.getByRole("alert")).toContainText("Geen enkele waarde", { timeout: 30_000 });
});

test("impedance calculator fails gracefully without the solver", async ({ page }) => {
  await page.route("**/wasm/bk-em.wasm*", (route) => route.abort());
  await page.goto("/tools/impedance/");
  await expect(page.getByRole("alert")).toContainText("could not start");
  await expect(page.getByTestId("zdiff")).toHaveText("–");
  await expect(page.locator("svg.imp-xs")).toBeVisible();
});
