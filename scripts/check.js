"use strict";
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const files = [
  "server.js",
  "scripts/check.js",
  ...["core", "entities", "systems", "data", "ui", "map", "utils"].flatMap(
    (dir) =>
      fs
        .readdirSync(dir, { recursive: true })
        .filter((f) => f.endsWith(".js"))
        .map((f) => `${dir}/${f}`),
  ),
  ...["server", "tests"].flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => `${dir}/${f}`),
  ),
];
for (const file of files)
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
console.log(`Syntax checked ${files.length} JavaScript files`);
