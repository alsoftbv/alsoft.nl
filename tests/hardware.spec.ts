import { expect, test } from "@playwright/test";

for (const { path, contact, copy } of [
  {
    path: "/hardware/",
    contact: "/contact/",
    copy: {
      built: /first prototypes built and tested/,
      result: /first prototypes worked on the first spin/,
      stale: /in manufacturing|Measuring the real edge on the first boards will/,
      price: "Price on request.",
      concept: "Idea to concept and offer",
      timing: "Within an agreed time",
      deliverables: [/block diagram/i, /checked schematic/i, /3D renders/, /Firmware emulated against the circuit/, /priced offer.*open questions/],
      report: [/grouped by severity/, /check behind each/, /board map/i, /close-ups/, /EMC maps/, /what was not checked and why/],
      targets: /5 microcontroller families and 2 Raspberry Pi generations/,
      linux: /boot Linux to a shell, with userspace GPIO reaching the board model/,
      note: /34-page report/,
    },
  },
  {
    path: "/nl/hardware/",
    contact: "/nl/contact/",
    copy: {
      built: /eerste prototypes zijn gebouwd en getest/,
      result: /eerste prototypes werkten in één keer/,
      stale: /in productie bij JLCPCB|Een meting van de echte flank op de eerste boards maakt/,
      price: "Prijs op aanvraag.",
      concept: "Van idee tot concept en offerte",
      timing: "Binnen een afgesproken termijn",
      deliverables: [/blokschema/i, /gecontroleerd schema/i, /3D-renders/, /Firmware geëmuleerd tegen het circuit/, /offerte met prijs.*open vragen/],
      report: [/gegroepeerd naar ernst/, /onderliggende controle/, /overzicht van het board/, /detailbeelden/, /EMC-kaarten/, /wat niet is gecontroleerd en waarom/],
      targets: /5 microcontrollerfamilies en 2 Raspberry Pi-generaties/,
      linux: /starten Linux op tot een shell, met GPIO vanuit userspace verbonden met het boardmodel/,
      note: /34 pagina/,
    },
  },
]) {
  test(`${path} leads with prototype proof and offers five services`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(".hero-proof")).toContainText(copy.result);
    await expect(page.locator("#case .case-head")).toContainText(copy.built);
    await expect(page.locator("#case .case-head")).toContainText(copy.result);
    await expect(page.locator("main")).not.toContainText(copy.stale);
    expect(await page.locator("#case").evaluate((section) =>
      Boolean(section.compareDocumentPosition(document.querySelector(".intro")!) & Node.DOCUMENT_POSITION_FOLLOWING)
    )).toBe(true);

    const entries = page.locator(".toc a");
    await expect(entries).toHaveCount(5);
    for (const entry of await entries.all()) {
      const section = page.locator((await entry.getAttribute("href"))!);
      await expect(section.getByRole("heading", { level: 2 })).toHaveText((await entry.innerText()).replace(/^\d+\s*/, ""));
      await expect(section.locator(".service-price")).toHaveText(copy.price);
      await expect(section.locator(".feature-text a")).toHaveAttribute("href", contact);
    }
    const ctas = await page.locator(".feature-text a").allTextContents();
    expect(new Set(ctas).size).toBe(5);
    await expect(page.locator("#concept h2")).toHaveText(copy.concept);
    await expect(page.locator("#concept")).toContainText(copy.timing);
    for (const deliverable of copy.deliverables) {
      await expect(page.locator("#concept .details")).toContainText(deliverable);
    }
    // The entry points can be followed with the keyboard as well as with a pointer.
    await entries.first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${path}#concept`);
  });

  test(`${path} explains review scope and downloads the Paper Calendar sample report`, async ({ page, request }) => {
    await page.goto(path);
    const report = page.getByRole("complementary", { name: /review report|Voorbeeldrapport/ });
    for (const detail of copy.report) {
      await expect(report).toContainText(detail);
    }
    await expect(report).toContainText(copy.note);
    await expect(report).not.toContainText("TODO");
    const previews = report.locator("figure");
    await expect(previews).toHaveCount(3);
    for (const preview of await previews.all()) {
      await expect(preview.getByRole("img")).toHaveAttribute("alt", /\S+/);
      await expect(preview.locator("figcaption")).not.toBeEmpty();
    }
    const link = report.getByRole("link", { name: /PDF/ });
    await expect(link).toHaveAttribute("href", "/hardware/sample-review.pdf");
    await expect(link).toHaveAttribute("download", "");
    await expect(link).toHaveAccessibleDescription(copy.note);
    const response = await request.get((await link.getAttribute("href"))!);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const pdf = (await response.body()).toString();
    expect(pdf).toMatch(/^%PDF-/);
    expect(pdf).not.toContain("PLACEHOLDER");
    const downloadPromise = page.waitForEvent("download");
    await link.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("sample-review.pdf");
    expect(await download.failure()).toBeNull();
  });

  test(`${path} counts MCU and Linux targets without conflating them`, async ({ page }) => {
    await page.goto(path);
    const stat = page.locator(".hero .stats li").filter({ hasText: copy.targets });
    await expect(stat.locator("strong")).toHaveText("7");
    const firmware = page.locator("#firmware .details");
    for (const target of ["ESP32-S3", "ESP32-C3", "RP2040", "i.MX RT1024 (Cortex-M7)", "AVR", "Raspberry Pi 4/CM4", "Pi 5/CM5"]) {
      await expect(firmware).toContainText(target);
    }
    await expect(firmware).toContainText(copy.linux);
  });
}
