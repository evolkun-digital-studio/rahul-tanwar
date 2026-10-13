import { describe, expect, it } from "vitest";
import { PAGE_SLUGS } from "./slugs";
import { defaultHomeContent, getDefaultContent, mergeContent } from "./cms";

describe("getDefaultContent", () => {
  it("has defaults for every page slug and none for unknown ones", () => {
    for (const slug of PAGE_SLUGS) expect(getDefaultContent(slug)?.slug).toBe(slug);
    expect(getDefaultContent("nope")).toBeUndefined();
    expect(getDefaultContent("__proto__")).toBeUndefined();
  });
});

describe("mergeContent", () => {
  it("overrides fields and deep-merges header, images, socialLinks, sections", () => {
    const merged = mergeContent(defaultHomeContent, {
      pageTitle: "CMS title",
      header: { brand: "CMS brand" } as never,
      socialLinks: { whatsapp: "wa" },
    });
    expect(merged.pageTitle).toBe("CMS title");
    expect(merged.header.brand).toBe("CMS brand");
    expect(merged.header.links).toEqual(defaultHomeContent.header.links);
    expect(merged.socialLinks.linkedin).toBe(defaultHomeContent.socialLinks.linkedin);
    expect(merged.socialLinks.whatsapp).toBe("wa");
  });
  it("returns the defaults when there is no CMS page", () => {
    expect(mergeContent(defaultHomeContent, undefined)).toEqual(defaultHomeContent);
    expect(mergeContent(defaultHomeContent, null as never)).toEqual(defaultHomeContent);
  });
});
