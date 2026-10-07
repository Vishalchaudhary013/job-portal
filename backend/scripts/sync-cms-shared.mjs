// Copies the Form Builder's shared schema engine (backend/cms/shared) into the
// frontend, so the builder UI, content editor, renderers and the server all
// use the SAME field types, validation and conditional-visibility rules.
//
// The frontend is deployed on its own (Vercel builds only frontend/), so it
// can't import from backend/ — hence a committed copy. Run after editing any
// file in backend/cms/shared:
//
//   cd backend && npm run sync:cms-shared
//
// `--check` exits non-zero when the copy is out of date (for CI).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "..", "cms", "shared");
const target = path.resolve(here, "..", "..", "frontend", "src", "features", "cms", "shared");
const header = "// GENERATED from backend/cms/shared — do not edit here. Run `npm run sync:cms-shared` in backend/.\n";

const checkOnly = process.argv.includes("--check");
fs.mkdirSync(target, { recursive: true });

let stale = 0;
for (const file of fs.readdirSync(source).filter((name) => name.endsWith(".js"))) {
  const expected = header + fs.readFileSync(path.join(source, file), "utf8");
  const destination = path.join(target, file);
  const current = fs.existsSync(destination) ? fs.readFileSync(destination, "utf8") : null;
  if (current === expected) continue;
  stale += 1;
  if (checkOnly) console.log(`out of date: ${file}`);
  else {
    fs.writeFileSync(destination, expected);
    console.log(`synced ${file}`);
  }
}

if (checkOnly && stale) process.exit(1);
if (!stale) console.log("cms shared files already in sync");
