// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://alsoft.nl",
  scopedStyleStrategy: "class",
  prefetch: true,
  integrations: [sitemap(), react()],
  i18n: {
    locales: ["en", "nl"],
    defaultLocale: "en",
  },
});
