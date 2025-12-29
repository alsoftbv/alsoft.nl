import { tools } from "@data/tools";
import en from "@locales/en.json";
import nl from "@locales/nl.json";
import type { GetStaticPathsItem } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";

export interface ToolInformation {
  path: string;
  tool: { title: string; description: string };
}

export function getTranslationPaths(): GetStaticPathsItem[] {
  return [{ params: { lang: undefined } }, { params: { lang: "nl" } }];
}

export function getLanguage(lang: string | undefined | number): "nl" | "en" {
  return lang === "nl" ? "nl" : "en";
}

export function useTranslations(lang: string | undefined | number) {
  return lang === "nl" ? nl : en;
}

export function getPath(
  lang: string | undefined | number,
  path: string
): string {
  return getRelativeLocaleUrl(getLanguage(lang), path);
}

export function getLocalizedTools(
  lang: string | undefined | number
): ToolInformation[] {
  return Object.entries(tools)
    .filter(([path]) => {
      return lang === "nl" ? path.startsWith("nl/") : !path.startsWith("nl/");
    })
    .map(([path, tool]) => ({
      path: `/${path}`,
      tool,
    }));
}

export async function getLocalizedPosts(
  lang: string | undefined | number
): Promise<CollectionEntry<"blog">[]> {
  return (await getCollection("blog"))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .filter((p) => {
      return lang === "nl" ? p.slug.startsWith("nl") : !p.slug.startsWith("nl");
    })
    .map((p) => ({
      ...p,
      slug:
        lang === "nl"
          ? `/${p.slug.replace("nl/", "nl/blog/")}`
          : `/blog/${p.slug}`,
    }));
}
