// The boot script runs before hydration, so it must not touch React-owned DOM: it passes the
// label through a CSS custom property (rendered via ::before) instead of inserting a text node.
const BOOT = `try{var n=sessionStorage.getItem("rt-page-transition");if(n&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("rt-page-entering");document.documentElement.style.setProperty("--rt-curtain-label",JSON.stringify(n));setTimeout(function(){document.documentElement.classList.remove("rt-page-entering");document.documentElement.style.removeProperty("--rt-curtain-label")},4500)}}catch(e){}`;

export const CURTAIN_CRITICAL_CSS = `
.rt-curtain { position: fixed; inset: 0; z-index: 2000; visibility: hidden; pointer-events: none; }
.rt-curtain-panel { position: absolute; inset: 0; background: #171a18; transform: translateY(112%); }
.rt-curtain-label::before { content: var(--rt-curtain-label, ""); }
.rt-curtain-edge { position: absolute; left: 0; width: 100%; height: 100px; fill: #171a18; }
html.rt-page-entering .rt-curtain { visibility: visible; }
html.rt-page-entering .rt-curtain-panel { transform: none; }
`;

export function PageCurtain() {
  return (
    <>
      <div className="rt-curtain" data-page-curtain aria-hidden="true">
        <div className="rt-curtain-panel" data-curtain-panel>
          <svg
            className="rt-curtain-edge rt-curtain-edge--top"
            data-curtain-edge-top
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0 120 C300 0 1140 0 1440 120 Z" />
          </svg>
          <span className="rt-curtain-label" data-curtain-label suppressHydrationWarning />
          <svg
            className="rt-curtain-edge rt-curtain-edge--bottom"
            data-curtain-edge-bottom
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H1440 C1140 120 300 120 0 0 Z" />
          </svg>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
    </>
  );
}
