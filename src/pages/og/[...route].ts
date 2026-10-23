import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";
import { tools } from "@data/tools";
import { certificates } from "@data/certificates";

const posts = await getCollection("blog");

const blogPages = Object.fromEntries(posts.map(({ id, data }) => [id, data]));

const certificatePages = Object.fromEntries(
  certificates.map((cert) => [
    `certificate/${cert.id}`,
    {
      title: "Certificate of Completion",
      description: `${cert.name}, Software Engineering in Practice`,
    },
  ]),
);

const pages = {
  ...blogPages,
  ...tools,
  ...certificatePages,
};

export const { getStaticPaths, GET } = await OGImageRoute({
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
