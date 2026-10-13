import type { Metadata } from "next";
import { BUSINESS_PHILOSOPHY_QUOTE, type PageCmsContent } from "@/lib/cms";
import { getSiteUrl } from "./env";

const ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const PORTRAIT_PATH = "/images/rahul-tanwar-portrait.jpg";

function pagePath(slug: string) {
  if (slug === "home") return "/";
  if (slug === "privacy") return "/privacy";
  return `/ventures/${slug}`;
}

/** Absolute canonical URL: the CMS value, or one derived from the page slug. */
function canonicalFor(content: PageCmsContent, siteUrl: string) {
  return content.canonicalUrl || `${siteUrl}${pagePath(content.slug)}`;
}

/**
 * Absolute founder image for JSON-LD. The default founder image is a hashed build asset
 * (/_next/static/...), which must not leak into structured data, so only an absolute https URL
 * or a stable root-relative /images/ or /assets/ path from the CMS overrides the portrait.
 */
function founderImage(content: PageCmsContent, siteUrl: string) {
  const url = content.images.founder?.url;
  if (typeof url === "string") {
    if (/^https:\/\//i.test(url)) return url;
    if (url.startsWith("/images/") || url.startsWith("/assets/")) return `${siteUrl}${url}`;
  }
  return `${siteUrl}${PORTRAIT_PATH}`;
}

export function buildMetadata(content: PageCmsContent, siteUrl = getSiteUrl()): Metadata {
  const canonical = canonicalFor(content, siteUrl);
  const title = content.metaTitle || content.pageTitle;
  const ogTitle = content.ogTitle || title;
  const ogDescription = content.ogDescription || content.metaDescription;
  const ogImage = content.ogImage || `${siteUrl}${PORTRAIT_PATH}`;
  const twitterImage = content.twitterImage || ogImage;
  return {
    title: { absolute: title },
    description: content.metaDescription,
    alternates: { canonical },
    robots: ROBOTS,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: content.ogUrl || canonical,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: content.twitterTitle || ogTitle,
      description: content.twitterDescription || ogDescription,
      images: [twitterImage],
    },
  };
}

export function buildJsonLd(content: PageCmsContent, siteUrl = getSiteUrl()) {
  const isHome = content.slug === "home";
  const pageUrl = canonicalFor(content, siteUrl);
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Person",
      "@id": personId,
      name: "Rahul Tanwar",
      url: `${siteUrl}/`,
      image: founderImage(content, siteUrl),
      jobTitle: "Founder and Entrepreneur",
      description:
        "Dubai-based multi-industry founder building ventures across gaming, beverages, apparel and manufacturing in the UAE and India.",
      sameAs: [content.socialLinks.linkedin].filter(
        (url): url is string => typeof url === "string" && url.startsWith("https://"),
      ),
      knowsAbout: [
        "Entrepreneurship",
        "Gaming",
        "Consumer brands",
        "Apparel",
        "Textile manufacturing",
        "UAE and India business",
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${siteUrl}/`,
      name: "Rahul Tanwar",
      inLanguage: "en",
      publisher: { "@id": personId },
    },
    {
      "@type": isHome ? "ProfilePage" : "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: content.metaTitle || content.pageTitle,
      description: content.metaDescription,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      mainEntity: isHome ? { "@id": personId } : undefined,
      inLanguage: "en",
      dateModified: content.updatedAt,
    },
  ];

  if (isHome) {
    graph.push({
      "@type": "Quotation",
      text: BUSINESS_PHILOSOPHY_QUOTE,
      spokenByCharacter: {
        "@type": "Person",
        name: "Rahul Tanwar",
        jobTitle: "Founder and Entrepreneur",
        url: siteUrl,
        worksFor: { "@type": "Organization", name: "Rahul Tanwar Ventures" },
      },
    });
  } else {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: content.pageTitle.split(/[|—-]/)[0].trim(),
          item: pageUrl,
        },
      ],
    });
  }

  graph.push(...(content.jsonLd || []));
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
