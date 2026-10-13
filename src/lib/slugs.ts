export const VENTURE_SLUGS = [
  "sr18-gaming",
  "delhi-6",
  "volt-50000",
  "masai",
  "adatto",
  "arnika-textiles",
] as const;

export const PAGE_SLUGS = ["home", "privacy", ...VENTURE_SLUGS] as const;

export function isPageSlug(value: string): value is (typeof PAGE_SLUGS)[number] {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}
