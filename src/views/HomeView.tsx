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
import "@/home-redesign.css";
import "@/home-v4.css";
import "@/home-v5.css";
import "@/home-v6.css";

function Philosophy({ content }: { content: PageCmsContent }) {
  const philosophy = content.sections.philosophy as {
    eyebrow?: string;
    quote?: string;
    attribution?: string;
  };
  const quote = philosophy?.quote || BUSINESS_PHILOSOPHY_QUOTE;
  return (
    <section
      className="rt-belief rt-surface-sheet"
      id="philosophy"
      data-home-tone="dark"
      aria-labelledby="rt-belief-title"
    >
      <div className="rt-shell">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">{philosophy?.eyebrow || "Business philosophy"}</span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          {/* <span className="rt-caption-aside">The approach</span> */}
        </div>
        <div className="rt-belief-body">
          {/* <p className="rt-belief-overline">The thinking behind the work.</p> */}
          <h2 className="rt-belief-quote" id="rt-belief-title" data-belief-quote aria-label={quote}>
            {quote
              .split(/\s+/)
              .filter(Boolean)
              .map((word, index) => (
                <span
                  className="rt-belief-word"
                  data-reading-word
                  aria-hidden="true"
                  key={`${index}-${word}`}
                >
                  {word}{" "}
                </span>
              ))}
          </h2>
          <div className="rt-belief-signature">
            {/* <span className="rt-belief-signature-rule" aria-hidden="true" /> */}
            <span>{philosophy?.attribution || "A long-term view"}</span>
          </div>
        </div>
      </div>
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
  const email = content.contactEmail || "hello@rahultanwar.com";
  const linkedin = content.socialLinks.linkedin?.startsWith("https://")
    ? content.socialLinks.linkedin
    : "https://www.linkedin.com/in/rahul-tanwar-350a13279/";

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
      className="rt-contact relative overflow-hidden bg-chapter py-[clamp(7rem,12vw,12rem)] text-chapter-text"
      data-home-tone="dark"
    >
      <div className="relative mx-auto grid w-full max-w-[1680px] gap-16 px-6 md:grid-cols-[.85fr_.65fr] md:gap-[clamp(4rem,10vw,10rem)] md:px-[clamp(24px,5.15vw,94px)]">
        <div data-reveal="left">
          <p className="text-xs font-semibold uppercase tracking-[0.135em] text-copy">
            {contact?.eyebrow || "Open to meaningful conversations"}
          </p>
          <h2 className="mt-8 max-w-[8ch] text-[clamp(3rem,5.7vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.05em]">
            {contact?.titleLead || "What's worth"}{" "}
            <span>{contact?.titleEmphasis || "building?"}</span>
          </h2>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-copy">
            {contact?.description ||
              "For partnerships, distribution, media and investment conversations across the portfolio."}
          </p>
          <a
            className="mt-[clamp(3rem,5vw,5rem)] inline-flex items-center gap-5 border-b border-ink pb-2.5 text-[clamp(1rem,1.35vw,1.25rem)]"
            href={`mailto:${email}`}
          >
            {email}
            <ArrowUpRight size={23} strokeWidth={1.3} />
          </a>
          <a
            className="mt-8 flex w-fit items-center gap-2.5 text-sm text-copy"
            href={linkedin}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Linkedin size={16} strokeWidth={1.6} /> LinkedIn <ArrowUpRight size={13} />
          </a>
        </div>
        <form
          className="self-start border-t border-hairline [&_label]:text-xs [&_label]:font-semibold [&_label]:text-copy"
          onSubmit={submit}
          data-reveal="right"
        >
          <div className="flex flex-col gap-3 border-b border-hairline py-5 focus-within:border-ink">
            <label htmlFor="rt-name">Name</label>
            <input
              id="rt-name"
              name="name"
              type="text"
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-copy"
              placeholder="Your name"
              required
            />
          </div>
          <div className="flex flex-col gap-3 border-b border-hairline py-5 focus-within:border-ink">
            <label htmlFor="rt-email">Email</label>
            <input
              id="rt-email"
              name="email"
              type="email"
              className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-copy"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="flex flex-col gap-3 border-b border-hairline py-5 focus-within:border-ink">
            <label htmlFor="rt-inquiry">I'm reaching out about</label>
            <select
              className="w-full appearance-none border-0 bg-transparent p-0 text-base text-ink outline-none"
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
          <div className="flex flex-col gap-3 border-b border-hairline py-5 focus-within:border-ink">
            <label htmlFor="rt-message">Your message</label>
            <textarea
              id="rt-message"
              name="message"
              className="w-full resize-y border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-copy"
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
            <p className="mt-5 text-sm leading-relaxed" role="alert">
              {error} <a href={`mailto:${email}`}>Email directly ↗</a>
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-8 flex min-h-14 w-full items-center justify-between border-0 bg-chapter-text px-6 text-sm font-semibold text-chapter transition-colors hover:bg-chapter-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending message…" : contact?.submitText || "Send an enquiry"}
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <p className="mt-5 text-xs leading-relaxed text-copy [&_a]:underline">
            By submitting, you agree to the handling of your information described in our{" "}
            <a href="/privacy">privacy policy</a>.
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
      <EditorialHeader content={content} />
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
