import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * React Bits / GridDistortion (David Haz) — https://reactbits.dev/backgrounds/grid-distortion
 * Source: github.com/DavidHDev/react-bits › src/ts-default/Backgrounds/GridDistortion
 *
 * Rendered with three.js (as in the original React Bits release): a cover-fit
 * image plane is displaced by a small float DataTexture "field". Pointer
 * velocity paints into the field and every cell relaxes back to rest.
 *
 * Production guards added for a founder homepage:
 *  - three.js is lazy-loaded after first paint; the <img> stays in the DOM for
 *    LCP, SEO and as the fallback (touch, reduced motion, no WebGL).
 *  - the RAF loop sleeps when the field is at rest or the canvas is off-screen.
 *  - the field is sampled with a smooth bilinear blend (`softness`) and each
 *    cell's displacement is capped (`maxShift`), so the portrait flexes like
 *    fabric instead of tearing — a founder's face is never warped. The
 *    original's intro scramble is deliberately not used on a portrait.
 */
type GridDistortionProps = {
  imageSrc: string;
  alt: string;
  title?: string;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
  grid?: number;
  /** brush radius as a fraction of the grid */
  mouse?: number;
  strength?: number;
  relaxation?: number;
  softness?: number;
  /** object-position of the portrait, 0–1 from left / top */
  focus?: [number, number];
  enabled?: boolean;
  /** max displacement in UV units — kept small so a face never warps */
  maxShift?: number;
  priority?: boolean;
  onReady?: () => void;
};

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uTexture;
uniform sampler2D uField;
uniform vec2 uGrid;
uniform vec2 uCover;
uniform vec2 uStart;
uniform float uSoftness;
varying vec2 vUv;

vec2 cell(vec2 index) {
  vec2 c = clamp(index, vec2(0.0), uGrid - 1.0);
  return texture2D(uField, (c + 0.5) / uGrid).rg;
}

void main() {
  vec2 g = vUv * uGrid;
  vec2 blocky = cell(floor(g));
  vec2 p = g - 0.5;
  vec2 base = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec2 soft = mix(
    mix(cell(base), cell(base + vec2(1.0, 0.0)), f.x),
    mix(cell(base + vec2(0.0, 1.0)), cell(base + vec2(1.0, 1.0)), f.x),
    f.y
  );
  vec2 shift = mix(blocky, soft, uSoftness);
  vec2 uv = uStart + (vUv - shift) * uCover;
  float split = length(shift) * 0.12;
  vec3 color = vec3(
    texture2D(uTexture, uv + vec2(split, 0.0) * uCover).r,
    texture2D(uTexture, uv).g,
    texture2D(uTexture, uv - vec2(split, 0.0) * uCover).b
  );
  gl_FragColor = vec4(color, 1.0);
}`;

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function GridDistortion({
  imageSrc,
  alt,
  title,
  className = "",
  imgClassName = "",
  style,
  grid = 16,
  mouse = 0.16,
  strength = 0.16,
  relaxation = 0.91,
  softness = 0.78,
  focus = [0.52, 0.3],
  enabled = true,
  maxShift = 0.032,
  priority = false,
  onReady,
}: GridDistortionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const settings = useRef({ grid, mouse, strength, relaxation, softness, focus, maxShift });
  settings.current = { grid, mouse, strength, relaxation, softness, focus, maxShift };
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !root || !canvas || !webglAvailable()) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const { grid: size } = settings.current;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const field = new Float32Array(4 * size * size);
      const fieldTexture = new THREE.DataTexture(
        field,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType,
      );
      fieldTexture.magFilter = THREE.NearestFilter;
      fieldTexture.minFilter = THREE.NearestFilter;
      fieldTexture.needsUpdate = true;

      const uniforms = {
        uTexture: { value: null as unknown as InstanceType<typeof THREE.Texture> },
        uField: { value: fieldTexture },
        uGrid: { value: new THREE.Vector2(size, size) },
        uCover: { value: new THREE.Vector2(1, 1) },
        uStart: { value: new THREE.Vector2(0, 0) },
        uSoftness: { value: settings.current.softness },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
      });
      const geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));

      let imageAspect = 1;
      let width = 1;
      let height = 1;
      const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, inside: false };
      let raf = 0;
      let last = 0;
      let visible = true;
      let loaded = false;

      const fit = () => {
        const aspect = width / height;
        const cover = aspect > imageAspect ? [1, imageAspect / aspect] : [aspect / imageAspect, 1];
        const [fx, fy] = settings.current.focus;
        uniforms.uCover.value.set(cover[0], cover[1]);
        // three flips textures so v=0 is the bottom edge of the photo.
        uniforms.uStart.value.set((1 - cover[0]) * fx, (1 - cover[1]) * (1 - fy));
      };

      const resize = () => {
        width = Math.max(1, root.clientWidth);
        height = Math.max(1, root.clientHeight);
        renderer.setSize(width, height, false);
        fit();
        wake();
      };

      const step = (dt: number) => {
        const s = settings.current;
        const decay = Math.pow(s.relaxation, dt * 60);
        let peak = 0;
        for (let i = 0; i < size * size; i++) {
          field[i * 4] *= decay;
          field[i * 4 + 1] *= decay;
          if (Math.abs(field[i * 4]) < 1e-5) field[i * 4] = 0;
          if (Math.abs(field[i * 4 + 1]) < 1e-5) field[i * 4 + 1] = 0;
          peak = Math.max(peak, Math.abs(field[i * 4]), Math.abs(field[i * 4 + 1]));
        }
        const vx = pointer.x - pointer.px;
        const vy = pointer.y - pointer.py;
        pointer.px = pointer.x;
        pointer.py = pointer.y;
        if (pointer.inside && (vx || vy)) {
          const gx = size * pointer.x;
          const gy = size * pointer.y;
          const reach = size * s.mouse;
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              const distance = Math.hypot(gx - (i + 0.5), gy - (j + 0.5));
              if (distance >= reach) continue;
              const power = Math.min(reach / Math.max(distance, 0.5), 6);
              const index = 4 * (i + size * j);
              field[index] += s.strength * vx * power;
              field[index + 1] += s.strength * vy * power;
              const length = Math.hypot(field[index], field[index + 1]);
              if (length > s.maxShift) {
                field[index] *= s.maxShift / length;
                field[index + 1] *= s.maxShift / length;
              }
            }
          }
          peak = Math.max(peak, 1e-3);
        }
        fieldTexture.needsUpdate = true;
        return peak;
      };

      const frame = (now: number) => {
        raf = 0;
        if (disposed || !visible) return;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        const peak = step(dt);
        uniforms.uSoftness.value = settings.current.softness;
        renderer.render(scene, camera);
        if (peak > 0) raf = requestAnimationFrame(frame);
        else last = 0;
      };

      function wake() {
        if (raf || disposed || !visible || !loaded) return;
        raf = requestAnimationFrame(frame);
      }

      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const rect = root.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = 1 - (event.clientY - rect.top) / rect.height;
        const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        if (inside && !pointer.inside) {
          pointer.px = x;
          pointer.py = y;
        }
        pointer.x = x;
        pointer.y = y;
        pointer.inside = inside;
        if (inside) wake();
      };

      const loader = new THREE.TextureLoader();
      loader.load(imageSrc, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        uniforms.uTexture.value = texture;
        const image = texture.image as HTMLImageElement;
        imageAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
        loaded = true;
        resize();
        renderer.render(scene, camera);
        setLive(true);
        readyRef.current?.();
      });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root);
      const visibility = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) wake();
      });
      visibility.observe(root);
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      cleanup = () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        visibility.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        (uniforms.uTexture.value as { dispose?: () => void } | null)?.dispose?.();
        fieldTexture.dispose();
        material.dispose();
        geometry.dispose();
        renderer.dispose();
      };
    };

    // Let the hero paint first; three.js arrives a moment later.
    const idle = window.setTimeout(() => void start(), 120);
    return () => {
      disposed = true;
      window.clearTimeout(idle);
      cleanup?.();
      setLive(false);
    };
  }, [enabled, imageSrc]);

  return (
    <div
      ref={rootRef}
      className={`rb-grid-distortion ${live ? "is-live" : ""} ${className}`}
      style={style}
      data-library="react-bits-grid-distortion"
    >
      <img
        className={imgClassName}
        src={imageSrc}
        alt={alt}
        title={title}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
      />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
