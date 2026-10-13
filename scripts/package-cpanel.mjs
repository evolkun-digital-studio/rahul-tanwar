import { access, cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist-cpanel");
const standalone = path.join(root, ".next", "standalone");

try {
  await access(path.join(standalone, "server.js"));
} catch {
  console.error("Missing .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await cp(standalone, out, { recursive: true });

// Next copies local .env* files into the standalone output and its tracer can pick up the local
// data/ folder. Neither may ship: a dev .env would silently supply variables on the server (the
// standalone server loads .env at runtime) and a local data/*.json would overwrite real CMS edits
// when the bundle is extracted over production.
const stripped = [];
for (const entry of await readdir(out)) {
  if (entry === ".env" || entry.startsWith(".env.")) {
    stripped.push(entry);
    await rm(path.join(out, entry), { force: true });
  }
}
const dataDir = path.join(out, "data");
try {
  const files = (await readdir(dataDir)).filter((name) => name !== ".gitkeep");
  if (files.length) stripped.push(`data/ (${files.join(", ")})`);
} catch {
  // no data directory in the standalone output
}
await rm(dataDir, { recursive: true, force: true });
// Stale nested bundle from an earlier run, if the tracer ever picked it up.
await rm(path.join(out, "dist-cpanel"), { recursive: true, force: true });
if (stripped.length) {
  console.warn(
    `WARNING: removed local files from the standalone output so they do not ship: ${stripped.join(", ")}.
` +
      "Set environment variables in the cPanel UI, and keep production data/ untouched on the server.",
  );
}

await mkdir(path.join(out, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(out, ".next", "static"), {
  recursive: true,
});
await cp(path.join(root, "public"), path.join(out, "public"), { recursive: true });
await cp(path.join(root, "cpanel", "app.js"), path.join(out, "app.js"));
await mkdir(dataDir, { recursive: true });
await writeFile(path.join(dataDir, ".gitkeep"), "");

console.log("cPanel bundle ready in dist-cpanel/. Zip its contents and upload (see DEPLOY.md).");
