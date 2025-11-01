// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  scopedStyleStrategy: "class",
  prefetch: true,
  integrations: [sitemap()],
});
