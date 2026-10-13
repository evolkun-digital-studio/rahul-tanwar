import { useEffect, useState } from "react";

/**
 * One motion grammar for the whole homepage.
 * Every library component (React Bits, Animate UI, Inspira UI, motion-primitives)
 * reads its easing and timing from here so the page feels like one system.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // expo-out: reveals
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const; // wipes / curtains
export const GSAP_EASE_OUT = "expo.out";
export const GSAP_EASE_IN_OUT = "power4.inOut";
export const SPRING_SOFT = { stiffness: 140, damping: 22, mass: 0.6 } as const;

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isFineDesktop() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 851px) and (pointer: fine)").matches;
}

/* ---------------------------------------------------------------------------
 * Intro handshake. The greeting preloader (EditorialMotion) owns the first
 * seconds of the page; the hero waits for the curtain before it performs.
 * ------------------------------------------------------------------------- */
type Listener = () => void;
let introDone = false;
const listeners = new Set<Listener>();

export function markIntroDone() {
  if (introDone) return;
  introDone = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function resetIntro() {
  introDone = false;
}

export function onIntroDone(listener: Listener) {
  if (introDone) {
    listener();
    return () => undefined;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useIntroDone() {
  const [done, setDone] = useState(introDone);
  useEffect(() => onIntroDone(() => setDone(true)), []);
  return done;
}

export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? initial : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
