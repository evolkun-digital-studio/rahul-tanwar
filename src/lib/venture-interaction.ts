export function resolveDisplayedVenture(
  scrollIndex: number,
  hoveredIndex: number | null,
  desktop: boolean,
) {
  return desktop && hoveredIndex !== null ? hoveredIndex : scrollIndex;
}
