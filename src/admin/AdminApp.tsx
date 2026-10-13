import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Image, LayoutDashboard, LogOut, PanelTop, Search, Settings } from "lucide-react";
import {
  defaultHomeContent,
  defaultPrivacyContent,
  defaultSr18GamingContent,
  defaultDelhi6Content,
  defaultMasaiContent,
  defaultAdattoContent,
  defaultVolt50000Content,
  defaultArnikaContent,
} from "@/lib/cms";

type AdminSection = "dashboard" | "pages" | "media" | "seo" | "settings";

const sections: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pages", label: "Pages", icon: PanelTop },
  { id: "media", label: "Media", icon: Image },
  { id: "seo", label: "SEO", icon: Search },
  { id: "settings", label: "Settings", icon: Settings },
];

const editablePageSlugs = ["home", "sr18-gaming", "delhi-6", "volt-50000", "masai", "adatto", "arnika-textiles", "privacy"];
const pageDefaults = {
  home: defaultHomeContent,
  privacy: defaultPrivacyContent,
  "sr18-gaming": defaultSr18GamingContent,
  "delhi-6": defaultDelhi6Content,
  "volt-50000": defaultVolt50000Content,
  masai: defaultMasaiContent,
  adatto: defaultAdattoContent,
  "arnika-textiles": defaultArnikaContent,
};
const seoFields = [
  "pageTitle",
  "metaTitle",
  "metaDescription",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
];
const pageFields = ["contactEmail", "socialLinks", "header", "images", "sections"];

function getSection(): AdminSection {
  const part = window.location.pathname.split("/")[2] as AdminSection | undefined;
  return sections.some((section) => section.id === part) ? part! : "dashboard";
}

export function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const [section, setSection] = useState<AdminSection>(getSection);

  useEffect(() => {
    if (!window.location.pathname.startsWith(`/admin/${section}`)) {
      window.history.replaceState(null, "", `/admin/${section}`);
    }
  }, [section]);

  if (!token || window.location.pathname === "/admin/login") {
    return <Login onLogin={setToken} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-paper px-5 py-6 md:block">
        <a href="/admin/dashboard" className="font-display text-3xl">
          Rahul Tanwar
        </a>
        <nav className="mt-10 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                section === id ? "bg-ink text-paper" : "hover:bg-stone-soft"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            localStorage.removeItem("adminToken");
            setToken("");
            window.history.replaceState(null, "", "/admin/login");
          }}
          className="absolute bottom-6 left-5 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-stone hover:bg-stone-soft"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
      <main className="md:pl-72">
        <div className="border-b border-line bg-paper px-6 py-5 md:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone">CMS Admin</p>
          <h1 className="font-display mt-1 text-4xl capitalize">{section}</h1>
        </div>
        <div className="px-6 py-8 md:px-10">
          {section === "dashboard" && <Dashboard token={token} />}
          {section === "pages" && <PageEditor token={token} mode="page" />}
          {section === "seo" && <PageEditor token={token} mode="seo" />}
          {section === "media" && <MediaManager token={token} />}
          {section === "settings" && <SettingsEditor token={token} />}
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) {
      setError(data.error || "Login failed");
      return;
    }
    localStorage.setItem("adminToken", data.token);
    onLogin(data.token);
    window.history.replaceState(null, "", "/admin/dashboard");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 text-paper">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">CMS Login</p>
        <h1 className="font-display mt-3 text-5xl">Admin Panel</h1>
        {error && (
          <p className="mt-5 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</p>
        )}
        <label className="mt-8 block text-xs uppercase tracking-[0.18em] text-white/50">
          Email
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-transparent px-4 py-3"
        />
        <label className="mt-5 block text-xs uppercase tracking-[0.18em] text-white/50">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-transparent px-4 py-3"
        />
        <button className="mt-8 w-full rounded-full bg-gold px-5 py-3 text-xs uppercase tracking-[0.2em] text-ink">
          Sign in
        </button>
      </form>
    </div>
  );
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function Dashboard({ token }: { token: string }) {
  const [stats, setStats] = useState({ leads: 0, media: 0, pages: 0 });
  useEffect(() => {
    fetch("/api/admin/dashboard", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => setStats(data.stats || { leads: 0, media: 0, pages: 0 }))
      .catch(() => undefined);
  }, [token]);
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {Object.entries(stats).map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-paper p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-stone">{label}</p>
          <p className="font-display mt-4 text-6xl">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PageEditor({ token, mode }: { token: string; mode: "page" | "seo" }) {
  const [slug, setSlug] = useState("home");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const editableFields = useMemo(() => (mode === "seo" ? seoFields : pageFields), [mode]);

  useEffect(() => {
    fetch(`/api/admin/pages/${slug}`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        const defaults = pageDefaults[slug as keyof typeof pageDefaults] || defaultHomeContent;
        setForm({
          ...defaults,
          ...(data.page || {}),
          header: { ...defaults.header, ...(data.page?.header || {}) },
          images: { ...defaults.images, ...(data.page?.images || {}) },
          socialLinks: { ...defaults.socialLinks, ...(data.page?.socialLinks || {}) },
          sections: { ...defaults.sections, ...(data.page?.sections || {}) },
          slug,
        });
      })
      .catch(() => undefined);
  }, [slug, token]);

  async function save() {
    await fetch(`/api/admin/pages/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(form),
    });
  }

  return (
    <div className="max-w-6xl rounded-xl border border-line bg-paper p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <label>
          <span className="text-xs uppercase tracking-[0.18em] text-stone">Page</span>
          <select
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="mt-2 block rounded-lg border border-line bg-white px-4 py-3 text-sm"
          >
            {editablePageSlugs.map((pageSlug) => (
              <option key={pageSlug} value={pageSlug}>
                {pageSlug}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={save}
          className="rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-paper"
        >
          Save changes
        </button>
      </div>

      <div className="grid gap-6">
        {editableFields.map((field) => (
          <NestedField
            key={field}
            label={field}
            value={form[field]}
            path={[field]}
            onChange={(path, value) => setForm((current) => setAtPath(current, path, value))}
          />
        ))}
      </div>
    </div>
  );
}

function setAtPath(source: Record<string, unknown>, path: Array<string | number>, value: unknown) {
  const clone = Array.isArray(source) ? [...source] : { ...source };
  let cursor = clone as Record<string | number, unknown>;
  path.forEach((part, index) => {
    if (index === path.length - 1) {
      cursor[part] = value;
      return;
    }
    const next = cursor[part];
    cursor[part] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cursor = cursor[part] as Record<string | number, unknown>;
  });
  return clone as Record<string, unknown>;
}

function humanize(label: string) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function NestedField({
  label,
  value,
  path,
  onChange,
}: {
  label: string;
  value: unknown;
  path: Array<string | number>;
  onChange: (path: Array<string | number>, value: unknown) => void;
}) {
  if (Array.isArray(value)) {
    return (
      <details open className="rounded-xl border border-line bg-white/60 p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone">
          {humanize(label)}
        </summary>
        <div className="mt-4 grid gap-4">
          {value.map((item, index) => (
            <NestedField
              key={index}
              label={`${label} ${index + 1}`}
              value={item}
              path={[...path, index]}
              onChange={onChange}
            />
          ))}
        </div>
      </details>
    );
  }

  if (value && typeof value === "object") {
    return (
      <details open className="rounded-xl border border-line bg-white/60 p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone">
          {humanize(label)}
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(value).map(([childKey, childValue]) => (
            <NestedField
              key={childKey}
              label={childKey}
              value={childValue}
              path={[...path, childKey]}
              onChange={onChange}
            />
          ))}
        </div>
      </details>
    );
  }

  const textValue = typeof value === "boolean" ? String(value) : String(value || "");
  const multiline =
    textValue.length > 90 ||
    label.toLowerCase().includes("description") ||
    label.toLowerCase().includes("body") ||
    label.toLowerCase().includes("paragraph") ||
    label.toLowerCase().includes("quote");

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-stone">{humanize(label)}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={textValue}
          onChange={(event) => onChange(path, event.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm"
        />
      ) : (
        <input
          value={textValue}
          onChange={(event) =>
            onChange(
              path,
              typeof value === "boolean" ? event.target.value === "true" : event.target.value,
            )
          }
          className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm"
        />
      )}
    </label>
  );
}

function MediaManager({ token }: { token: string }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [assets, setAssets] = useState<
    Array<{ id: string; url: string; altText: string; title: string }>
  >([]);

  function load() {
    fetch("/api/admin/media", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => setAssets(data.assets || []))
      .catch(() => undefined);
  }

  useEffect(load, [token]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url) return;
    await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ url, altText: alt }),
    });
    setUrl("");
    setAlt("");
    load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="rounded-xl border border-line bg-paper p-6">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Image URL"
          className="w-full rounded-lg border border-line px-4 py-3"
        />
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="Alt text"
          className="mt-4 w-full rounded-lg border border-line px-4 py-3"
        />
        <button className="mt-4 rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-paper">
          Save image URL
        </button>
      </form>
      <div className="grid gap-5 md:grid-cols-3">
        {assets.map((asset) => (
          <figure key={asset.id} className="overflow-hidden rounded-xl border border-line bg-paper">
            <img src={asset.url} alt={asset.altText} className="aspect-video w-full object-cover" />
            <figcaption className="p-4 text-sm text-stone">
              {asset.altText || asset.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function SettingsEditor({ token }: { token: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/admin/settings", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => undefined);
  }, [token]);

  async function save() {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(settings),
    });
  }

  return (
    <div className="max-w-3xl rounded-xl border border-line bg-paper p-6">
      {["siteUrl", "companyEmail", "phone", "address", "linkedin", "whatsapp"].map((field) => (
        <label key={field} className="mb-5 block">
          <span className="text-xs uppercase tracking-[0.18em] text-stone">{field}</span>
          <input
            value={settings[field] || ""}
            onChange={(event) =>
              setSettings((current) => ({ ...current, [field]: event.target.value }))
            }
            className="mt-2 w-full rounded-lg border border-line px-4 py-3"
          />
        </label>
      ))}
      <button
        onClick={save}
        className="rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-paper"
      >
        Save settings
      </button>
    </div>
  );
}
