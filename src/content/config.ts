import { z, defineCollection } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    language: z.enum(["en", "nl"]),
    image: z.string(),
  }),
});

export const collections = {
  blog,
};
