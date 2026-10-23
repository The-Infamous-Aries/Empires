"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const { World } = require("../server/world"),
  { createServer } = require("../server");
const Assets = require("../ui/live/assets"),
  { Music, modeFor } = require("../ui/live/music");
class FakeAudio extends EventTarget {
  constructor() {
    super();
    this.playCount = 0;
    this.paused = true;
    this.reject = null;
  }
  play() {
    this.playCount++;
    this.paused = false;
    return this.reject ? Promise.reject(this.reject) : Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {}
  removeAttribute(key) {
    if (key === "src") this.src = "";
  }
}
const peace = { nation: { id: "me" }, wars: [] },
  war = {
    nation: { id: "me" },
    wars: [{ status: "preparing", participants: ["me", "other"] }],
  };
const settle = () => new Promise((r) => setImmediate(r));
function musicFixture() {
  const audio = new FakeAudio();
  const music = new Music({ tracks: Assets.music, createAudio: () => audio });
  return { music, audio };
}
test("every asset manifest entry resolves to an original image or soundtrack, including all award sets and ranks", () => {
  const all = [
    ...Object.values(Assets.paths).flatMap((g) => Object.values(g)),
    ...Object.values(Assets.music).flat(),
  ];
  assert.equal(new Set(all).size, 147);
  for (const file of all) assert(fs.existsSync(file), file);
  for (let set = 1; set <= 5; set++)
    for (let rank = 1; rank <= 3; rank++)
      assert.equal(
        Assets.award(rank, set),
        `assets/images/Awards/${["1st", "2nd", "3rd"][rank - 1]}-${set}.png`,
      );
  assert.equal(Assets.award(4, 1), null);
});
test("music distinguishes own preparing/active wars, ended wars and unrelated wars", () => {
  assert.equal(modeFor(peace), "peace");
  assert.equal(modeFor(war), "war");
  assert.equal(
    modeFor({
      nation: { id: "me" },
      wars: [{ status: "active", participants: ["other"] }],
    }),
    "peace",
  );
  assert.equal(
    modeFor({
      nation: { id: "me" },
      wars: [{ status: "ended", participants: ["me"] }],
    }),
    "peace",
  );
});
test("one music player cycles all peace/war tracks, changes on war state, and survives UI state refresh", async () => {
  const { music, audio } = musicFixture();
  music.sync(peace);
  assert.equal(audio.playCount, 0);
  music.sync(peace, { enabled: true, volume: 0.4 });
  await settle();
  assert.equal(audio.src, Assets.music.peace[0]);
  assert.equal(audio.volume, 0.4);
  music.sync(peace, { enabled: true, volume: 0.2 });
  assert.equal(audio.playCount, 1, "state refresh must not restart playback");
  for (const next of [1, 2, 0]) {
    audio.dispatchEvent(new Event("ended"));
    await settle();
    assert.equal(audio.src, Assets.music.peace[next]);
  }
  music.sync(war, { enabled: true });
  await settle();
  assert.equal(audio.src, Assets.music.war[0]);
  for (const next of [1, 2, 3, 0]) {
    audio.dispatchEvent(new Event("ended"));
    await settle();
    assert.equal(audio.src, Assets.music.war[next]);
  }
  music.sync(peace, { enabled: true });
  await settle();
  assert.match(audio.src, /peace-/);
  music.sync(peace, { enabled: false });
  assert(audio.paused);
  assert.equal(audio.src, "");
  music.sync(war, { enabled: true });
  await settle();
  music.sync(null, { enabled: true });
  assert(audio.paused);
  assert.equal(music.status, "off");
});
test("autoplay rejection stays recoverable and unreadable playlists stop after every track has failed", async () => {
  const { music, audio } = musicFixture();
  audio.reject = { name: "NotAllowedError" };
  music.sync(peace, { enabled: true });
  await settle();
  assert.equal(music.status, "blocked");
  audio.reject = null;
  music.resume();
  await settle();
  assert.equal(music.status, "playing");
  audio.reject = { name: "NotSupportedError" };
  audio.dispatchEvent(new Event("error"));
  await settle();
  await settle();
  assert.equal(music.status, "unavailable");
  const count = audio.playCount;
  music.sync(peace, { enabled: true });
  await settle();
  assert.equal(audio.playCount, count, "no endless failing retry");
  audio.reject = null;
  music.resume();
  await settle();
  assert.equal(music.status, "playing");
});
test("late playback responses cannot restart music after it is disabled", async () => {
  const { music, audio } = musicFixture();
  let resolve;
  audio.play = () =>
    new Promise((r) => {
      resolve = r;
    });
  music.sync(peace, { enabled: true });
  music.sync(peace, { enabled: false });
  resolve();
  await settle();
  assert.equal(music.status, "off");
  assert.equal(audio.src, "");
  assert(audio.paused);
});
test("HTTP media uses correct MIME, full/suffix/partial/HEAD ranges and retains private path boundaries", async (t) => {
  const app = createServer({ world: new World({ file: null }) });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`,
    file = Assets.music.peace[0],
    source = fs.readFileSync(file);
  const full = await fetch(base + "/" + file);
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("content-type"), "audio/mpeg");
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), source);
  for (const [range, start, end] of [
    ["bytes=0-99", 0, 99],
    ["bytes=100-", 100, source.length - 1],
    ["bytes=-25", source.length - 25, source.length - 1],
  ]) {
    const r = await fetch(base + "/" + file, { headers: { Range: range } });
    assert.equal(r.status, 206);
    assert.equal(
      r.headers.get("content-range"),
      `bytes ${start}-${end}/${source.length}`,
    );
    assert.deepEqual(
      Buffer.from(await r.arrayBuffer()),
      source.subarray(start, end + 1),
    );
  }
  for (const range of [
    "bytes=-0",
    "bytes=999999999-",
    "bytes=100-50",
    "bytes=1-2,4-5",
    "bad",
  ]) {
    const r = await fetch(base + "/" + file, { headers: { Range: range } });
    assert.equal(r.status, 416);
    assert.equal((await r.arrayBuffer()).byteLength, 0);
  }
  const head = await fetch(base + "/" + file, {
    method: "HEAD",
    headers: { Range: "bytes=0-9" },
  });
  assert.equal(head.status, 206);
  assert.equal(head.headers.get("content-length"), "10");
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  const image = await fetch(base + "/assets/images/Awards/1st-1.png");
  assert.equal(image.headers.get("content-type"), "image/png");
  await image.arrayBuffer();
  for (const path of [
    "/server/rankings.js",
    "/assets/%2e%2e%2fserver.js",
    "/saves/world.json",
  ]) {
    const r = await fetch(base + path);
    assert.equal(r.status, 400);
    await r.arrayBuffer();
  }
});
