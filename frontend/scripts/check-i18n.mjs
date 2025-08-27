import fs from "node:fs";
import path from "node:path";

const ru = JSON.parse(fs.readFileSync(path.resolve("messages/ru.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.resolve("messages/en.json"), "utf8"));

function flat(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out);
    else out[key] = true;
  }
  return out;
}

const ruKeys = Object.keys(flat(ru));
const enKeys = Object.keys(flat(en));

const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
const missingInEn = ruKeys.filter(k => !enKeys.includes(k));

if (!missingInRu.length && !missingInEn.length) {
  console.log("i18n OK: keys match");
  process.exit(0);
}
if (missingInRu.length) console.error("Missing in ru:", missingInRu);
if (missingInEn.length) console.error("Missing in en:", missingInEn);
process.exit(1);
