export interface CardItem {
  id: string;
  image?: ImageMetadata;
  icon?: ImageMetadata;
  /** a page of its own that tells more (path without the language) */
  page?: string;
}
