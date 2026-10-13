import { describe, expect, it } from "vitest";
import { defaultHomeContent, defaultPrivacyContent, mergeContent } from "@/lib/cms";
import { buildJsonLd, buildMetadata, serializeJsonLd } from "./seo";

describe("buildMetadata", () => {
  it("maps title, description, canonical, OG and Twitter", () => {
    const m = buildMetadata(defaultHomeContent);
    expect(m.title).toEqual({ absolute: defaultHomeContent.metaTitle });
    expect(m.description).toBe(defaultHomeContent.metaDescription);
    expect(m.alternates?.canonical).toBe(defaultHomeContent.canonicalUrl);
    expect(m.openGraph).toMatchObject({ title: defaultHomeContent.ogTitle, type: "website" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.robots).toContain("max-image-preview:large");
  });
  it("falls back to pageTitle when metaTitle is empty", () => {
    const m = buildMetadata({ ...defaultHomeContent, metaTitle: "" });
    expect(m.title).toEqual({ absolute: defaultHomeContent.pageTitle });
  });
});

describe("buildMetadata fallbacks", () => {
  const SITE = "https://rahultanwar.com";
  it("falls back to the portrait for og:image / twitter:image when ogImage is empty", () => {
    const m = buildMetadata({ ...defaultPrivacyContent, ogImage: "", twitterImage: "" }, SITE);
    expect(m.openGraph?.images).toEqual([`${SITE}/images/rahul-tanwar-portrait.jpg`]);
    expect(m.twitter?.images).toEqual([`${SITE}/images/rahul-tanwar-portrait.jpg`]);
  });
  it("keeps an explicit ogImage and derives twitter image from it", () => {
    const m = buildMetadata(
      { ...defaultHomeContent, ogImage: "https://cdn.example.com/og.png", twitterImage: "" },
      SITE,
    );
    expect(m.openGraph?.images).toEqual(["https://cdn.example.com/og.png"]);
    expect(m.twitter?.images).toEqual(["https://cdn.example.com/og.png"]);
  });
  it("derives the canonical URL from the slug when canonicalUrl is empty", () => {
    const canonical = (slug: string) =>
      buildMetadata({ ...defaultHomeContent, slug, canonicalUrl: "", ogUrl: "" }, SITE).alternates
        ?.canonical;
    expect(canonical("home")).toBe(`${SITE}/`);
    expect(canonical("privacy")).toBe(`${SITE}/privacy`);
    expect(canonical("masai")).toBe(`${SITE}/ventures/masai`);
    const m = buildMetadata(
      { ...defaultHomeContent, slug: "masai", canonicalUrl: "", ogUrl: "" },
      SITE,
    );
    expect(m.openGraph?.url).toBe(`${SITE}/ventures/masai`);
  });
});

describe("buildJsonLd", () => {
  const SITE = "https://rahultanwar.com";
  const person = (content: Parameters<typeof buildJsonLd>[0]) =>
    (buildJsonLd(content, SITE) as { "@graph": Array<Record<string, unknown>> })["@graph"].find(
      (n) => n["@type"] === "Person",
    );
  it("default content gives the absolute portrait URL and never leaks a hashed build asset", () => {
    expect(person(defaultHomeContent)?.image).toBe(`${SITE}/images/rahul-tanwar-portrait.jpg`);
    expect(String(person(defaultHomeContent)?.image)).not.toContain("/_next/");
  });
  it("keeps an absolute CMS-provided founder image", () => {
    const content = mergeContent(defaultHomeContent, {
      images: { founder: { url: "https://cdn.example.com/me.png", alt: "me" } },
    });
    expect(person(content)?.image).toBe("https://cdn.example.com/me.png");
  });
  it("resolves root-relative /images/ and /assets/ founder images against the site URL", () => {
    for (const url of ["/images/me.png", "/assets/me.png"]) {
      const content = mergeContent(defaultHomeContent, { images: { founder: { url, alt: "me" } } });
      expect(person(content)?.image).toBe(`${SITE}${url}`);
    }
  });
  it("ignores a hashed /_next/static founder URL from content", () => {
    const content = mergeContent(defaultHomeContent, {
      images: { founder: { url: "/_next/static/media/founder-provided.abc123.png", alt: "me" } },
    });
    expect(person(content)?.image).toBe(`${SITE}/images/rahul-tanwar-portrait.jpg`);
  });
  it("uses a slug-derived page URL when canonicalUrl is empty", () => {
    const graph = (
      buildJsonLd({ ...defaultPrivacyContent, canonicalUrl: "" }, SITE) as {
        "@graph": Array<Record<string, unknown>>;
      }
    )["@graph"];
    expect(graph.find((n) => n["@type"] === "WebPage")?.url).toBe(`${SITE}/privacy`);
  });
  it("home is a ProfilePage with a Quotation and no breadcrumb", () => {
    const graph = (buildJsonLd(defaultHomeContent) as { "@graph": Array<Record<string, unknown>> })[
      "@graph"
    ];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("ProfilePage");
    expect(types).toContain("Quotation");
    expect(types).not.toContain("BreadcrumbList");
  });
  it("inner pages get a WebPage and a BreadcrumbList", () => {
    const graph = (
      buildJsonLd(defaultPrivacyContent) as { "@graph": Array<Record<string, unknown>> }
    )["@graph"];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
  });
  it("only keeps https social links in sameAs", () => {
    const content = mergeContent(defaultHomeContent, {
      socialLinks: { linkedin: "javascript:alert(1)" },
    });
    const person = (buildJsonLd(content) as { "@graph": Array<Record<string, unknown>> })[
      "@graph"
    ].find((n) => n["@type"] === "Person");
    expect(person?.sameAs).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("cannot be broken out of a script tag", () => {
    const hostile = {
      name: "</script><script>alert(1)</script>",
      sep: "a\u2028b\u2029c",
      q: '"quoted"',
    };
    const out = serializeJsonLd(hostile);
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<");
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(JSON.parse(out)).toEqual(hostile);
  });
});
