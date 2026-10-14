import type { PageCmsContent } from "@/lib/cms";

export type SiteLink = { label: string; href: string; external?: boolean };

const NAV_FALLBACK: SiteLink[] = [
  { label: "Ventures", href: "#ventures" },
  { label: "About", href: "#about" },
  { label: "Philosophy", href: "#philosophy" },
];
const LINKEDIN_FALLBACK = "https://www.linkedin.com/in/rahul-tanwar-350a13279/";
const EMAIL_FALLBACK = "hello@rahultanwar.com";

/** On inner pages an in-page anchor has to point back at the homepage. */
export function localHref(href: string, inner = false) {
  return inner && href.startsWith("#") ? `/${href}` : href;
}

export function linkedinUrl(content?: PageCmsContent) {
  const url = content?.socialLinks.linkedin;
  return url?.startsWith("https://") ? url : LINKEDIN_FALLBACK;
}

export function contactEmail(content?: PageCmsContent) {
  return content?.contactEmail || EMAIL_FALLBACK;
}

/** Site navigation: the CMS header links (contact has its own slot), or the default three. */
export function navLinks(content?: PageCmsContent, inner = false): SiteLink[] {
  const links = content?.header.links?.length
    ? content.header.links
        .filter((item) => item.href !== "#contact" && item.href !== "/#contact")
        .slice(0, 4)
    : NAV_FALLBACK;
  return links.map((item) => ({ label: item.label, href: localHref(item.href, inner) }));
}

export function contactLinks(content?: PageCmsContent, inner = false): SiteLink[] {
  return [
    { label: "LinkedIn", href: linkedinUrl(content), external: true },
    { label: "Email", href: `mailto:${contactEmail(content)}` },
    {
      label: content?.header.ctaText || "Get in touch",
      href: localHref(content?.header.ctaLink || "#contact", inner),
    },
  ];
}
