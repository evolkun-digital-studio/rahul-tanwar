import { Router } from "express";
import { env } from "../config/env.js";
import { readPages, readSettings } from "../lib/jsonStore.js";

export const publicRouter = Router();

const sitemapRoutes = [
  { slug: "home", path: "/", changefreq: "weekly", priority: "1.0" },
  { slug: "sr18-gaming", path: "/ventures/sr18-gaming", changefreq: "monthly", priority: "0.8" },
  { slug: "delhi-6", path: "/ventures/delhi-6", changefreq: "monthly", priority: "0.8" },
  { slug: "volt-50000", path: "/ventures/volt-50000", changefreq: "monthly", priority: "0.8" },
  { slug: "masai", path: "/ventures/masai", changefreq: "monthly", priority: "0.8" },
  { slug: "adatto", path: "/ventures/adatto", changefreq: "monthly", priority: "0.8" },
  {
    slug: "arnika-textiles",
    path: "/ventures/arnika-textiles",
    changefreq: "monthly",
    priority: "0.8",
  },
  { slug: "privacy", path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

publicRouter.get("/pages/:slug", async (req, res, next) => {
  try {
    const pages = await readPages();
    const page = pages[req.params.slug] || null;
    res.json({ page });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await readSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

export async function sitemap(_req, res, next) {
  try {
    const pages = await readPages();
    const baseUrl = env.siteUrl.replace(/\/$/, "");
    const urls = sitemapRoutes.map((route) => {
      const page = pages[route.slug];
      return {
        loc: page?.canonicalUrl || `${baseUrl}${route.path}`,
        lastmod: sitemapDate(page?.updatedAt),
        changefreq: route.changefreq,
        priority: route.priority,
      };
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.type("application/xml; charset=utf-8").send(xml);
  } catch (error) {
    next(error);
  }
}
