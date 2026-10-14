import { describe, expect, it } from "vitest";
import { resolveDisplayedVenture } from "./venture-interaction";

describe("resolveDisplayedVenture", () => {
  it("keeps the hovered venture selected while scroll position changes", () => {
    expect(resolveDisplayedVenture(4, 1, true)).toBe(1);
  });

  it("returns to the current scroll selection after hover ends", () => {
    expect(resolveDisplayedVenture(4, null, true)).toBe(4);
  });

  it("uses scroll selection on layouts without the desktop image stage", () => {
    expect(resolveDisplayedVenture(3, 1, false)).toBe(3);
  });
});
