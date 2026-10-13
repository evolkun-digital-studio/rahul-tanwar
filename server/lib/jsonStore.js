import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

const defaults = {
  "pages.json": {
    home: {
      slug: "home",
      pageTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
      metaTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
      metaDescription:
        "Rahul Tanwar is a Dubai-based founder who builds businesses across gaming, beverages, apparel and consumer brands with operations spanning the UAE and India. Explore his ventures, journey and investment ecosystem.",
      canonicalUrl: "https://rahultanwar.com/",
      ogTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
      ogDescription:
        "Rahul Tanwar is a Dubai-based founder who builds businesses across gaming, beverages, apparel and consumer brands with operations spanning the UAE and India.",
      ogImage: "",
      heroHeading: "Entrepreneur and Founder",
      heroSubheading:
        "Rahul Tanwar is a Dubai-based founder who builds businesses across gaming, beverages, apparel and consumer brands with operations spanning the UAE and India. Explore his ventures, journey and investment ecosystem.",
      heroCtaText: "Explore Ecosystem",
      heroCtaLink: "#ventures",
      sectionHeadings: {},
      sectionDescriptions: {},
      imageUrls: {},
      imageAltTags: {},
      footerText:
        "Building ventures across gaming, beverages, apparel, manufacturing and consumer brands between UAE and India.",
      contactEmail: "hello@rahultanwar.com",
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/rahul-tanwar-350a13279/",
        whatsapp: "",
      },
      updatedAt: new Date().toISOString(),
    },
    "sr18-gaming": {
      slug: "sr18-gaming",
      pageTitle: "SR18 Gaming - Real-Money Skill Gaming Platform | UAE and India",
      metaTitle: "SR18 Gaming - Real-Money Skill Gaming Platform | UAE and India",
      metaDescription:
        "SR18 Gaming is Rahul Tanwar's online gaming venture offering real-money skill-based experiences for the South Asian diaspora. Operating across UAE and India since 2025.",
      canonicalUrl: "https://rahultanwar.com/ventures/sr18-gaming",
      ogTitle: "SR18 Gaming - Real-Money Skill Gaming Platform",
      ogDescription:
        "A next-generation gaming platform built for the South Asian diaspora. Real-money skill experiences across UAE and India.",
      ogImage: "https://rahultanwar.com/assets/sr18-gaming-og.jpg",
      ogUrl: "https://rahultanwar.com/ventures/sr18-gaming",
      ogType: "website",
      twitterTitle: "SR18 Gaming - Real-Money Skill Gaming Platform",
      twitterDescription:
        "Real-money skill gaming for the South Asian diaspora. Operating across UAE and India since 2025.",
      twitterImage: "https://rahultanwar.com/assets/sr18-gaming-og.jpg",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SR18 Gaming",
          url: "https://rahultanwar.com/ventures/sr18-gaming",
          foundingDate: "2025",
          founder: {
            "@type": "Person",
            name: "Rahul Tanwar",
            url: "https://rahultanwar.com",
          },
          description:
            "SR18 Gaming is a next-generation online gaming platform offering real-money skill-based experiences for the South Asian diaspora operating across UAE and India.",
          areaServed: [
            {
              "@type": "Country",
              name: "United Arab Emirates",
            },
            {
              "@type": "Country",
              name: "India",
            },
          ],
        },
      ],
      updatedAt: "2026-06-10T00:00:00.000Z",
    },
    "delhi-6": {
      slug: "delhi-6",
      pageTitle: "Delhi 6 - Craft Beer House Inspired by Old Delhi",
      metaTitle: "Delhi 6 - Craft Beer House Inspired by Old Delhi",
      metaDescription:
        "Delhi 6 is an Indian craft beer house honouring the flavour, romance and chaos of Old Delhi - brewed and bottled for a new generation. A Rahul Tanwar venture. Est. 2023.",
      canonicalUrl: "https://rahultanwar.com/ventures/delhi-6",
      ogTitle: "Delhi 6 - Craft Beer House Inspired by Old Delhi",
      ogDescription:
        "Craft beer honouring the flavour, romance and chaos of Old Delhi - bottled for a new generation of Indian beer drinkers.",
      ogImage: "https://rahultanwar.com/assets/delhi-6-og.jpg",
      ogUrl: "https://rahultanwar.com/ventures/delhi-6",
      ogType: "website",
      twitterTitle: "Delhi 6 - Craft Beer House Inspired by Old Delhi",
      twitterDescription:
        "Craft beer honouring the flavour, romance and chaos of Old Delhi - bottled for a new generation of Indian beer drinkers.",
      twitterImage: "https://rahultanwar.com/assets/delhi-6-og.jpg",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Delhi 6",
          foundingDate: "2023",
          founder: {
            "@type": "Person",
            name: "Rahul Tanwar",
            url: "https://rahultanwar.com",
          },
          description:
            "Delhi 6 is an Indian craft beer house honouring the flavour, romance and chaos of Old Delhi - brewed and bottled for a new generation.",
          areaServed: {
            "@type": "Country",
            name: "India",
          },
          industry: "Craft Beer",
        },
      ],
      updatedAt: "2026-06-10T00:00:00.000Z",
    },
    masai: {
      slug: "masai",
      pageTitle: "Masai — Brewing Innovation Studio for Indian Fermentation | India",
      metaTitle: "Masai — Brewing Innovation Studio for Indian Fermentation | India",
      metaDescription:
        "Masai is an Indian brewing innovation studio pioneering new fermentation processes and craft beverage experiences built for Indian palates. A Rahul Tanwar venture. Est. 2024.",
      canonicalUrl: "https://rahultanwar.com/ventures/masai",
      ogTitle: "Masai — Brewing Innovation Studio | India",
      ogDescription:
        "An Indian brewing innovation studio pioneering new fermentation processes built for Indian palates. Operating since 2024.",
      ogImage: "https://rahultanwar.com/assets/masai-og.jpg",
      ogUrl: "https://rahultanwar.com/ventures/masai",
      ogType: "website",
      twitterTitle: "Masai — Brewing Innovation Studio | India",
      twitterDescription:
        "An Indian brewing innovation studio pioneering new fermentation processes built for Indian palates. Operating since 2024.",
      twitterImage: "https://rahultanwar.com/assets/masai-og.jpg",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Masai",
          foundingDate: "2024",
          founder: {
            "@type": "Person",
            name: "Rahul Tanwar",
            url: "https://rahultanwar.com",
          },
          description:
            "Masai is an Indian brewing innovation studio pioneering new fermentation processes and craft beverage experiences built specifically for Indian palates.",
          areaServed: {
            "@type": "Country",
            name: "India",
          },
          industry: "Brewing Innovation",
        },
      ],
      updatedAt: "2026-06-10T00:00:00.000Z",
    },
    adatto: {
      slug: "adatto",
      pageTitle: "Adatto — Performance Athleisure Brand Designed in Jaipur | India",
      metaTitle: "Adatto — Performance Athleisure Brand Designed in Jaipur | India",
      metaDescription:
        "Adatto is a performance-grade athleisure brand built from technical fabrics, designed in Jaipur and worn worldwide. A Rahul Tanwar venture. Est. 2024.",
      canonicalUrl: "https://rahultanwar.com/ventures/adatto",
      ogTitle: "Adatto — Performance Athleisure Brand | Designed in Jaipur",
      ogDescription:
        "Performance-grade athleisure built from technical fabrics — designed in Jaipur, worn worldwide. Est. 2024.",
      ogImage: "https://rahultanwar.com/assets/adatto-og.jpg",
      ogUrl: "https://rahultanwar.com/ventures/adatto",
      ogType: "website",
      twitterTitle: "Adatto — Performance Athleisure Brand | Designed in Jaipur",
      twitterDescription:
        "Performance-grade athleisure built from technical fabrics — designed in Jaipur, worn worldwide. Est. 2024.",
      twitterImage: "https://rahultanwar.com/assets/adatto-og.jpg",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Adatto",
          foundingDate: "2024",
          founder: {
            "@type": "Person",
            name: "Rahul Tanwar",
            url: "https://rahultanwar.com",
          },
          description:
            "Adatto is a performance-grade athleisure brand built from technical fabrics, designed in Jaipur and worn worldwide.",
          areaServed: {
            "@type": "Country",
            name: "India",
          },
          industry: "Athleisure",
        },
      ],
      updatedAt: "2026-06-10T00:00:00.000Z",
    },
  },
  "settings.json": {
    siteUrl: "https://rahultanwar.com",
    companyEmail: "hello@rahultanwar.com",
    phone: "",
    address: "",
    linkedin: "#",
    whatsapp: "#",
    updatedAt: new Date().toISOString(),
  },
  "media.json": [],
};

function filePath(fileName) {
  return path.join(dataDir, fileName);
}

async function ensureDataFile(fileName) {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(filePath(fileName), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeJson(fileName, defaults[fileName]);
  }
}

export async function readJson(fileName) {
  await ensureDataFile(fileName);
  const raw = await readFile(filePath(fileName), "utf8");
  return JSON.parse(raw);
}

export async function writeJson(fileName, data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath(fileName), `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

export async function readPages() {
  return readJson("pages.json");
}

export async function writePages(pages) {
  return writeJson("pages.json", pages);
}

export async function readSettings() {
  return readJson("settings.json");
}

export async function writeSettings(settings) {
  return writeJson("settings.json", settings);
}

export async function readMedia() {
  return readJson("media.json");
}

export async function writeMedia(media) {
  return writeJson("media.json", media);
}
