import fs from "node:fs";

const items = ["dist", "coverage", ".deno-release"];
for (const i of items) {
  fs.rmSync(i, { recursive: true, force: true });
}
