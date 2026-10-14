import { VENTURES, type Venture } from "@/lib/data";
import type { CmsImage, PageCmsContent } from "@/lib/cms";
import adattoImage from "@/assets/adatto.avif";
import sr18Image from "@/assets/sr18.avif";
import voltImage from "@/assets/volt.avif";
import textileImage from "@/assets/textile.avif";
import delhi6Image from "@/assets/delhi6.jpeg";

const url = (image: unknown): string =>
  typeof image === "string" ? image : ((image as { src?: string })?.src ?? "");

const adattoPhoto = url(adattoImage);
const sr18Photo = url(sr18Image);
const voltPhoto = url(voltImage);
const textilePhoto = url(textileImage);
const delhi6Photo = url(delhi6Image);

export type VentureEditorial = Venture & {
  slug: string;
  phrase: string;
  short: string;
  visual: "photo" | "type";
  art?: "volt" | "masai";
};

const DETAILS: Record<
  string,
  Pick<VentureEditorial, "slug" | "phrase" | "short" | "visual" | "art">
> = {
  sr18: {
    slug: "sr18-gaming",
    phrase: "The next arena for a connected generation.",
    short: "Digital entertainment, conceived for audiences between the UAE and India.",
    visual: "photo",
  },
  delhi6: {
    slug: "delhi-6",
    phrase: "A familiar city. An entirely new pour.",
    short: "A craft beer house with its roots in the energy and culture of Old Delhi.",
    visual: "photo",
  },
  volt50000: {
    slug: "volt-50000",
    phrase: "Energy for the pace of modern life.",
    short: "A functional beverage proposition developed for a performance-led Gulf market.",
    visual: "type",
    art: "volt",
  },
  masai: {
    slug: "masai",
    phrase: "A new language for Indian brewing.",
    short: "Exploring fermentation and craft beverage experiences shaped by Indian tastes.",
    visual: "type",
    art: "masai",
  },
  adatto: {
    slug: "adatto",
    phrase: "Made to move, made to endure.",
    short: "Technical apparel conceived in Jaipur for movement, comfort and everyday life.",
    visual: "photo",
  },
  arnika: {
    slug: "arnika-textiles",
    phrase: "Built into the fabric of what comes next.",
    short: "Precision textile manufacturing and tighter control over the supply chain.",
    visual: "photo",
  },
};

export function toEditorialVenture(venture: Venture): VentureEditorial {
  const editorial = DETAILS[venture.id];
  return {
    ...venture,
    ...editorial,
    phrase: venture.editorialPhrase || editorial.phrase,
    short: venture.blurb || venture.editorialSummary || editorial.short,
  };
}

export function ventureImage(venture: VentureEditorial, content: PageCmsContent): CmsImage {
  const rootPhotos: Record<string, CmsImage> = {
    delhi6: {
      url: delhi6Photo,
      alt: VENTURES.find((venture) => venture.id === "delhi6")!.alt,
      title: VENTURES.find((venture) => venture.id === "delhi6")!.title,
    },
    masai: {
      url: "/assets/masai-og.jpg",
      alt: VENTURES.find((venture) => venture.id === "masai")!.alt,
      title: VENTURES.find((venture) => venture.id === "masai")!.title,
    },
    adatto: {
      url: adattoPhoto,
      alt: VENTURES.find((venture) => venture.id === "adatto")!.alt,
      title: VENTURES.find((venture) => venture.id === "adatto")!.title,
    },
    sr18: {
      url: sr18Photo,
      alt: VENTURES.find((venture) => venture.id === "sr18")!.alt,
      title: VENTURES.find((venture) => venture.id === "sr18")!.title,
    },
    volt50000: {
      url: voltPhoto,
      alt: VENTURES.find((venture) => venture.id === "volt50000")!.alt,
      title: VENTURES.find((venture) => venture.id === "volt50000")!.title,
    },
    arnika: {
      url: textilePhoto,
      alt: VENTURES.find((venture) => venture.id === "arnika")!.alt,
      title: VENTURES.find((venture) => venture.id === "arnika")!.title,
    },
  };
  if (rootPhotos[venture.id]) return rootPhotos[venture.id];

  const key: Record<string, string> = {
    sr18: "gaming",
    delhi6: "beverage",
    volt50000: "volt50000",
    masai: "masai",
    adatto: "apparel",
    arnika: "factory",
  };
  const override = content.images[key[venture.id]];
  if (override?.url) return override;
  if (venture.visual === "type")
    return { url: "", alt: `${venture.name} — editorial typographic artwork` };
  return { url: venture.image, alt: venture.alt };
}

export function EditorialVisual({
  venture,
  content,
  parallax = false,
  priority = false,
}: {
  venture: VentureEditorial;
  content: PageCmsContent;
  parallax?: boolean;
  priority?: boolean;
}) {
  const image = ventureImage(venture, content);
  if (image.url) {
    return (
      <div
        className={`rt-venture-art h-full min-h-80 overflow-hidden bg-surface md:min-h-[410px] rt-art-${venture.id}`}
      >
        <img
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          data-parallax={parallax ? "" : undefined}
          src={image.url}
          alt={image.alt}
          title={image.title || venture.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div
      className={`rt-venture-art relative flex h-full min-h-80 flex-col justify-between overflow-hidden p-7 md:min-h-[410px] md:p-12 ${venture.art === "volt" ? "bg-chapter text-chapter-text" : "bg-hairline text-ink"}`}
      role="img"
      aria-label={image.alt}
      title={venture.title}
    >
      {venture.art === "volt" ? (
        <>
          <span className="flex justify-between gap-3 text-[10px] font-medium tracking-[0.11em] md:text-xs">
            FUNCTIONAL BEVERAGE <span>UAE / GCC</span>
          </span>
          <span className="flex flex-col text-[clamp(4rem,10vw,11rem)] font-bold leading-[0.78] tracking-[-0.1em]">
            VOLT<span className="mt-5 text-[0.45em] font-light tracking-[-0.07em]">50000</span>
          </span>
          <span className="flex justify-between gap-3 border-t border-current pt-4 text-[10px] font-medium tracking-[0.11em] md:text-xs">
            BUILT FOR MOMENTUM <span>PERFORMANCE / CULTURE</span>
          </span>
        </>
      ) : (
        <>
          <span className="flex justify-between gap-3 text-[10px] font-medium tracking-[0.11em] md:text-xs">
            BREWING &amp; FERMENTATION <span>INDIA</span>
          </span>
          <span className="flex flex-col text-[clamp(4.5rem,11vw,11rem)] leading-none tracking-[-0.06em]">
            Masai<span className="mt-1 text-base tracking-[-0.02em]">Crafted with curiosity.</span>
          </span>
        </>
      )}
    </div>
  );
}
