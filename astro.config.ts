import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://alsoft.nl",
  scopedStyleStrategy: "class",
  prefetch: true,
  // Astro 7 defaults to "jsx", which drops the spaces between inline elements ("midnight.I've")
  compressHTML: true,
  integrations: [sitemap(), react()],
  i18n: {
    locales: ["en", "nl"],
    defaultLocale: "en",
  },
});
