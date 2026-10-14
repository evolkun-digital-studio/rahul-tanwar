import { useEffect, useMemo, useRef } from "react";
import {
  animate,
  createTimeline,
  stagger,
  svg,
  utils,
  type JSAnimation,
  type Timeline,
} from "animejs";
import { CORRIDOR_MAP } from "./corridorMapData";

/**
 * Inspira UI / World Map — https://inspira-ui.com/docs/components/visualization/world-map
 * Source: github.com/unovue/inspira-ui › app/components/inspira/ui/world-map/WorldMap.vue
 * (Vue port of Aceternity's World Map; ported here to React.)
 *
 * Kept: `dotted-map` diagonal dot grid, curved quadratic route between two
 * lat/lng points (`createCurvedPath`), path-length draw-in, pulsing pins.
 * Changed:
 *  - the grid is pre-computed for the Gulf → South Asia corridor
 *    (scripts/build-corridor-map.mjs) so no GeoJSON ships to the browser;
 *  - choreography runs on anime.js v4: dots ripple outward from Dubai in
 *    distance bands (stagger), the route draws with `svg.createDrawable`,
 *    and a small courier travels it on `svg.createMotionPath`;
 *  - labels are HTML (crisp at any size, translatable, readable by AT).
 */
type ViewBox = [number, number, number, number];

type WorldMapProps = {
  viewBox?: ViewBox;
  className?: string;
  reduced?: boolean;
  fromLabel?: string;
  fromMeta?: string;
  toLabel?: string;
  toMeta?: string;
};

const RING = 2.4;
const DOT = 0.21;

function ringPaths() {
  const { points, pins } = CORRIDOR_MAP;
  const origin = pins.dubai;
  const rings: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    const ring = Math.floor(Math.hypot(x - origin.x, y - origin.y) / RING);
    rings[ring] =
      (rings[ring] || "") +
      `M${(x - DOT).toFixed(2)} ${y}a${DOT} ${DOT} 0 1 0 ${DOT * 2} 0a${DOT} ${DOT} 0 1 0 ${-DOT * 2} 0`;
  }
  return rings.filter(Boolean);
}

export function WorldMap({
  viewBox = [0, 0, CORRIDOR_MAP.width, CORRIDOR_MAP.height],
  className = "",
  reduced = false,
  fromLabel = "Dubai",
  fromMeta = "UAE · Base",
  toLabel = "New Delhi",
  toMeta = "India",
}: WorldMapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rings = useMemo(ringPaths, []);
  const { dubai, delhi } = CORRIDOR_MAP.pins;
  const control = { x: (dubai.x + delhi.x) / 2, y: Math.min(dubai.y, delhi.y) - 8.5 };
  const route = `M ${dubai.x} ${dubai.y} Q ${control.x} ${control.y} ${delhi.x} ${delhi.y}`;
  const [vx, vy, vw, vh] = viewBox;
  const place = (point: { x: number; y: number }) => ({
    left: `${((point.x - vx) / vw) * 100}%`,
    top: `${((point.y - vy) / vh) * 100}%`,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) {
      root?.classList.add("is-drawn");
      return;
    }
    const ringEls = root.querySelectorAll<SVGPathElement>("[data-map-ring]");
    const routeEl = root.querySelector<SVGPathElement>("[data-map-route]");
    const pins = root.querySelectorAll<SVGGElement>("[data-map-pin]");
    const labels = root.querySelectorAll<HTMLElement>("[data-map-label]");
    const courier = root.querySelector<SVGCircleElement>("[data-map-courier]");
    if (!routeEl || !courier) return;

    const drawable = svg.createDrawable(routeEl);
    utils.set(ringEls, { opacity: 0, scale: 0.94 });
    utils.set(drawable, { draw: "0 0" });
    utils.set(pins, { scale: 0 });
    utils.set(labels, { opacity: 0, translateY: 10 });
    utils.set(courier, { opacity: 0 });

    let timeline: Timeline | undefined;
    let travel: JSAnimation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        root.classList.add("is-drawn");
        timeline = createTimeline({ defaults: { ease: "outExpo" } })
          .add(
            ringEls,
            { opacity: [0, 1], scale: [0.94, 1], duration: 1100, delay: stagger(55) },
            0,
          )
          .add(pins[0], { scale: [0, 1], duration: 700, ease: "outBack(2.2)" }, 160)
          .add(labels[0], { opacity: [0, 1], translateY: [10, 0], duration: 800 }, 260)
          .add(drawable, { draw: ["0 0", "0 1"], duration: 1700, ease: "inOutQuart" }, 520)
          .add(pins[1], { scale: [0, 1], duration: 700, ease: "outBack(2.2)" }, 2050)
          .add(labels[1], { opacity: [0, 1], translateY: [10, 0], duration: 800 }, 2150)
          .call(() => {
            travel = animate(courier, {
              ...svg.createMotionPath(routeEl),
              opacity: [
                { to: 1, duration: 260 },
                { to: 1, duration: 2000 },
                { to: 0, duration: 340 },
              ],
              duration: 2600,
              ease: "inOutSine",
              loop: true,
              loopDelay: 1600,
            });
          }, 2600);
      },
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      timeline?.revert();
      travel?.revert();
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className={`ins-world-map ${className}`}
      style={{ aspectRatio: `${vw} / ${vh}` }}
      data-library="inspira-ui-world-map"
      role="img"
      aria-label={`${fromLabel} to ${toLabel} operating corridor`}
    >
      <svg
        viewBox={viewBox.join(" ")}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="ins-route-gradient"
            gradientUnits="userSpaceOnUse"
            x1={dubai.x}
            y1="0"
            x2={delhi.x}
            y2="0"
          >
            <stop offset="0%" stopColor="var(--ins-route-start)" />
            <stop offset="100%" stopColor="var(--ins-route-end)" />
          </linearGradient>
        </defs>
        <g className="ins-map-dots">
          {rings.map((d, index) => (
            <path
              key={index}
              d={d}
              data-map-ring=""
              style={{ transformOrigin: `${dubai.x}px ${dubai.y}px` }}
            />
          ))}
        </g>
        <path className="ins-map-ghost" d={route} />
        <path className="ins-map-route" d={route} data-map-route="" />
        <circle className="ins-map-courier" r="0.5" cx="0" cy="0" data-map-courier="" />
        {[dubai, delhi].map((pin, index) => (
          <g
            key={index}
            className="ins-map-pin"
            data-map-pin=""
            style={{ transformOrigin: `${pin.x}px ${pin.y}px` }}
          >
            <circle className="ins-map-pulse" cx={pin.x} cy={pin.y} r="0.46" />
            <circle className="ins-map-dot" cx={pin.x} cy={pin.y} r="0.46" />
          </g>
        ))}
      </svg>
      <span className="ins-map-label ins-map-label--from" style={place(dubai)} data-map-label="">
        <strong>{fromLabel}</strong>
        <span>{fromMeta}</span>
      </span>
      <span className="ins-map-label ins-map-label--to" style={place(delhi)} data-map-label="">
        <strong>{toLabel}</strong>
        <span>{toMeta}</span>
      </span>
    </div>
  );
}
