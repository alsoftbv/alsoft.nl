import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";
import { tools } from "@data/tools";

const posts = await getCollection("blog");

const blogPages = Object.fromEntries(
  posts.map(({ slug, data }) => [slug, data]),
);

const pages = {
  ...blogPages,
  ...tools,
};

export const { getStaticPaths, GET } = OGImageRoute({
  param: "route",
  pages: pages,

  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[0, 0, 0]],
    logo: {
      path: "./src/images/logo-128.png",
      size: [128, 128],
    },
    font: {
      title: {
        families: ["Inter"],
        size: 64,
        lineHeight: 1.1,
        weight: "Bold",
      },
      description: {
        families: ["Inter"],
      },
    },
    fonts: ["./src/fonts/Inter.ttf"],
    padding: 40,
  }),
});
