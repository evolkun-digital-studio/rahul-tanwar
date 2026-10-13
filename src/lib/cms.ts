import { useEffect, useState } from "react";
import { IMG, VENTURES } from "@/lib/data";

export type CmsImage = {
  url: string;
  alt: string;
  title?: string;
};

export type PageCmsContent = {
  slug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Array<Record<string, unknown>>;
  contactEmail: string;
  socialLinks: {
    linkedin?: string;
    whatsapp?: string;
  };
  header: {
    brand: string;
    ctaText: string;
    ctaLink: string;
    links: Array<{ label: string; href: string }>;
  };
  images: Record<string, CmsImage>;
  sections: Record<string, Record<string, unknown>>;
};

export const defaultHomeContent: PageCmsContent = {
  slug: "home",
  pageTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
  metaTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
  metaDescription:
    "Rahul Tanwar is a Dubai-based founder who builds businesses across gaming, beverages, apparel and consumer brands with operations spanning the UAE and India. Explore his ventures, journey and investment ecosystem.",
  canonicalUrl: "https://rahultanwar.com/",
  ogTitle: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
  ogDescription:
    "Rahul Tanwar is a Dubai-based founder who builds businesses across gaming, beverages, apparel and consumer brands with operations spanning the UAE and India.",
  ogImage: "https://rahultanwar.com/images/rahul-tanwar-portrait.jpg",
  contactEmail: "hello@rahultanwar.com",
  socialLinks: {
    linkedin: "https://www.linkedin.com/in/rahul-tanwar-350a13279/",
    whatsapp: "",
  },
  header: {
    brand: "Rahul Tanwar",
    ctaText: "Get in touch",
    ctaLink: "#contact",
    links: [
      { label: "Ventures", href: "#ventures" },
      { label: "About", href: "#about" },
      { label: "Philosophy", href: "#philosophy" },
      { label: "Contact", href: "#contact" },
    ],
  },
  images: {
    founder: {
      url: IMG.founder,
      alt: "Rahul Tanwar — Dubai-based founder and entrepreneur, builder of multi-sector business ventures across UAE and India.",
      title: "Rahul Tanwar | Founder & Entrepreneur | UAE and India",
    },
    factory: {
      url: IMG.factory,
      alt: "Arnika Textiles fabric rolls vertically integrated textile manufacturing facility in India supplying global apparel and home brands",
      title: "Arnika Textiles | Textile Manufacturer India | Global Supply | Est. 2024",
    },
    apparel: {
      url: IMG.apparel,
      alt: "Adatto performance athleisure technical fabric joggers and sweatshirt designed in Jaipur India for worldwide wear",
      title: "Adatto | Performance Athleisure India | Designed in Jaipur | Est. 2024",
    },
    beverage: {
      url: IMG.beverage,
      alt: "Delhi 6 craft beer bottle — Indian craft beer inspired by the chaos and culture of Old Delhi, Est. 2023",
      title: "Delhi 6 | Indian Craft Beer | Old Delhi Inspired | Est. 2023",
    },
    gaming: {
      url: IMG.gaming,
      alt: "SR18 Gaming setup online gaming arena with neon-lit workstations built for real-money skill gaming across UAE and India.",
      title: "SR18 Gaming | Online Gaming Platform | UAE · India | Est. 2026",
    },
    dubai: { url: IMG.dubai, alt: "Dubai" },
    corridorDubai: {
      url: "/images/corridor/dubai-skyline.jpg",
      alt: "Dubai skyline with Burj Khalifa",
    },
    corridorIndia: {
      url: "/images/corridor/delhi-skyline.jpg",
      alt: "New Delhi cityscape and skyline",
    },
  },
  sections: {
    hero: {
      eyebrow: "Founder & entrepreneur",
      heading: "Rahul Tanwar",
      manifestoLead: "",
      manifestoEmphasis: "",
      subheading:
        "Building ventures across gaming, beverages, apparel and manufacturing in the UAE and India.",
      ctaText: "Explore the ventures",
      ctaLink: "#ventures",
    },
    introduction: {
      eyebrow: "On building",
      headline: "Build with intent.",
      secondLine: "Think long term.",
      description:
        "Different industries, one approach: understand the market, stay close to the product and do the work that lasts.",
    },
    ecosystem: {
      eyebrow: "The Ecosystem — Rahul Tanwar Ventures",
      heading: "Different ventures.|One way of building.",
      description:
        "A portfolio spanning gaming, brewing, consumer beverages, apparel and textiles. Each business has its own market and purpose.",
      ventures: VENTURES,
    },
    philosophy: {
      eyebrow: "Business philosophy",
      quote:
        "Good businesses are built in the details. Then proved over time.",
      attribution: "A long-term view",
    },
    manBehind: {
      eyebrow: "The Man Behind The Brand",
      introduction: "Rahul Tanwar is a Dubai-based founder with businesses across the UAE and India.",
      paragraphs: [
        "His portfolio spans gaming, brewing, beverages, apparel and manufacturing. Different categories, with the same focus on product and execution.",
        "He works across the ideas behind a brand and the operations that make it real — from what customers experience to how the business delivers it.",
        "The approach is practical: build with purpose, earn trust over time and keep improving what matters.",
      ],
    },
    global: {
      eyebrow: "Where it happens",
      description:
        "Based in Dubai. Building products, teams and partnerships across the UAE and India.",
      statementLead: "Two markets.",
      statementEmphasis: "A shared direction.",
      statementDescription: "Connected by people, products and the work of building businesses.",
    },
    contact: {
      eyebrow: "Get in touch",
      titleLead: "Let's start a",
      titleEmphasis: "conversation.",
      description:
        "For partnerships, distribution, investment or enquiries about the ventures.",
      submitText: "Send an enquiry",
      successMessage: "Your message was submitted successfully. Thank you for reaching out.",
    },
    footer: {
      tagline: "Built with intention. Dubai / India.",
      region: "Dubai, UAE / India",
    },
  },
};

export const defaultPrivacyContent: PageCmsContent = {
  ...defaultHomeContent,
  slug: "privacy",
  pageTitle: "Privacy Policy | Rahul Tanwar",
  metaTitle: "Privacy Policy | Rahul Tanwar",
  metaDescription: "Privacy policy for Rahul Tanwar's official website and enquiry forms.",
  canonicalUrl: "https://rahultanwar.com/privacy",
  ogTitle: "Privacy Policy | Rahul Tanwar",
  ogDescription:
    "How this website handles enquiries and information submitted through its contact form.",
  sections: {
    ...defaultHomeContent.sections,
    privacy: {
      eyebrow: "Privacy Policy",
      title: "Privacy Policy",
      updatedLabel: "Last updated",
      updatedAt: "October 12, 2026",
      intro:
        "This policy describes how information submitted through the contact form is processed and how the website operates.",
      blocks: [
        {
          title: "Information We Collect",
          body: "When you submit the contact form, we receive your name, email address, enquiry category and message. Our hosting provider may process routine technical access logs.",
        },
        {
          title: "How We Use Information",
          body: "Information is used to respond to your enquiry, evaluate business conversations and help keep the website secure.",
        },
        {
          title: "Contact Forms",
          body: "When configured, contact enquiries are delivered by email using SMTP. They are not written to the website CMS database.",
        },
        {
          title: "Data Sharing",
          body: "We do not sell personal information. Enquiry details may be shared with the relevant team members and service providers needed to operate the website and respond.",
        },
        {
          title: "Contact",
          body: "For privacy questions, contact hello@rahultanwar.com.",
        },
      ],
    },
  },
};

export const defaultSr18GamingContent: PageCmsContent = {
  ...defaultHomeContent,
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
  header: {
    ...defaultHomeContent.header,
    ctaLink: "/#contact",
    links: defaultHomeContent.header.links.map((link) => ({
      ...link,
      href: link.href.startsWith("#") ? `/${link.href}` : link.href,
    })),
  },
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
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "SR18 Gaming",
      title: "Real-money skill gaming for the South Asian diaspora.",
      description:
        "SR18 Gaming is Rahul Tanwar's online gaming venture offering real-money skill-based experiences across the UAE and India since 2025.",
      region: "UAE · India",
      category: "Online Gaming",
      year: "2025",
      imageKey: "gaming",
      focusEyebrow: "Platform Focus",
      focusTitle: "Built around skill, culture, and cross-border reach.",
      contactText:
        "For partnerships, media, or investment conversations around SR18 Gaming, connect through Rahul Tanwar's venture office.",
      highlights: [
        "Next-generation online gaming platform",
        "Skill-based real-money experiences",
        "Built for South Asian diaspora audiences",
        "Operating across UAE and India",
      ],
    },
  },
};

export const defaultDelhi6Content: PageCmsContent = {
  ...defaultHomeContent,
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
  header: {
    ...defaultHomeContent.header,
    ctaLink: "/#contact",
    links: defaultHomeContent.header.links.map((link) => ({
      ...link,
      href: link.href.startsWith("#") ? `/${link.href}` : link.href,
    })),
  },
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
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "Delhi 6",
      title: "Craft beer inspired by the flavour and romance of Old Delhi.",
      description:
        "Delhi 6 is an Indian craft beer house honouring the flavour, romance and chaos of Old Delhi - brewed and bottled for a new generation.",
      region: "India",
      category: "Craft Beer",
      year: "2023",
      imageKey: "beverage",
      focusEyebrow: "Brand Focus",
      focusTitle: "Old Delhi character, brewed for modern Indian beer drinkers.",
      contactText:
        "For partnerships, distribution, media, or investment conversations around Delhi 6, connect through Rahul Tanwar's venture office.",
      highlights: [
        "Indian craft beer house",
        "Inspired by Old Delhi's flavour and culture",
        "Brewed and bottled for a new generation",
        "A Rahul Tanwar venture established in 2023",
      ],
    },
  },
};

export const defaultMasaiContent: PageCmsContent = {
  ...defaultHomeContent,
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
  header: {
    ...defaultHomeContent.header,
    ctaLink: "/#contact",
    links: defaultHomeContent.header.links.map((link) => ({
      ...link,
      href: link.href.startsWith("#") ? `/${link.href}` : link.href,
    })),
  },
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
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "Masai",
      title: "Brewing innovation built for Indian fermentation.",
      description:
        "Masai is an Indian brewing innovation studio pioneering new fermentation processes and craft beverage experiences built for Indian palates.",
      region: "India",
      category: "Brewing Innovation",
      year: "2024",
      imageKey: "beverage",
      focusEyebrow: "Studio Focus",
      focusTitle: "New fermentation processes shaped around Indian palates.",
      contactText:
        "For partnerships, product development, distribution, or investment conversations around Masai, connect through Rahul Tanwar's venture office.",
      highlights: [
        "Indian brewing innovation studio",
        "Pioneering new fermentation processes",
        "Craft beverage experiences for Indian palates",
        "A Rahul Tanwar venture established in 2024",
      ],
    },
  },
};

export const defaultAdattoContent: PageCmsContent = {
  ...defaultHomeContent,
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
  header: {
    ...defaultHomeContent.header,
    ctaLink: "/#contact",
    links: defaultHomeContent.header.links.map((link) => ({
      ...link,
      href: link.href.startsWith("#") ? `/${link.href}` : link.href,
    })),
  },
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
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "Adatto",
      title: "Performance athleisure designed in Jaipur and worn worldwide.",
      description:
        "Adatto is a performance-grade athleisure brand built from technical fabrics, designed in Jaipur and worn worldwide.",
      region: "India",
      category: "Athleisure",
      year: "2024",
      imageKey: "apparel",
      focusEyebrow: "Brand Focus",
      focusTitle: "Technical fabrics for athletes and everyday movers.",
      contactText:
        "For partnerships, retail, distribution, media, or investment conversations around Adatto, connect through Rahul Tanwar's venture office.",
      highlights: [
        "Performance-grade athleisure brand",
        "Built from technical fabrics",
        "Designed in Jaipur",
        "A Rahul Tanwar venture established in 2024",
      ],
    },
  },
};

export const defaultVolt50000Content: PageCmsContent = {
  ...defaultHomeContent,
  slug: "volt-50000",
  pageTitle: "Volt 50000 | Functional Beverage | Rahul Tanwar",
  metaTitle: "Volt 50000 | Functional Beverage | Rahul Tanwar",
  metaDescription:
    "Volt 50000 is a functional beverage venture developed for performance-led lifestyles in the UAE and wider GCC region.",
  canonicalUrl: "https://rahultanwar.com/ventures/volt-50000",
  ogTitle: "Volt 50000 | Functional Beverage",
  ogDescription:
    "A functional beverage proposition for performance-led lifestyles across the Gulf.",
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "Volt 50000",
      title: "A functional beverage for the pace of the Gulf.",
      description:
        "Volt 50000 is a premium functional beverage developed for high-performance lifestyles in the UAE and wider GCC region.",
      region: "UAE · GCC",
      category: "Functional Beverage",
      year: "2023",
      imageKey: "volt50000",
      focusTitle: "Performance with purpose.",
      highlights: [
        "Premium functional beverage",
        "Developed for performance-led lifestyles",
        "Focused on the UAE and GCC markets",
      ],
    },
  },
};

export const defaultArnikaContent: PageCmsContent = {
  ...defaultHomeContent,
  slug: "arnika-textiles",
  ogImage: "https://rahultanwar.com/assets/arnika-textiles-og.jpg",
  pageTitle: "Arnika Textiles | Textile Manufacturing | Rahul Tanwar",
  metaTitle: "Arnika Textiles | Textile Manufacturing | Rahul Tanwar",
  metaDescription:
    "Arnika Textiles is an India-based vertically integrated textile manufacturing venture focused on precision production and supply chain control.",
  canonicalUrl: "https://rahultanwar.com/ventures/arnika-textiles",
  ogTitle: "Arnika Textiles | Textile Manufacturing",
  ogDescription:
    "Indian textile manufacturing with a focus on precision and integrated supply chains.",
  sections: {
    ...defaultHomeContent.sections,
    venturePage: {
      eyebrow: "Arnika Textiles",
      title: "Closer to the making. Closer to quality.",
      description:
        "Arnika Textiles is a vertically integrated textile manufacturer based in India, supplying fabrics to apparel and home brands with a focus on precision manufacturing and supply chain control.",
      region: "India",
      category: "Textile Manufacturing",
      year: "2024",
      imageKey: "factory",
      focusTitle: "Precision in every process.",
      highlights: [
        "Vertically integrated textile manufacturing",
        "Premium fabric production",
        "A focus on end-to-end supply chain control",
      ],
    },
  },
};

function mergeContent(defaults: PageCmsContent, page?: Partial<PageCmsContent>) {
  return {
    ...defaults,
    ...(page || {}),
    header: { ...defaults.header, ...(page?.header || {}) },
    images: { ...defaults.images, ...(page?.images || {}) },
    socialLinks: { ...defaults.socialLinks, ...(page?.socialLinks || {}) },
    sections: { ...defaults.sections, ...(page?.sections || {}) },
  };
}

function setMeta(selector: string, attr: "content" | "href", value?: string) {
  if (!value) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    if (selector.startsWith("meta[")) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      const property = selector.match(/property="([^"]+)"/)?.[1];
      element = document.createElement("meta");
      if (name) element.setAttribute("name", name);
      if (property) element.setAttribute("property", property);
      document.head.appendChild(element);
    }
    if (selector === 'link[rel="canonical"]') {
      element = document.createElement("link");
      element.setAttribute("rel", "canonical");
      document.head.appendChild(element);
    }
  }
  if (element) {
    element.setAttribute(attr, value);
  }
}

export function applyPageSeo(content: PageCmsContent) {
  document.title = content.metaTitle || content.pageTitle;
  setMeta('meta[name="description"]', "content", content.metaDescription);
  setMeta('meta[property="og:title"]', "content", content.ogTitle || content.metaTitle);
  setMeta(
    'meta[property="og:description"]',
    "content",
    content.ogDescription || content.metaDescription,
  );
  setMeta('meta[property="og:image"]', "content", content.ogImage);
  setMeta('meta[property="og:url"]', "content", content.ogUrl || content.canonicalUrl);
  setMeta('meta[property="og:type"]', "content", content.ogType || "website");
  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "content", content.twitterTitle || content.ogTitle);
  setMeta(
    'meta[name="twitter:description"]',
    "content",
    content.twitterDescription || content.ogDescription || content.metaDescription,
  );
  setMeta('meta[name="twitter:image"]', "content", content.twitterImage || content.ogImage);
  setMeta(
    'meta[name="robots"]',
    "content",
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  );
  setMeta('link[rel="canonical"]', "href", content.canonicalUrl);

  document.getElementById("organization-schema")?.remove();
  document.getElementById("quotation-schema")?.remove();
  document.getElementById("seo-schema")?.remove();
  document.querySelectorAll('script[data-page-schema="true"]').forEach((element) => {
    element.remove();
  });

  const siteUrl = "https://rahultanwar.com";
  const pageUrl = content.canonicalUrl || `${siteUrl}/`;
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Person",
      "@id": personId,
      name: "Rahul Tanwar",
      url: `${siteUrl}/`,
      image: content.images.founder?.url || `${siteUrl}/images/rahul-tanwar-portrait.jpg`,
      jobTitle: "Founder and Entrepreneur",
      description:
        "Dubai-based multi-industry founder building ventures across gaming, beverages, apparel and manufacturing in the UAE and India.",
      sameAs: [content.socialLinks.linkedin].filter(
        (url) => typeof url === "string" && url.startsWith("https://"),
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
      "@type": content.slug === "home" ? "ProfilePage" : "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: content.metaTitle || content.pageTitle,
      description: content.metaDescription,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      mainEntity: content.slug === "home" ? { "@id": personId } : undefined,
      inLanguage: "en",
    },
    ...(content.slug === "home"
      ? [
        {
          "@type": "Quotation",
          text: "Great companies are not built by chasing trends. They are built by solving real problems consistently over decades.",
          spokenByCharacter: {
            "@type": "Person",
            name: "Rahul Tanwar",
            jobTitle: "Founder and Entrepreneur",
            url: "https://rahultanwar.com",
            worksFor: {
              "@type": "Organization",
              name: "Rahul Tanwar Ventures",
            },
          },
        },
      ]
      : []),
    ...(content.jsonLd || []),
  ];

  if (content.slug !== "home") {
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

  const script = document.createElement("script");
  script.id = "seo-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  });
  document.head.appendChild(script);
}

export function usePageContent(slug = "home") {
  const defaults =
    slug === "privacy"
      ? defaultPrivacyContent
      : slug === "sr18-gaming"
        ? defaultSr18GamingContent
        : slug === "delhi-6"
          ? defaultDelhi6Content
          : slug === "masai"
            ? defaultMasaiContent
            : slug === "adatto"
              ? defaultAdattoContent
              : slug === "volt-50000"
                ? defaultVolt50000Content
                : slug === "arnika-textiles"
                  ? defaultArnikaContent
                  : defaultHomeContent;
  const [content, setContent] = useState<PageCmsContent>(defaults);

  useEffect(() => {
    // A standalone Vite preview uses the built-in page content and does not
    // require the Express CMS server. Opt into live CMS data in development
    // by setting VITE_ENABLE_CMS_API=true; production always uses the API.
    const shouldFetchCms = !import.meta.env.DEV || import.meta.env.VITE_ENABLE_CMS_API === "true";

    if (!shouldFetchCms) {
      setContent(defaults);
      return;
    }

    let active = true;
    fetch(`/api/public/pages/${slug}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        setContent(mergeContent(defaults, data?.page));
      })
      .catch(() => {
        if (active) setContent(defaults);
      });

    return () => {
      active = false;
    };
  }, [defaults, slug]);

  useEffect(() => {
    applyPageSeo(content);
  }, [content]);

  return content;
}
