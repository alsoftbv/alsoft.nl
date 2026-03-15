import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

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
