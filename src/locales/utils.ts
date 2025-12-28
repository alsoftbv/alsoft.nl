import en from "@locales/en.json";
import nl from "@locales/nl.json";
import type { GetStaticPathsItem } from "astro";
import { getRelativeLocaleUrl } from "astro:i18n";

export function getTranslationPaths(): GetStaticPathsItem[] {
  return [{ params: { lang: undefined } }, { params: { lang: "nl" } }];
}

export function useTranslations(lang: string | undefined | number) {
  return lang === "nl" ? nl : en;
}

export function getPath(
  lang: string | number | undefined,
  path: string
): string {
  return getRelativeLocaleUrl(lang === "nl" ? "nl" : "en", path);
}
