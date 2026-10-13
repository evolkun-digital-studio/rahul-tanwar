import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
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
await mkdir(path.join(out, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(out, ".next", "static"), {
  recursive: true,
});
await cp(path.join(root, "public"), path.join(out, "public"), { recursive: true });
await cp(path.join(root, "cpanel", "app.js"), path.join(out, "app.js"));
await mkdir(path.join(out, "data"), { recursive: true });
await writeFile(path.join(out, "data", ".gitkeep"), "");

console.log("cPanel bundle ready in dist-cpanel/. Zip its contents and upload (see DEPLOY.md).");
