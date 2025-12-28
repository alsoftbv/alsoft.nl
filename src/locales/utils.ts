import en from "@locales/en.json";
import nl from "@locales/nl.json";

export const i18nPaths = [
  { params: { lang: undefined } },
  { params: { lang: "nl" } },
];

export function useTranslations(lang: string | undefined) {
  return lang === "nl" ? nl : en;
}
