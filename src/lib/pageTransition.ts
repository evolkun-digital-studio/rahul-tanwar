import gsap from "gsap";
import { VENTURES } from "@/lib/data";

/**
 * Barba.js-style page transitions for a client-rendered React site.
 *
 * Barba swaps server-rendered HTML containers, which would fight React's
 * renderer here, so the same leave → navigate → enter pattern is implemented
 * with GSAP: a curtain rises over the page with the destination's name, the
 * browser loads the next page, and the curtain lifts once React has painted.
 * The curtain markup lives in index.html so it covers the very first paint.
 */
const KEY = "rt-page-transition";
const EASE = "power4.inOut";

function labelFor(anchor: HTMLAnchorElement, url: URL) {
  if (anchor.dataset.transitionLabel) return anchor.dataset.transitionLabel;
  const venture = VENTURES.find((item) => item.href === url.pathname);
  if (venture) return venture.name;
  if (url.pathname === "/") return "Rahul Tanwar";
  if (url.pathname === "/privacy") return "Privacy";
  return (anchor.textContent || "").trim().slice(0, 32) || "Rahul Tanwar";
}

function nodes() {
  const curtain = document.querySelector<HTMLElement>("[data-page-curtain]");
  const panel = curtain?.querySelector<HTMLElement>("[data-curtain-panel]");
  const edgeTop = curtain?.querySelector<SVGElement>("[data-curtain-edge-top]");
  const edgeBottom = curtain?.querySelector<SVGElement>("[data-curtain-edge-bottom]");
  const label = curtain?.querySelector<HTMLElement>("[data-curtain-label]");
  return { curtain, panel, edgeTop, edgeBottom, label };
}

function reset() {
  const { curtain, panel, edgeTop, edgeBottom, label } = nodes();
  document.documentElement.classList.remove("rt-page-entering", "rt-page-leaving");
  document.documentElement.style.removeProperty("--rt-curtain-label");
  if (curtain) gsap.set(curtain, { clearProps: "visibility" });
  if (panel) gsap.set(panel, { clearProps: "transform" });
  if (edgeTop) gsap.set(edgeTop, { clearProps: "transform" });
  if (edgeBottom) gsap.set(edgeBottom, { clearProps: "transform" });
  if (label) gsap.set(label, { clearProps: "transform,opacity" });
}

function enter(reduced: boolean) {
  const root = document.documentElement;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* optional */
  }
  if (!root.classList.contains("rt-page-entering")) return;
  const { curtain, panel, edgeBottom, label } = nodes();
  if (!curtain || !panel || reduced) {
    reset();
    return;
  }
  gsap.set(curtain, { visibility: "visible" });
  gsap.set(panel, { yPercent: 0 });
  const timeline = gsap.timeline({ delay: 0.15, onComplete: reset });
  if (label)
    timeline.to(label, { yPercent: -70, opacity: 0, duration: 0.45, ease: "power3.in" }, 0);
  timeline.to(panel, { yPercent: -112, duration: 1.05, ease: EASE }, 0.2);
  if (edgeBottom) {
    timeline
      .fromTo(edgeBottom, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power2.out" }, 0.2)
      .to(edgeBottom, { scaleY: 0, duration: 0.55, ease: "power2.in" }, 0.7);
  }
}

function leave(href: string, label: string) {
  const { curtain, panel, edgeTop, label: labelNode } = nodes();
  if (!curtain || !panel) {
    window.location.href = href;
    return;
  }
  try {
    sessionStorage.setItem(KEY, label);
  } catch {
    /* optional */
  }
  if (labelNode) labelNode.textContent = label;
  document.documentElement.classList.add("rt-page-leaving");
  gsap.set(curtain, { visibility: "visible" });
  const timeline = gsap.timeline({ onComplete: () => window.location.assign(href) });
  timeline.fromTo(panel, { yPercent: 112 }, { yPercent: 0, duration: 0.85, ease: EASE }, 0);
  if (edgeTop)
    timeline.fromTo(edgeTop, { scaleY: 1 }, { scaleY: 0, duration: 0.85, ease: EASE }, 0);
  if (labelNode)
    timeline.fromTo(
      labelNode,
      { yPercent: 70, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.6, ease: "expo.out" },
      0.42,
    );
}

let initialised = false;

export function initPageTransitions() {
  if (initialised) return;
  initialised = true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Lift the curtain once React has painted the destination.
  requestAnimationFrame(() => requestAnimationFrame(() => enter(reduced)));

  // Returning through the back/forward cache must never show a stale curtain.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) reset();
  });

  document.addEventListener("click", (event) => {
    if (reduced || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element | null)?.closest?.(
      "a[href]",
    ) as HTMLAnchorElement | null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;
    const samePage =
      url.pathname.replace(/\/+$/, "") === window.location.pathname.replace(/\/+$/, "");
    if (samePage) return; // in-page anchors stay with Lenis
    event.preventDefault();
    leave(url.href, labelFor(anchor, url));
  });
}
