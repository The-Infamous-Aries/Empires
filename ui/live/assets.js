"use strict";
(function (root) {
  const paths = {};
  const add = (group, pairs) => {
    paths[group] = Object.fromEntries(
      pairs.map(([key, file]) => [key, `assets/images/${group}/${file}.png`]),
    );
  };
  add(
    "Government",
    [
      "liberalDemocracy",
      "constitutionalMonarchy",
      "communistState",
      "theocraticRepublic",
      "militaryJunta",
      "corporatistState",
      "directDemocracy",
      "technocracy",
      "federalRepublic",
      "singlePartyState",
      "anarchoCommunism",
      "absoluteMonarchy",
    ].map((key) => [
      key,
      key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
    ]),
  );
  add(
    "Religion",
    [
      "atheism",
      "monotheism",
      "polytheism",
      "buddhism",
      "hinduism",
      "shintoism",
      "islam",
      "christianity",
      "shamanism",
      "judaism",
      "scientology",
      "pastafarianism",
    ].map((key) => [key, key]),
  );
  add(
    "Colors",
    [
      "aqua",
      "black",
      "blue",
      "green",
      "lime",
      "orange",
      "pink",
      "purple",
      "red",
      "yellow",
    ].map((key) => [key, key]),
  );
  add("Military", [
    ["soldiers", "soldiers"],
    ["tanks", "tank"],
    ["aircraft", "aircraft"],
    ["ships", "ship"],
    ["missiles", "hit-missile"],
    ["nukes", "nuke"],
    ...[
      "war",
      "peace",
      "casualties",
      "injured-soldiers",
      "blocked-bombs",
      "hit-nuke",
      "warning-bomb",
    ].map((key) => [key, key]),
  ]);
  add(
    "Sports",
    [
      "soccer",
      "hockey",
      "basketball",
      "injured",
      "leaderboard",
      "soccer-trophy",
      "hockey-trophy",
      "basketball-trophy",
    ].map((key) => [key, key]),
  );
  add(
    "Menu",
    [
      "alliance",
      "build",
      "diplomacy",
      "help",
      "map",
      "messages",
      "military",
      "news",
      "research",
      "settings",
      "trade",
    ].map((key) => [key, key]),
  );
  add(
    "Misses",
    [
      "black",
      "blue",
      "d-gold",
      "d-orange",
      "d-pink",
      "d-sky",
      "forest",
      "gold",
      "green",
      "grey",
      "l-blue",
      "l-grey",
      "l-pink",
      "l-red",
      "l-sky",
      "lime",
      "orange",
      "pink",
      "red",
      "sky",
      "white",
      "yellow",
    ].map((key) => [key, key]),
  );
  add(
    "Rank",
    Array.from({ length: 48 }, (_, i) => [String(i + 1), String(i + 1)]),
  );
  add(
    "Awards",
    Array.from({ length: 5 }, (_, i) =>
      ["1st", "2nd", "3rd"].map((rank) => [
        `${rank}-${i + 1}`,
        `${rank}-${i + 1}`,
      ]),
    ).flat(),
  );
  const assets = {
    paths,
    icon(group, key) {
      return paths[group]?.[key] || null;
    },
    award(rank, set) {
      return paths.Awards[`${["1st", "2nd", "3rd"][rank - 1]}-${set}`] || null;
    },
    music: {
      peace: Array.from(
        { length: 3 },
        (_, i) => `assets/sounds/Background/peace-${i + 1}.mp3`,
      ),
      war: Array.from(
        { length: 4 },
        (_, i) => `assets/sounds/Background/war-${i + 1}.mp3`,
      ),
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = assets;
  else root.EmpiresAssets = assets;
})(globalThis);
