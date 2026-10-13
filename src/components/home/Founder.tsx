import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { ScrollReveal } from "@/components/motion-library/react-bits/ScrollReveal";
import { TiltedCard } from "@/components/motion-library/react-bits/TiltedCard";
import { CountingNumber } from "@/components/motion-library/animate-ui/CountingNumber";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import { IMG, VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { useReducedMotionPreference } from "@/lib/motion";

const BIOGRAPHY = [
  "His portfolio spans gaming, brewing, beverages, apparel and manufacturing. Different categories, with the same focus on product and execution.",
  "He works across the ideas behind a brand and the operations that make it real — from what customers experience to how the business delivers it.",
  "The approach is practical: build with purpose, earn trust over time and keep improving what matters.",
];

export function Founder({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const [linkHover, setLinkHover] = useState(false);
  const about = content.sections.manBehind as
    | { eyebrow?: string; introduction?: string; paragraphs?: string[] }
    | undefined;
  const paragraphs = about?.paragraphs?.length ? about.paragraphs : BIOGRAPHY;
  const portrait = content.images.founder?.url || IMG.founder;
  const portraitAlt = content.images.founder?.alt || "Rahul Tanwar";
  const ecosystem = content.sections.ecosystem as { ventures?: typeof VENTURES } | undefined;
  const ventureCount = (ecosystem?.ventures?.length ? ecosystem.ventures : VENTURES).length;
  const stats = [
    { value: ventureCount, label: "Ventures" },
    { value: 5, label: "Industries" },
    { value: 2, label: "Markets" },
  ];

  return (
    <section
      className="rt-founder"
      id="about"
      data-home-tone="light"
      aria-labelledby="rt-founder-title"
    >
      <div className="rt-shell">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">{about?.eyebrow || "The Man Behind The Brand"}</span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          <span className="rt-caption-aside">The founder</span>
        </div>
        <h2 className="rt-section-title rt-founder-title" id="rt-founder-title">
          <SplitText
            text="Behind the brands,"
            className="rt-split-heading"
            splitType="lines, chars"
            mask="lines"
            from={{ yPercent: 110, rotate: 4 }}
            to={{ yPercent: 0, rotate: 0 }}
            stagger={0.025}
            duration={1.2}
          />
          <SplitText
            text="there is a builder."
            className="rt-split-heading rt-type-muted"
            splitType="lines, words"
            mask="lines"
            from={{ yPercent: 105 }}
            to={{ yPercent: 0 }}
            stagger={0.08}
            duration={1.2}
            delay={0.2}
          />
        </h2>
        <div className="rt-founder-columns">
          <figure className="rt-founder-photo" data-founder-photo>
            <TiltedCard caption="Rahul Tanwar — Founder" reduced={reduced} rotateAmplitude={6}>
              <div className="rt-founder-image" data-image-reveal>
                <img
                  src={portrait}
                  alt={portraitAlt}
                  loading="lazy"
                  decoding="async"
                  data-image-depth
                />
              </div>
            </TiltedCard>
            <figcaption>
              <span>Rahul Tanwar</span>
              <span>Founder / Entrepreneur</span>
            </figcaption>
          </figure>
          <div className="rt-founder-bio">
            <p className="rt-founder-lead">
              <ScrollReveal
                text={
                  about?.introduction ||
                  "Rahul Tanwar is a Dubai-based founder with businesses across the UAE and India."
                }
                start="top 90%"
                end="bottom 60%"
              />
            </p>
            {paragraphs.slice(0, 3).map((paragraph, index) => (
              <TextEffect
                key={`${index}-${paragraph.slice(0, 12)}`}
                className="rt-founder-paragraph"
                preset="blur"
                speedReveal={2.4}
                speedSegment={0.8}
                reduced={reduced}
              >
                {paragraph}
              </TextEffect>
            ))}
            <dl className="rt-founder-stats">
              {stats.map((stat, index) => (
                <div className="rt-founder-stat" key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>
                    <CountingNumber
                      number={stat.value}
                      padStart={2}
                      delay={index * 0.12}
                      reduced={reduced}
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <a
              className="rt-text-link"
              href="#milestones"
              data-soft-reveal
              onPointerEnter={() => setLinkHover(true)}
              onPointerLeave={() => setLinkHover(false)}
              onFocus={() => setLinkHover(true)}
              onBlur={() => setLinkHover(false)}
            >
              <RollingText text="Follow the journey" active={linkHover} reduced={reduced} />
              <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
