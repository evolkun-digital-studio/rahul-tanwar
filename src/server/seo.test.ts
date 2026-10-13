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

describe("buildJsonLd", () => {
  it("home is a ProfilePage with a Quotation and no breadcrumb", () => {
    const graph = (buildJsonLd(defaultHomeContent) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("ProfilePage");
    expect(types).toContain("Quotation");
    expect(types).not.toContain("BreadcrumbList");
  });
  it("inner pages get a WebPage and a BreadcrumbList", () => {
    const graph = (buildJsonLd(defaultPrivacyContent) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
  });
  it("only keeps https social links in sameAs", () => {
    const content = mergeContent(defaultHomeContent, { socialLinks: { linkedin: "javascript:alert(1)" } });
    const person = (buildJsonLd(content) as { "@graph": Array<Record<string, unknown>> })["@graph"].find(
      (n) => n["@type"] === "Person",
    );
    expect(person?.sameAs).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("cannot be broken out of a script tag", () => {
    const hostile = { name: "</script><script>alert(1)</script>", sep: "a\u2028b\u2029c", q: '"quoted"' };
    const out = serializeJsonLd(hostile);
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<");
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(JSON.parse(out)).toEqual(hostile);
  });
});
