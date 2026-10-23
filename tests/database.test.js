"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { BaseDatabase } = require("../core/databases/base-database");
class MemoryDatabase extends BaseDatabase {
  loadData() {}
  async saveData() {}
}
test("database indexes track updates, replacements and deletion without stale records", async () => {
  const db = new MemoryDatabase("fixture", {
    name: { type: "string", required: true, indexed: true },
  });
  await db.insert("a", { name: "First" });
  assert.equal(db.findByIndex("name", "First").length, 1);
  await db.update("a", { name: "Second" });
  assert.equal(db.findByIndex("name", "First").length, 0);
  assert.equal(db.findByIndex("name", "Second").length, 1);
  await db.insert("a", { name: "Third" });
  assert.equal(db.findByIndex("name", "Second").length, 0);
  assert.equal(db.findByIndex("name", "Third").length, 1);
  await db.delete("a");
  assert.equal(db.findByIndex("name", "Third").length, 0);
  assert.deepEqual(db.getStats().indexes, ["name"]);
});
