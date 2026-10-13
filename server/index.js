import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { env, requireEnv } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { chatRouter } from "./routes/chat.js";
import { contactRouter } from "./routes/contact.js";
import { publicRouter, sitemap } from "./routes/public.js";
import { readPages } from "./lib/jsonStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

requireEnv(["ADMIN_EMAIL", "ADMIN_PASSWORD", "JWT_SECRET"]);

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/public", publicRouter);
app.use("/api/contact", contactRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);
app.get("/sitemap.xml", sitemap);

const distPath = path.resolve(__dirname, "../dist");
// Assets are static, but HTML routes must reach the renderer below so canonical
// metadata and structured data are present before crawlers execute JavaScript.
app.use(express.static(distPath, { index: false }));

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function upsertMeta(html, selector, attr, value) {
  if (!value) return html;
  const escapedValue = escapeAttribute(value);
  const [key, keyValue] = selector;
  const tagRegex = new RegExp(`<meta\\s+([^>]*${key}=["']${keyValue}["'][^>]*)>`, "i");

  if (tagRegex.test(html)) {
    return html.replace(tagRegex, (match) => {
      if (new RegExp(`${attr}=["'][^"']*["']`, "i").test(match)) {
        return match.replace(
          new RegExp(`${attr}=["'][^"']*["']`, "i"),
          `${attr}="${escapedValue}"`,
        );
      }
      return match.replace(/>$/, ` ${attr}="${escapedValue}">`);
    });
  }

  return html.replace(
    "</head>",
    `    <meta ${key}="${keyValue}" ${attr}="${escapedValue}" />\n  </head>`,
  );
}

function upsertCanonical(html, canonicalUrl) {
  if (!canonicalUrl) return html;
  const escapedUrl = escapeAttribute(canonicalUrl);
  if (/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i, (match) => {
      if (/href=["'][^"']*["']/i.test(match)) {
        return match.replace(/href=["'][^"']*["']/i, `href="${escapedUrl}"`);
      }
      return match.replace(/\/?>$/, ` href="${escapedUrl}" />`);
    });
  }
  return html.replace("</head>", `    <link rel="canonical" href="${escapedUrl}" />\n  </head>`);
}

function injectJsonLd(html, schemas = []) {
  if (!schemas.length) return html;
  const scripts = schemas
    .map((schema) => JSON.stringify(schema).replaceAll("</script", "<\\/script"))
    .map((schema) => `    <script type="application/ld+json">${schema}</script>`)
    .join("\n");

  return html.replace("</head>", `${scripts}\n  </head>`);
}

function sharedStructuredData(page) {
  const siteUrl = env.siteUrl.replace(/\/$/, "");
  const pageUrl = page.canonicalUrl || `${siteUrl}/`;
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;
  const pageId = `${pageUrl}#webpage`;
  const isHome = page.slug === "home";
  const schemas = [
    {
      "@type": "Person",
      "@id": personId,
      name: "Rahul Tanwar",
      url: `${siteUrl}/`,
      image: page.images?.founder?.url
        ? new URL(page.images.founder.url, siteUrl).href
        : `${siteUrl}/images/rahul-tanwar-portrait.jpg`,
      jobTitle: "Founder and Entrepreneur",
      description:
        "Dubai-based multi-industry founder building ventures across gaming, beverages, apparel and manufacturing in the UAE and India.",
      sameAs: [page.socialLinks?.linkedin].filter(Boolean),
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
      "@id": pageId,
      url: pageUrl,
      name: page.metaTitle || page.pageTitle,
      description: page.metaDescription,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      mainEntity: isHome ? { "@id": personId } : undefined,
      inLanguage: "en",
      dateModified: page.updatedAt,
    },
  ];

  if (!isHome) {
    const label = page.pageTitle?.split(/[|—-]/)[0]?.trim() || page.slug;
    schemas.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: label, item: pageUrl },
      ],
    });
  }

  return [{ "@context": "https://schema.org", "@graph": [...schemas, ...(page.jsonLd || [])] }];
}

function pageSlugForPath(requestPath) {
  requestPath = requestPath.length > 1 ? requestPath.replace(/\/+$/, "") : requestPath;
  if (requestPath === "/" || requestPath === "") return "home";
  if (requestPath === "/privacy") return "privacy";
  if (requestPath === "/ventures/sr18-gaming") return "sr18-gaming";
  if (requestPath === "/ventures/delhi-6") return "delhi-6";
  if (requestPath === "/ventures/volt-50000") return "volt-50000";
  if (requestPath === "/ventures/masai") return "masai";
  if (requestPath === "/ventures/adatto") return "adatto";
  if (requestPath === "/ventures/arnika-textiles") return "arnika-textiles";
  return null;
}

function applyServerSeo(html, page) {
  let output = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeAttribute(page.metaTitle || page.pageTitle)}</title>`,
  );

  output = upsertMeta(output, ["name", "description"], "content", page.metaDescription);
  output = upsertMeta(output, ["property", "og:title"], "content", page.ogTitle || page.metaTitle);
  output = upsertMeta(
    output,
    ["property", "og:description"],
    "content",
    page.ogDescription || page.metaDescription,
  );
  output = upsertMeta(output, ["property", "og:image"], "content", page.ogImage);
  output = upsertMeta(output, ["property", "og:url"], "content", page.ogUrl || page.canonicalUrl);
  output = upsertMeta(output, ["property", "og:type"], "content", page.ogType || "website");
  output = upsertMeta(output, ["name", "twitter:card"], "content", "summary_large_image");
  output = upsertMeta(
    output,
    ["name", "twitter:title"],
    "content",
    page.twitterTitle || page.ogTitle || page.metaTitle,
  );
  output = upsertMeta(
    output,
    ["name", "twitter:description"],
    "content",
    page.twitterDescription || page.ogDescription || page.metaDescription,
  );
  output = upsertMeta(
    output,
    ["name", "twitter:image"],
    "content",
    page.twitterImage || page.ogImage,
  );
  output = upsertCanonical(output, page.canonicalUrl);
  return injectJsonLd(output, sharedStructuredData(page));
}

app.get(/^\/(?!api\/).*/, async (req, res, next) => {
  try {
    const indexHtml = await fs.readFile(path.join(distPath, "index.html"), "utf8");
    const slug = pageSlugForPath(req.path);
    if (!slug) {
      res.type("html").send(indexHtml);
      return;
    }

    const pages = await readPages();
    const page = pages[slug];
    res.type("html").send(page ? applyServerSeo(indexHtml, page) : indexHtml);
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: env.nodeEnv === "production" ? "Server error" : err.message });
});

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});
