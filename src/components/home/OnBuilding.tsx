import { ScrollFloat } from "@/components/motion-library/react-bits/ScrollFloat";
import { ScrollReveal } from "@/components/motion-library/react-bits/ScrollReveal";
import { BlurText } from "@/components/motion-library/react-bits/BlurText";
import { ScrollVelocity } from "@/components/motion-library/react-bits/ScrollVelocity";
import { HighlightText } from "@/components/motion-library/animate-ui/HighlightText";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import { VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { useReducedMotionPreference } from "@/lib/motion";

const HIGHLIGHT = "do the work that lasts";
const MARQUEE_INDUSTRIES = [
  "Online gaming",
  "Craft beer",
  "Functional beverages",
  "Brewing",
  "Athleisure",
  "Textiles",
];

export function OnBuilding({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const intro = content.sections.introduction as
    | { eyebrow?: string; headline?: string; secondLine?: string; description?: string }
    | undefined;
  const ecosystem = content.sections.ecosystem as { ventures?: typeof VENTURES } | undefined;
  const ventures = ecosystem?.ventures?.length ? ecosystem.ventures : VENTURES;
  const description =
    intro?.description ||
    "Different industries, one approach: understand the market, stay close to the product and do the work that lasts.";
  const at = description.toLowerCase().indexOf(HIGHLIGHT);
  const before = at >= 0 ? description.slice(0, at).trimEnd() : description;
  const highlighted = at >= 0 ? description.slice(at) : "";

  const nameRow = (
    <>
      {ventures.map((venture) => (
        <span className="rt-marquee-item" key={venture.id}>
          {venture.name}
          <span className="rt-marquee-star" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </>
  );
  const industryRow = (
    <>
      {MARQUEE_INDUSTRIES.map((industry) => (
        <span className="rt-marquee-item" key={industry}>
          {industry}
          <span className="rt-marquee-dot" aria-hidden="true" />
        </span>
      ))}
    </>
  );

  return (
    <section
      className="rt-introduction rt-surface-sheet"
      id="introduction"
      data-home-tone="light"
      aria-labelledby="rt-intro-title"
    >
      <div className="rt-shell">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">{intro?.eyebrow || "On building"}</span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          <span className="rt-caption-aside">A way of thinking</span>
        </div>
        <h2 className="rt-intro-title" id="rt-intro-title">
          <span className="rt-type-mask rt-float-line">
            <ScrollFloat text={intro?.headline || "Build with intent."} />
          </span>
          <BlurText
            as="span"
            className="rt-intro-second rt-type-muted"
            text={intro?.secondLine || "Think long term."}
            delay={110}
            reduced={reduced}
          />
        </h2>
        <div className="rt-intro-bottom" data-section-outro>
          <TextEffect
            as="span"
            per="line"
            preset="slide"
            className="rt-intro-whisper"
            delay={0.15}
            reduced={reduced}
          >
            {"Across industries.\nAcross the UAE and India."}
          </TextEffect>
          <p className="rt-intro-reading">
            <ScrollReveal text={before} />
            {highlighted ? (
              <>
                {" "}
                <HighlightText
                  className="rt-intro-highlight"
                  text={highlighted}
                  reduced={reduced}
                />
              </>
            ) : null}
          </p>
        </div>
      </div>
      <ScrollVelocity
        className="rt-intro-marquee"
        label={`Ventures: ${ventures.map((venture) => venture.name).join(", ")}`}
        rows={[nameRow, industryRow]}
        rowClassName={(index) =>
          index ? "rt-marquee-row rt-marquee-row--muted" : "rt-marquee-row"
        }
        velocity={38}
        reduced={reduced}
      />
    </section>
  );
}
