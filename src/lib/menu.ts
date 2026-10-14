import { useSyncExternalStore } from "react";

/* One mobile menu for the whole site. The hero and the global header both
 * open it; the trigger is remembered so focus can return to it on close. */
let open = false;
let trigger: HTMLElement | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function openMenu(from?: HTMLElement | null) {
  if (open) return;
  trigger = from ?? null;
  open = true;
  emit();
}

export function closeMenu() {
  if (!open) return;
  open = false;
  emit();
}

export function toggleMenu(from?: HTMLElement | null) {
  if (open) closeMenu();
  else openMenu(from);
}

export function menuTrigger() {
  return trigger;
}

export function useMenuOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
    () => false,
  );
}
