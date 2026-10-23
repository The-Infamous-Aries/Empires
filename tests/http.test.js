"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createServer } = require("../server");
const { World } = require("../server/world");

test("HTTP auth, ownership, concurrent actions, live broadcasts and private file boundaries", async (t) => {
  const app = createServer({ world: new World({ file: null }) });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const post = async (route, body, cookie, extra = {}) => {
    const response = await fetch(base + route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  assert.equal((await fetch(base + "/api/state")).status, 401);
  const register = (name) =>
    post("/api/register", {
      username: name,
      password: randomUUID(),
      nation: {
        name: `${name} Nation`,
        government: "liberalDemocracy",
        religion: "monotheism",
        primaryResource: "food",
        factionKey: "blue",
      },
    });
  const alice = await register("Alice");
  const bob = await register("Bob");
  assert.equal(alice.status, 200);
  assert.equal(bob.status, 200);
  assert(!JSON.stringify(alice.body).includes("passwordHash"));
  const id = alice.body.nation.id,
    other = bob.body.nation.id;
  const controller = new AbortController();
  t.after(() => controller.abort());
  const events = await fetch(base + "/api/events", {
    headers: { Cookie: bob.cookie },
    signal: controller.signal,
  });
  assert.match(events.headers.get("content-type"), /text\/event-stream/);
  const reader = events.body.getReader();
  const initial = await reader.read();
  assert.match(new TextDecoder().decode(initial.value), /event: state/);
  const command = (action, data, requestId = randomUUID()) =>
    post("/api/action", { action, data, requestId }, alice.cookie);
  const draft = {
    action: "build",
    data: { category: "improvements", key: "mine", nationId: other },
    requestId: randomUUID(),
  };
  const results = await Promise.all([
    post("/api/action", draft, alice.cookie),
    post("/api/action", draft, alice.cookie),
  ]);
  assert(results.every((r) => r.status === 200));
  assert.equal(app.world.nation(id).nation.improvements.mine, 1);
  assert.equal(app.world.nation(other).nation.improvements.mine, undefined);
  const update = await reader.read();
  assert.match(new TextDecoder().decode(update.value), /event: state/);
  assert.equal((await command("pause", {})).status, 400);
  assert.equal(
    (await command("buyUnit", { type: "soldiers", amount: -5 })).status,
    400,
  );
  assert.equal(
    (
      await post("/api/action", draft, alice.cookie, {
        Origin: "https://attacker.example",
      })
    ).status,
    400,
  );
  for (const route of [
    "/server.js",
    "/saves/world.json",
    "/assets/%2e%2e%2fsaves/world.json",
    "/ui/live/%2e%2e%2f%2e%2e%2fserver.js",
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 400, route);
    assert(!/passwordHash|createServer/.test(await response.text()));
  }
  app.world.nation(id).nation.money = 750000;
  const competing = await Promise.all([
    command("build", { category: "improvements", key: "mine" }),
    command("build", { category: "improvements", key: "mine" }),
  ]);
  assert.equal(competing.filter((r) => r.status === 200).length, 1);
  assert.equal(app.world.nation(id).nation.money, 0);
  assert.equal((await post("/api/logout", {}, alice.cookie)).status, 200);
  assert.equal(
    (await fetch(base + "/api/state", { headers: { Cookie: alice.cookie } }))
      .status,
    401,
  );
  controller.abort();
});

test("the server advances with no connected browser", async (t) => {
  const { HOUR } = require("../server/world");
  let now = 1_700_000_000_000;
  const world = new World({ file: null, now: () => now });
  const id = world.register("Offline", "test-only-hash", {
    name: "Offline Republic",
    government: "liberalDemocracy",
    religion: "monotheism",
    primaryResource: "food",
    factionKey: "blue",
  });
  const app = createServer({ world });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  now += HOUR;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(world.state.day, 1);
  assert.equal(world.nation(id).nation.statistics.totalTurns, 1);
});

test("a transient save failure rolls back the turn and retries without a restart", async (t) => {
  const { HOUR } = require("../server/world");
  let now = 1700000000000;
  const world = new World({ file: null, now: () => now }),
    app = createServer({ world });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  let attempts = 0;
  world.save = () => {
    if (++attempts === 1) throw new Error("Synthetic temporary storage outage");
  };
  now += HOUR;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(world.state.day, 0);
  const url = `http://127.0.0.1:${app.server.address().port}/api/health`;
  assert.equal((await fetch(url)).status, 503);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(world.state.day, 1);
  assert.equal(attempts, 2);
  assert.equal((await fetch(url)).status, 200);
});
