import fs from "node:fs";

const data = fs.readFileSync("package.json", { encoding: "utf-8" });
/** @type {unknown} */
const pkgJSON = JSON.parse(data);
if (typeof pkgJSON !== "object" || pkgJSON == null) {
  console.error("Error: malformed package.json");
  process.exit(1);
}
const { dependencies } = /** @type {Record<string, unknown>} */ (pkgJSON);

if (typeof dependencies !== "object" || dependencies == null) {
  // No deps field, all good
  process.exit(0);
}

const depNames = Object.keys(dependencies);
if (depNames.length === 0) {
  // While an empty dependencies field is technically fine
  // it's better to not have it to make it clear dependencies aren't allowed
  console.error(`Error: Empty "dependencies" field in package.json, please remove it`);
  process.exit(1);
}

console.error(`Error: ${depNames.length} dependencies were found in package.json`);
for (const d of depNames) {
  console.error(` - ${d}`);
}

console.error("\ntypescript-stdlib is not allowed to have dependencies, please remove these");
process.exit(1);
