// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://alsoft.nl",
  scopedStyleStrategy: "class",
  prefetch: true,
  integrations: [sitemap()],
  i18n: {
    locales: ["en", "nl"],
    defaultLocale: "en",
  },
});
