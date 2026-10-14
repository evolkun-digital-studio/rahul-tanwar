"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Linkedin } from "lucide-react";
import { EditorialFooter } from "@/components/site/EditorialFooter";
import { EditorialHeader } from "@/components/site/EditorialHeader";
import { EditorialMotion } from "@/components/site/EditorialMotion";
import { Hero } from "@/components/home/Hero";
import { OnBuilding } from "@/components/home/OnBuilding";
import { Ecosystem } from "@/components/home/Ecosystem";
import { Corridor } from "@/components/home/Corridor";
import { Founder } from "@/components/home/Founder";
import { Milestones } from "@/components/home/Milestones";
import { BUSINESS_PHILOSOPHY_QUOTE, type PageCmsContent } from "@/lib/cms";
import { SectionCaption } from "@/components/home/SectionCaption";
import { Shell } from "@/components/site/Shell";
import { contactEmail, linkedinUrl } from "@/lib/siteLinks";
import { cn } from "@/lib/utils";
import "@/home-redesign.css";
import "@/home-v4.css";
import "@/home-v5.css";
import "@/home-v6.css";

/* The dark close (philosophy + contact): the role tokens flip, so every utility inside
   (text-ink, text-body, border-hairline, outline-accent …) follows automatically. */
const CHAPTER =
  "bg-chapter text-chapter-text selection:text-chapter [--color-ink:var(--color-chapter-text)] [--color-body:var(--color-chapter-muted)] [--color-muted:var(--color-chapter-muted)] [--color-accent:var(--color-chapter-accent)] [--color-hairline:color-mix(in_srgb,var(--color-chapter-text)_18%,transparent)]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-current focus-visible:outline-offset-4";
const FIELD =
  "flex flex-col gap-3 border-b border-hairline py-5 [transition:border-color_0.4s_ease] focus-within:border-ink";
const INPUT =
  "w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-body";

function Philosophy({ content }: { content: PageCmsContent }) {
  const philosophy = content.sections.philosophy as {
    eyebrow?: string;
    quote?: string;
    attribution?: string;
  };
  const quote = philosophy?.quote || BUSINESS_PHILOSOPHY_QUOTE;
  return (
    <section
      className={cn(CHAPTER, "relative z-3 min-h-0 py-[var(--rt-section-space)]")}
      id="philosophy"
      data-home-tone="dark"
      aria-labelledby="rt-belief-title"
    >
      <Shell>
        <SectionCaption eyebrow={philosophy?.eyebrow || "Business philosophy"} />
        <div className="mt-[clamp(39px,4.35vw,67px)] mr-0 mb-0 ml-auto max-w-[1050px]">
          <h2
            className="m-0 max-w-[1060px] text-[clamp(34px,8vw,48px)] leading-[1.12] font-[420] tracking-[-0.015em] text-balance text-ink min-[621px]:text-[clamp(40px,4.6vw,70px)]"
            id="rt-belief-title"
            data-belief-quote
            aria-label={quote}
          >
            {quote
              .split(/\s+/)
              .filter(Boolean)
              .map((word, index) => (
                <span
                  className="inline will-change-[opacity]"
                  data-reading-word
                  aria-hidden="true"
                  key={`${index}-${word}`}
                >
                  {word}{" "}
                </span>
              ))}
          </h2>
          <div className="mt-[clamp(31px,3.3vw,53px)] flex items-center gap-[25px] text-[13px] text-body">
            <span>{philosophy?.attribution || "A long-term view"}</span>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Contact({ content }: { content: PageCmsContent }) {
  const contact = content.sections.contact as
    | {
        eyebrow?: string;
        titleLead?: string;
        titleEmphasis?: string;
        description?: string;
        submitText?: string;
        successMessage?: string;
      }
    | undefined;
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const email = contactEmail(content);
  const linkedin = linkedinUrl(content);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          service: String(data.get("service") || "").trim(),
          message: String(data.get("message") || "").trim(),
          website: String(data.get("website") || ""),
        }),
      });
      if (!response.ok)
        throw new Error(
          "The form is temporarily unavailable. Please use the email address alongside it.",
        );
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please email us directly.",
      );
    }
  }

  return (
    <section
      id="contact"
      className={cn(CHAPTER, "relative overflow-hidden py-[var(--rt-section-space)]")}
      data-home-tone="dark"
    >
      <div className="relative mx-auto grid w-full max-w-[1680px] gap-16 border-t-hairline px-6 pt-[clamp(38px,5vw,70px)] md:grid-cols-[.85fr_.65fr] md:gap-[clamp(4rem,10vw,10rem)] md:px-[clamp(24px,5.15vw,94px)]">
        <div data-reveal="left">
          <p className="text-xs font-semibold tracking-[0.135em] text-body uppercase">
            {contact?.eyebrow || "Open to meaningful conversations"}
          </p>
          <h2 className="mt-8 max-w-[10ch] text-[clamp(2.5rem,9vw,3.5rem)] leading-[1.02] font-[450] tracking-[-0.015em] text-ink min-[621px]:text-[clamp(3rem,5.7vw,5.5rem)] min-[621px]:tracking-[-0.017em]">
            {contact?.titleLead || "What's worth"}{" "}
            <span>{contact?.titleEmphasis || "building?"}</span>
          </h2>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-body">
            {contact?.description ||
              "For partnerships, distribution, media and investment conversations across the portfolio."}
          </p>
          <a
            className={cn(
              "mt-[clamp(3rem,5vw,5rem)] inline-flex items-center gap-5 border-b border-ink pb-2.5 text-[clamp(1rem,1.35vw,1.25rem)] text-ink",
              FOCUS,
            )}
            href={`mailto:${email}`}
          >
            {email}
            <ArrowUpRight size={23} strokeWidth={1.3} />
          </a>
          <a
            className={cn("mt-8 flex w-fit items-center gap-2.5 text-sm text-ink", FOCUS)}
            href={linkedin}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Linkedin size={16} strokeWidth={1.6} /> LinkedIn <ArrowUpRight size={13} />
          </a>
        </div>
        <form
          className="self-start border-t border-hairline [&_label]:text-xs [&_label]:font-semibold [&_label]:text-body"
          onSubmit={submit}
          data-reveal="right"
        >
          <div className={FIELD}>
            <label htmlFor="rt-name">Name</label>
            <input
              id="rt-name"
              name="name"
              type="text"
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className={INPUT}
              placeholder="Your name"
              required
            />
          </div>
          <div className={FIELD}>
            <label htmlFor="rt-email">Email</label>
            <input
              id="rt-email"
              name="email"
              type="email"
              className={INPUT}
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
          <div className={FIELD}>
            <label htmlFor="rt-inquiry">I'm reaching out about</label>
            <select
              className={cn(
                "w-full appearance-none border-0 bg-transparent p-0 text-base text-ink outline-none [&_option]:bg-chapter [&_option]:text-chapter-text",
                FOCUS,
              )}
              id="rt-inquiry"
              name="service"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select a topic
              </option>
              <option value="Partnership">Partnership</option>
              <option value="Investment">Investment</option>
              <option value="Distribution">Distribution</option>
              <option value="Media">Media</option>
              <option value="Other enquiry">Something else</option>
            </select>
          </div>
          <div className={FIELD}>
            <label htmlFor="rt-message">Your message</label>
            <textarea
              id="rt-message"
              name="message"
              className={cn(INPUT, "resize-y")}
              placeholder="Tell us a little about the opportunity"
              minLength={10}
              maxLength={3000}
              rows={3}
              required
            />
          </div>
          <input
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute size-px opacity-0"
          />
          {status === "success" ? (
            <p className="mt-5 text-sm leading-relaxed text-ink" role="status">
              {contact?.successMessage ||
                "Your message was submitted successfully. Thank you for reaching out."}
            </p>
          ) : null}
          {status === "error" ? (
            <p
              className="mt-5 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-alert)_45%,var(--color-chapter-text))]"
              role="alert"
            >
              {error}{" "}
              <a className={cn("text-ink", FOCUS)} href={`mailto:${email}`}>
                Email directly ↗
              </a>
            </p>
          ) : null}
          <button
            type="submit"
            className={cn(
              "mt-8 flex min-h-14 w-full items-center justify-between border-0 bg-chapter-text px-6 text-sm font-semibold text-chapter [transition:background-color_0.35s_ease,transform_0.5s_cubic-bezier(0.19,1,0.22,1)] hover:bg-chapter-accent enabled:hover:[transform:translateY(-2px)] disabled:cursor-not-allowed disabled:opacity-50",
              FOCUS,
            )}
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending message…" : contact?.submitText || "Send an enquiry"}
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <p className="mt-5 text-xs leading-relaxed text-body">
            By submitting, you agree to the handling of your information described in our{" "}
            <a className={cn("text-ink underline", FOCUS)} href="/privacy">
              privacy policy
            </a>
            .
          </p>
        </form>
      </div>
    </section>
  );
}

export function HomeView({ content }: { content: PageCmsContent }) {
  return (
    <div className="rt-home min-h-svh overflow-x-clip bg-page text-ink">
      <EditorialMotion intro introName={content.header.brand || "Rahul Tanwar"} />
      <EditorialHeader content={content} heroAware />
      <main>
        <Hero content={content} />
        <OnBuilding content={content} />
        <Ecosystem content={content} />
        <Corridor content={content} />
        <Founder content={content} />
        <Milestones />
        <Philosophy content={content} />
        <Contact content={content} />
      </main>
      <EditorialFooter content={content} />
    </div>
  );
}
