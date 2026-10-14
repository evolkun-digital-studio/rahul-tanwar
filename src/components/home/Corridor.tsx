import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { ScrollReveal } from "@/components/motion-library/react-bits/ScrollReveal";
import { Fade } from "@/components/motion-library/animate-ui/Fade";
import { SlidingNumber } from "@/components/motion-library/animate-ui/SlidingNumber";
import { WorldMap } from "@/components/motion-library/inspira-ui/WorldMap";
import { CORRIDOR_MAP } from "@/components/motion-library/inspira-ui/corridorMapData";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import type { PageCmsContent } from "@/lib/cms";
import { useMediaQuery, useReducedMotionPreference } from "@/lib/motion";
import { useZonedClock } from "@/lib/useZonedClock";

function Clock({ timeZone, reduced }: { timeZone: string; reduced: boolean }) {
  const { hours, minutes } = useZonedClock(timeZone);
  return (
    <span className="rt-clock">
      <SlidingNumber value={hours} digits={2} reduced={reduced} />
      <span className="rt-clock-colon" aria-hidden="true">
        :
      </span>
      <SlidingNumber value={minutes} digits={2} reduced={reduced} />
    </span>
  );
}

export function Corridor({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const compact = useMediaQuery("(max-width: 620px)");
  const global = content.sections.global as
    | {
        eyebrow?: string;
        description?: string;
        statementLead?: string;
        statementEmphasis?: string;
        statementDescription?: string;
      }
    | undefined;
  const dubai = content.images.corridorDubai || {
    url: "/images/corridor/dubai-skyline.jpg",
    alt: "Dubai skyline",
  };
  const india = content.images.corridorIndia || {
    url: "/images/corridor/delhi-skyline.jpg",
    alt: "View across Delhi",
  };
  const mapView: [number, number, number, number] = compact
    ? [12, 0, 50, 40]
    : [0, 0, CORRIDOR_MAP.width, CORRIDOR_MAP.height];

  return (
    <section
      className="rt-markets"
      id="presence"
      data-home-tone="light"
      aria-labelledby="rt-markets-title"
    >
      <div className="rt-shell">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">{global?.eyebrow || "Where it happens"}</span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          <span className="rt-caption-aside">UAE — India</span>
        </div>
        <div className="rt-markets-lead">
          <h2 className="rt-section-title" id="rt-markets-title">
            <SplitText
              text="Dubai to India."
              className="rt-split-heading"
              splitType="lines, chars"
              mask="lines"
              from={{ yPercent: 110, rotate: 4 }}
              to={{ yPercent: 0, rotate: 0 }}
              stagger={0.03}
              duration={1.2}
            />
            <SplitText
              text="Built across both."
              className="rt-split-heading rt-type-muted"
              splitType="lines, words"
              mask="lines"
              from={{ yPercent: 105 }}
              to={{ yPercent: 0 }}
              stagger={0.08}
              duration={1.2}
              delay={0.22}
            />
          </h2>
          <TextEffect preset="fade-in-blur" speedReveal={1.5} reduced={reduced}>
            {global?.description ||
              "Based in Dubai. Building products, teams and partnerships across the UAE and India."}
          </TextEffect>
        </div>

        <div className="rt-corridor">
          <WorldMap className="rt-corridor-map" viewBox={mapView} reduced={reduced} />
          <dl className="rt-corridor-facts">
            <Fade as="div" className="rt-corridor-fact" initialOpacity={0} y={18} delay={0.05}>
              <dt>Time difference</dt>
              <dd>
                +1:30<small>hrs</small>
              </dd>
            </Fade>
            <Fade as="div" className="rt-corridor-fact" initialOpacity={0} y={18} delay={0.13}>
              <dt>Dubai now</dt>
              <dd>
                <Clock timeZone="Asia/Dubai" reduced={reduced} />
                <small>GST</small>
              </dd>
            </Fade>
            <Fade as="div" className="rt-corridor-fact" initialOpacity={0} y={18} delay={0.21}>
              <dt>New Delhi now</dt>
              <dd>
                <Clock timeZone="Asia/Kolkata" reduced={reduced} />
                <small>IST</small>
              </dd>
            </Fade>
          </dl>
        </div>

        <div className="rt-markets-gallery" data-market-gallery>
          <figure className="rt-market rt-market--dubai" data-market-figure>
            <div className="rt-market-viewport" data-image-reveal>
              <img
                src={dubai.url}
                alt={dubai.alt}
                loading="lazy"
                decoding="async"
                data-image-depth
              />
              <SplitText
                text="Dubai"
                className="rt-market-name"
                splitType="lines, chars"
                mask="lines"
                from={{ yPercent: 120 }}
                to={{ yPercent: 0 }}
                stagger={0.05}
                delay={0.45}
                start="top 75%"
              />
            </div>
            <figcaption>
              <span>United Arab Emirates</span>
              <span>Dubai</span>
            </figcaption>
          </figure>
          <figure className="rt-market rt-market--india" data-market-figure>
            <div className="rt-market-viewport" data-image-reveal>
              <img
                src={india.url}
                alt={india.alt}
                loading="lazy"
                decoding="async"
                data-image-depth
              />
              <SplitText
                text="India"
                className="rt-market-name"
                splitType="lines, chars"
                mask="lines"
                from={{ yPercent: 120 }}
                to={{ yPercent: 0 }}
                stagger={0.05}
                delay={0.45}
                start="top 75%"
              />
            </div>
            <figcaption>
              <span>India</span>
              <span>New Delhi</span>
            </figcaption>
          </figure>
        </div>
        <div className="rt-markets-close" data-section-outro>
          <h3>
            <ScrollReveal text={global?.statementLead || "Two markets."} />
            <br />
            <span>
              <ScrollReveal
                text={global?.statementEmphasis || "A shared direction."}
                baseRotation={0}
              />
            </span>
          </h3>
          <Fade as="p" initialOpacity={0} y={14}>
            {global?.statementDescription ||
              "Connected by people, products and the work of building businesses."}
          </Fade>
        </div>
      </div>
    </section>
  );
}
