import founder from "@/assets/founder-provided.png";
import factory from "@/assets/factory.jpg";
import beverage from "@/assets/beverage.jpg";
import gaming from "@/assets/gaming.jpg";
import apparel from "@/assets/apparel.jpg";
import dubai from "@/assets/dubai.jpg";

export const IMG = { founder, factory, beverage, gaming, apparel, dubai };

export type Venture = {
  id: string;
  name: string;
  industry: string;
  country: string;
  year: string;
  tags: string[];
  blurb: string;
  image: string;
  alt: string;
  title: string;
  href?: string;
  editorialPhrase?: string;
  editorialSummary?: string;
};

export const VENTURES: Venture[] = [
  {
    id: "sr18",
    editorialPhrase: "The next arena for a connected generation.",
    editorialSummary: "A digital gaming venture for audiences across the UAE and India.",
    name: "SR18 Gaming",
    industry: "Online Gaming",
    country: "UAE · India",
    year: "2025",
    tags: ["Gaming", "Technology", "Entertainment"],
    blurb:
      "SR18 Gaming is a next-generation online gaming Platform offering real-money skill-based Experiences Designed for the South Asian diaspora operating across UAE and India from 2025.",
    image: gaming,
    alt: "SR18 Gaming setup online gaming arena with neon-lit workstations built for real-money skill gaming across UAE and India.",
    title: "SR18 Gaming | Online Gaming Platform | UAE · India | Est. 2026",
    href: "/ventures/sr18-gaming",
  },
  {
    id: "delhi6",
    editorialPhrase: "A familiar city. An entirely new pour.",
    editorialSummary: "An Indian craft beer brand inspired by Old Delhi.",
    name: "Delhi 6",
    industry: "Craft Beer",
    country: "India",
    year: "2023",
    tags: ["Consumer", "Brewing", "Hospitality"],
    blurb:
      "Delhi 6 is an Indian craft beer house built on the flavour, romance and chaos of Old Delhi brewed and bottled for a new generation of beer drinkers across India.",
    image: beverage,
    alt: "Delhi 6 craft beer bottle — Indian craft beer inspired by the chaos and culture of Old Delhi, Est. 2023",
    title: "Delhi 6 | Indian Craft Beer | Old Delhi Inspired | Est. 2023",
    href: "/ventures/delhi-6",
  },
  {
    id: "volt50000",
    editorialPhrase: "Energy for the pace of modern life.",
    editorialSummary: "A functional beverage brand developed for the Gulf market.",
    name: "Volt 50000",
    industry: "Premium Beverage",
    country: "UAE",
    year: "2023",
    tags: ["Beverage", "Energy", "Lifestyle"],
    blurb:
      "Volt 50000 is a premium functional beverage engineered for high-performance lifestyles across the Gulf built for athletes, professionals and achievers operating at their peak in the UAE and wider GCC region.",
    image: beverage,
    alt: "Volt 50000 premium functional drink bottle engineered for high-performance lifestyles across UAE and the Gulf",
    title: "Volt 50000 | Premium Functional Beverage | UAE | Est. 2023",
    href: "/ventures/volt-50000",
  },
  {
    id: "masai",
    editorialPhrase: "A new language for Indian brewing.",
    editorialSummary: "Brewing and fermentation developed for Indian tastes.",
    name: "Masai",
    industry: "Brewing Innovation",
    country: "India",
    year: "2024",
    tags: ["Brewing", "Manufacturing", "R&D"],
    blurb:
      "Masai is an Indian brewing innovation studio pioneering new fermentation processes and craft beverage experiences built specifically for Indian palates — operating across India since 2024.",
    image: beverage,
    alt: "Masai brewing innovation studio craft fermentation beverage bottle designed for Indian palates, Est. 2024",
    title: "Masai | Brewing Innovation Studio | India | Est. 2024",
    href: "/ventures/masai",
  },
  {
    id: "adatto",
    editorialPhrase: "Made to move, made to endure.",
    editorialSummary: "Performance apparel designed in Jaipur, India.",
    name: "Adatto",
    industry: "Athleisure",
    country: "India",
    year: "2024",
    tags: ["Apparel", "DTC", "Lifestyle"],
    blurb:
      "Adatto is an Indian performance athleisure brand crafting technical fabric clothing designed in Jaipur and worn worldwide built for athletes and everyday movers who refuse to compromise on quality.",
    image: apparel,
    alt: "Adatto performance athleisure technical fabric joggers and sweatshirt designed in Jaipur India for worldwide wear",
    title: "Adatto | Performance Athleisure India | Designed in Jaipur | Est. 2024",
    href: "/ventures/adatto",
  },
  {
    id: "arnika",
    editorialPhrase: "Built into the fabric of what comes next.",
    editorialSummary: "Textile manufacturing with an integrated production focus.",
    name: "Arnika Textiles",
    industry: "Textile Manufacturing",
    country: "India",
    year: "2024",
    tags: ["Manufacturing", "Textiles", "Export"],
    blurb:
      "Arnika Textiles is an India-based vertically integrated textile manufacturer supplying premium fabrics to global apparel and home brands built on precision manufacturing and end-to-end supply chain control since 2024.",
    image: factory,
    alt: "Arnika Textiles fabric rolls vertically integrated textile manufacturing facility in India supplying global apparel and home brands",
    title: "Arnika Textiles | Textile Manufacturer India | Global Supply | Est. 2024",
    href: "/ventures/arnika-textiles",
  },
];

export const MILESTONES = [
  {
    year: "2011",
    title: "Engineering Foundation",
    body: "An engineering background laid the foundation for a practical, systems-led approach.",
  },
  {
    year: "2023",
    title: "New consumer ventures",
    body: "Delhi 6 and Volt 50000 mark an expansion into brewing and beverages.",
  },
  {
    year: "2024",
    title: "Beyond consumer brands",
    body: "Adatto, Masai and Arnika Textiles extend the portfolio into apparel, brewing and manufacturing.",
  },
  {
    year: "2025",
    title: "A wider portfolio",
    body: "SR18 Gaming adds a digital entertainment business to the group.",
  },
  {
    year: "Now",
    title: "Building what comes next",
    body: "Continuing to develop ventures and partnerships across the UAE and India.",
  },
];

export const PRINCIPLES = [
  {
    n: "01",
    title: "Vision",
    body: "See the industry ten years out — then build backwards with discipline.",
  },
  {
    n: "02",
    title: "Execution",
    body: "Strategy without operations is theatre. Ship, measure, iterate, refine.",
  },
  {
    n: "03",
    title: "Trust",
    body: "The cap table, the supplier and the customer are all long-term relationships.",
  },
  { n: "04", title: "Longevity", body: "Build companies meant to outlast their founders." },
];

export const CITIES = [
  { name: "Dubai", x: 32, y: 46, country: "UAE", focus: "HQ · Beverages · Gaming" },
  { name: "Abu Dhabi", x: 36, y: 52, country: "UAE", focus: "Investments · Partnerships" },
  { name: "Delhi", x: 60, y: 38, country: "India", focus: "Delhi 6 · Consumer" },
  { name: "Jaipur", x: 58, y: 46, country: "India", focus: "Adatto · Arnika · Textiles" },
  { name: "Mumbai", x: 56, y: 56, country: "India", focus: "Distribution · Media" },
];

export const TESTIMONIALS = [
  {
    quote:
      "Rahul builds the way old industrialists used to — patiently, with deep conviction in operations and people.",
    name: "A. Mehra",
    role: "Family Office Partner, Dubai",
  },
  {
    quote:
      "Few founders move this fluidly between consumer brands, manufacturing and technology. The connective tissue is real.",
    name: "R. Khanna",
    role: "Distribution Partner, India",
  },
  {
    quote:
      "Working with the Tanwar group feels like working with one of the next generation of Indian industrial houses.",
    name: "S. Iyer",
    role: "Supplier · Textiles",
  },
  {
    quote:
      "Sharp on strategy, surgical on execution. Rahul's ventures consistently outperform their stage.",
    name: "M. Al Hashimi",
    role: "Investor, Abu Dhabi",
  },
];

export const INSIGHTS = [
  { tag: "Gaming", title: "Why the next billion gamers will be South-Asian.", read: "8 min" },
  { tag: "Beverages", title: "Craft beer is becoming India's coffee moment.", read: "6 min" },
  {
    tag: "Manufacturing",
    title: "Vertical integration is back — and it's a moat.",
    read: "11 min",
  },
  { tag: "UAE × India", title: "A new corridor for consumer capital.", read: "9 min" },
];
