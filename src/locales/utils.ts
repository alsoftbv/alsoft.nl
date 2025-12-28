import en from "@locales/en.json";
import nl from "@locales/nl.json";
import type { GetStaticPathsItem } from "astro";

export function getTranslationPaths(): GetStaticPathsItem[] {
  return [{ params: { lang: undefined } }, { params: { lang: "nl" } }];
}

export function useTranslations(lang: string | undefined | number) {
  return lang === "nl" ? nl : en;
}
