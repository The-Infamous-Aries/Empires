"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { acquireWorldLock } = require("../server/lock");
test("world startup prevents simultaneous writers and releases its lock", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "empires-lock-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "world.json");
  const release = acquireWorldLock(file);
  assert.throws(() => acquireWorldLock(file), /owns this world/);
  release();
  const second = acquireWorldLock(file);
  second();
  assert(!fs.existsSync(file + ".lock"));
});
