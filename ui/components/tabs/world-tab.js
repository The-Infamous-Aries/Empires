"use strict";
/**
 * World Tab - Sovereignty Epochs
 * Renders the World tab content with two sub-tabs:
 *   1. "Global" — global rates, active global disease & cure funding, Color + World forums
 *   2. "Bank"   — World Bank: currencies (invest), interest/loan rates (take loans),
 *                 National Pet Lottery (quick picks & custom tickets)
 *
 * Pure HTML generator. Receives state/catalog and returns an HTML string rendered
 * into panel-world by game.js. Exports: renderWorldTab(state) -> HTML string.
 */

/* ═════════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ═════════════════════════════════════════════════════════════════════════════ */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (value) => "$" + number(value);
const date = (value) => new Date(value).toLocaleString();
const empty = (message) => `<div class="empty">${esc(message)}</div>`;
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(
    JSON.stringify(data),
  )}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;
const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items)
      .map(
        ([key, value]) =>
          `<option value="${esc(key)}" ${key === selected ? "selected" : ""}>${esc(
            typeof value === "object" ? value.name : value,
          )}</option>`,
      )
      .join("")
  }</select>`;
const nationName = (state, id) =>
  state?.nations?.find((n) => n.id === id)?.name || "Unknown nation";

const TICKET_COST = 100000;
const MAX_TICKETS_PER_NATION = 25;
const PET_ICONS_UNIQUE = [
  'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
  'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
  'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
  'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
  'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
  'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
  'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
  'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
  'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
  'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra'
];

/* ════════════════════════════════════════════════════════════════════════════
   SUB-TAB RENDERERS
   ═════════════════════════════════════════════════════════════════════════════ */

/**
 * Sub-tab 1: Global — world rates, disease, forums.
 */
function renderGlobalTab(state, catalog) {
  const n = state.nation;
  const gw = state.globalWorld || {};
  const avg = gw.globalAverages || {};
  const ds = gw.diseaseStats || {};
  const activeDisease = gw.activeGlobalDisease || null;
  const canColor = !!n.projects.broadcasting;
  const canWorld = canColor && !!n.wonders.internet;

  const rateCard = (label, key, iconKey, good) => {
    const value = Number(avg[key] || 0);
    const cls = good ? (value >= 60 ? "good" : value <= 40 ? "warn" : "") : "";
    return `<div class="metric world-rate"><div class="rate-icon">${icon(
      iconKey,
      "",
      "world-rate-icon",
    )}</div><div><div class="rate-label">${esc(label)}</div><strong class="${cls}">${value.toFixed(1)}</strong><span class="rate-pct">%</span></div></div>`;
  };

  const globalRates = `<section class="card section"><h3>Global Rates</h3><p class="muted">Living-world averages across every nation, updated each turn.</p><div class="grid section">${rateCard(
    "Happiness",
    "happiness",
    "Emoji",
    true,
  )}${rateCard("Crime", "crime", "Alert", false)}${rateCard(
    "Disease",
    "disease",
    "Virus",
    false,
  )}${rateCard("Pollution", "pollution", "Factory", false)}${rateCard(
    "Environment",
    "environment",
    "Leaf",
    true,
  )}${rateCard("Literacy Rate", "literacyRate", "School", true)}</div><div class="data-list wide section"><div><strong>Total Nations</strong></div><div>${number(ds.totalNations)}</div><div><strong>Minor Disease</strong></div><div>${number(ds.nationsWithMinorDisease)} (${ds.pctWithMinorDisease || 0}%)</div><div><strong>Major Disease</strong></div><div>${number(ds.nationsWithMajorDisease)} (${ds.pctWithMajorDisease || 0}%)</div></div></section>`;

  // ── Global Stats: Government/Religion tallies, War stats, Unit averages, Currency usage ──
  const govTally = gw.governmentTally || {};
  const relTally = gw.religionTally || {};
  const warStats = gw.warStats || {};
  const unitStats = gw.militaryUnitStats || {};
  const currencyStats = gw.currencyStats || {};
  const totalNations = gw.totalNations || state.nations?.length || 1;

  const govRows = Object.entries(govTally)
    .map(([key, count]) => {
      const def = catalog?.governments?.[key] || {};
      const pct = totalNations > 0 ? Math.round((count / totalNations) * 100) : 0;
      return `<tr><td>${esc(def.name || human(key))}</td><td>${number(count)}</td><td>${pct}%</td></tr>`;
    })
    .sort((a, b) => {
      const ca = parseInt(a.match(/(\d+)<\/td><td>(\d+)%/)?.[2] || '0');
      const cb = parseInt(b.match(/(\d+)<\/td><td>(\d+)%/)?.[2] || '0');
      return cb - ca;
    })
    .join('');

  const relRows = Object.entries(relTally)
    .map(([key, count]) => {
      const def = catalog?.religions?.[key] || {};
      const pct = totalNations > 0 ? Math.round((count / totalNations) * 100) : 0;
      return `<tr><td>${esc(def.name || human(key))}</td><td>${number(count)}</td><td>${pct}%</td></tr>`;
    })
    .sort((a, b) => {
      const ca = parseInt(a.match(/(\d+)<\/td><td>(\d+)%/)?.[2] || '0');
      const cb = parseInt(b.match(/(\d+)<\/td><td>(\d+)%/)?.[2] || '0');
      return cb - ca;
    })
    .join('');

  const unitRows = ["soldiers", "tanks", "aircraft", "ships", "spies", "missiles", "nukes"]
    .map((type) => {
      const s = unitStats[type] || {};
      const label = human(type);
      return `<tr><td>${esc(label)}</td><td>${number(s.totalWorld || 0)}</td><td>${number(s.avgPerNation || 0)}</td><td>${number(s.nationsWithUnits || 0)}</td></tr>`;
    })
    .join('');

  const currencyRows = Object.entries(currencyStats)
    .filter(([key]) => key !== 'totalNations')
    .map(([key, stats]) => {
      const def = CURRENCY_DEF[key] || {};
      const pct = stats.pctOfNations || 0;
      return `<tr><td>${esc(def.name || human(key))} <span class="currency-sym">${esc(def.symbol || '')}</span></td><td>${number(stats.nationCount || 0)}</td><td>${pct.toFixed(1)}%</td><td>${money(stats.avgBalance || 0)}</td></tr>`;
    })
    .sort((a, b) => {
      const ca = parseFloat(a.match(/(\d+\.\d+)%/)?.[1] || '0');
      const cb = parseFloat(b.match(/(\d+\.\d+)%/)?.[1] || '0');
      return cb - ca;
    })
    .join('');

  const globalStats = `<section class="card section global-stats"><h3>Global Stats</h3><p class="muted">World-wide statistics across all ${number(totalNations)} nations.</p><div class="two-column">
    <div class="stack">
      <section class="card section">
        <h4>🏛️ Government Types</h4>
        <div class="table-wrap"><table><thead><tr><th>Government</th><th>Nations</th><th>%</th></tr></thead><tbody>${govRows || '<tr><td colspan="3" class="muted">No data</td></tr>'}</tbody></table></div>
      </section>
      <section class="card section">
        <h4>⛪ Religions</h4>
        <div class="table-wrap"><table><thead><tr><th>Religion</th><th>Nations</th><th>%</th></tr></thead><tbody>${relRows || '<tr><td colspan="3" class="muted">No data</td></tr>'}</tbody></table></div>
      </section>
    </div>
    <div class="stack">
      <section class="card section">
        <h4>⚔️ War Stats</h4>
        <div class="data-list">
          <div><strong>Active Wars</strong><div>${number(warStats.activeWarCount || 0)}</div></div>
          <div><strong>Nations at War</strong><div>${number(warStats.nationsAtWar || 0)}</div></div>
          <div><strong>Nations at Peace</strong><div>${number(warStats.nationsAtPeace || 0)}</div></div>
          <div><strong>War %</strong><div>${(warStats.warPercentage || 0).toFixed(1)}%</div></div>
          <div><strong>Peace %</strong><div>${(warStats.peacePercentage || 0).toFixed(1)}%</div></div>
        </div>
      </section>
      <section class="card section">
        <h4>🪖 Military Unit Averages</h4>
        <div class="table-wrap"><table><thead><tr><th>Unit Type</th><th>World Total</th><th>Avg/Nation</th><th>Nations With</th></tr></thead><tbody>${unitRows || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody></table></div>
      </section>
      <section class="card section">
        <h4>💱 Currency Usage %</h4>
        <div class="table-wrap"><table><thead><tr><th>Currency</th><th>Nations</th><th>% of World</th><th>Avg Balance</th></tr></thead><tbody>${currencyRows || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody></table></div>
      </section>
    </div>
  </div></section>`;

  // ── Active global disease & cure funding ──
  const diseaseSection = activeDisease
    ? `<section class="card section"><div class="row spread"><h3>Active Global Disease</h3><span class="badge ${
        activeDisease.severity === "severe"
          ? "danger"
          : activeDisease.severity === "major"
            ? "warn"
            : ""
      }">${esc(human(activeDisease.severity))}</span></div><div class="eyebrow">${esc(
      activeDisease.name,
    )}</div><p>${esc(activeDisease.description)}</p><div class="data-list"><div><strong>Spawned</strong></div><div>Day ${activeDisease.spawnedAt}</div><div><strong>Cure Target</strong></div><div>${money(
      activeDisease.cureTarget,
    )}</div><div><strong>Funded</strong></div><div>${money(
      activeDisease.funded || 0,
    )}</div><div><strong>Remaining</strong></div><div>${money(
      Math.max(0, (activeDisease.cureTarget || 0) - (activeDisease.funded || 0)),
    )}</div></div>${
      activeDisease.cured
        ? '<div class="badge good">Cured — the global disease has been eradicated.</div>'
        : `<p class="help">Nations can fund the cure. Once the cure target is reached, the disease is eradicated for everyone.</div>${button(
          "Fund the Cure",
          "openFundDiseaseCure",
          {},
          true,
          "",
        )}`
    }</section>`
    : `<section class="card section"><h3>Global Disease</h3><p class="muted">No active global disease right now.</p><p class="help">Spawn chance: ${gw.globalDiseaseSpawnChance || 0}% per turn (rises with pollution, disease, low happiness and poor environment).</p></section>`;

  // ── Forums: Color + World ──
  const forumScope = state.forumScope || "color";
  const scopeDef = forumScope === "world" ? { key: "world", label: "World Congress", access: canWorld, lock: "Global Internet Network required", lockMsg: "Build the Broadcasting project and Internet wonder to access world motions and vote in global affairs." } : { key: "color", label: catalog.colors[n.factionKey]?.name || "Color Forum", access: canColor, lock: "Broadcasting Network required", lockMsg: "Build the Broadcasting project to read, propose, and vote on motions in your color forum." };

  const representative = state.congress?.[n.factionKey]?.representatives.includes(n.id) || false;
  const motions = (state.motions || []).filter((m) => m.scope === forumScope);
  const definitions = Object.fromEntries(
    Object.entries(catalog.motionTypes || {}).filter(([, d]) => d.scope === forumScope),
  );

  const motionList = motions.length
    ? motions
        .slice()
        .reverse()
        .map((m) => {
          const support = m.factionResults
            ? Object.values(m.factionResults || {}).filter((v) => v.position === "for").reduce((s, v) => s + (v.seats || 0), 0)
            : Object.values(m.votes || {}).filter((v) => v.vote === "for").length;
          const alreadyVoted = Object.prototype.hasOwnProperty.call(m.votes || {}, n.id);
          const canVote =
            m.status === "faction_voting" &&
            !alreadyVoted &&
            state.serverTime - (n.factionJoinedAt || 0) >= 86400000;
          return `<article class="forum-topic" data-list-item data-status="${m.status.includes("voting") ? "active" : m.status}" data-search="${esc(m.title + " " + m.body)}"><div class="vote-count">${support}<small>${m.factionResults ? "SEATS FOR" : "VOTES FOR"}</small></div><div class="topic-body"><div class="row">${badge(human(m.status), m.status === "passed" ? "good" : "")}<small>${esc(nationName(state, m.author))} � ${date(m.createdAt)}</small></div><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p>${m.parameters ? `<details class="section"><summary>Motion parameters</summary>${list(Object.fromEntries(Object.entries(m.parameters).map(([k, v]) => [human(k), String(v)])))}</details>` : ""}<div class="row section">${["for", "against", "abstain"].map((v) => button(human(v), "vote", { id: m.id, vote: v }, canVote)).join("")}${alreadyVoted ? badge(`You voted ${m.votes[n.id]?.vote || m.votes[n.id]}`, "good") : ""}</div><small>${m.status.includes("voting") ? `<span data-deadline="${m.endsAt}"></span>` : m.status === "passed" ? `Effect expires ${date(m.effectEndsAt)}` : "Voting concluded"}</small></div></article>`;
        })
        .join("")
    : empty("No motions have been proposed in this forum yet.");

  const proposeDisabled =
    !scopeDef.access || motions.filter((m) => m.author === n.id && m.status.includes("voting")).length >= 3;

  const forums = `<section class="card section"><div class="row spread"><h3>${scopeDef.label}</h3>${badge(scopeDef.access ? "Access granted" : "Locked", scopeDef.access ? "good" : "")}</div><p class="muted">Debate and vote on motions affecting ${forumScope === "world" ? "the world" : "your color bloc"}.</p>${!scopeDef.access ? `<div class="locked" style="margin-bottom:14px">${scopeDef.lockMsg}</div>` : ""}<div class="two-column section">${motionList}<aside class="stack"><section class="card"><h3>Your standing</h3>${list({
    "Color faction": catalog.colors[n.factionKey]?.name,
    "Forum access": scopeDef.access ? "Granted" : "Locked",
    ...(forumScope === "world"
      ? {
          "World affairs": canWorld ? "Granted" : "Locked",
          Role: representative ? "Congress representative" : "Faction member",
        }
      : {}),
    "Voting membership": state.serverTime - (n.factionJoinedAt || 0) >= 86400000 ? "Eligible" : "24 real hours required",
  })}</section><section class="card section"><h3>Propose a motion</h3>${button(
    "Build motion in pop-up",
    "openProposeMotion",
    { scope },
    scopeDef.access && (forumScope !== "world" || representative) && !proposeDisabled,
    "",
  )}<p class="help">World motions require Congress representation. Color motions are open to faction members with Broadcasting. Build the motion in the pop-up, then submit for voting.</p></section></aside></div>${forumScope !== "world" && canWorld ? `<div class="row section"><button data-view="forum" data-value="world" class="${forumScope === "world" ? "active" : ""}">Open World Congress ?</button></div>` : ""}</section>`;

  return `${heading("Global World", "World rates, global disease, and the Color & World Congress forums.", "The living world")}${subnav("forum", { color: catalog.colors[n.factionKey]?.name || "Color", world: "World Congress" }, forumScope)}<div class="two-column">${globalRates}${globalStats}${diseaseSection}${forums}</div>`;
}

/**
 * Sub-tab 2: Bank — World Bank currencies, loans, lottery.
 */
function renderBankTab(state, catalog) {
  const n = state.nation;
  const wb = state.worldBank || {};
  const lottery = state.lottery || {};
  const loans = state.loans || [];
  const activeLoans = loans.filter((l) => l.status === "active");
  const totalOwed = loans.reduce((s, l) => s + l.owed, 0);
  const activePrincipal = activeLoans.reduce((s, l) => s + l.principal, 0);
  const limit = Math.floor((n.taxRevenue || 0) * 52);
  const canBorrow = activeLoans.length < 3 && limit > 0;
  const config = wb.currencyRates || {};
  const currencies = catalog ? Object.entries(config).map(([key, rate]) => ({ key, rate, ...(CURRENCY_DEF[key] || {}) })) : [];

  const currencyRows = currencies
    .map(
      (c) => {
        const inv = (n.currencyInvestments || {})[c.key];
        const points = inv ? inv.points : 0;
        const spent = inv ? inv.totalSpent : 0;
        const currentValue = points * c.rate;
        const pnl = currentValue - spent;
        return `<tr><td>${icon("Currency", c.key)}${esc(c.name)} <small>(${c.abbrev})</small></td><td>${number(c.rate)}</td><td>${number(points)}</td><td>${money(spent)}</td><td>${money(currentValue)}</td><td class="${pnl >= 0 ? "good" : ""}">${money(pnl)}</td><td>${button("Invest", "openCurrencyInvest", { currency: c.key, rate: c.rate }, true, "")}</td></tr>`;
      },
    )
    .join("");

  return `${heading("World Bank", "Borrow, invest, and play the National Pet Lottery. Funded by World Bank interest and territory taxes.", "Global finance")}<div class="two-column"><div class="stack"><section class="card section"><div class="metrics"><div class="metric"><small>Pool</small><strong>${money(lottery.pool || 0)}</strong></div><div class="metric"><small>Active loans</small><strong>${activeLoans.length} / 3</strong></div><div class="metric"><small>Principal owed</small><strong>${money(activePrincipal)}</strong></div><div class="metric"><small>Total owed</small><strong>${money(totalOwed)}</strong></div><div class="metric"><small>Loan limit (1yr revenue)</small><strong>${money(limit)}</strong></div></div>${activeLoans.length ? `<div class="table-wrap section"><table><thead><tr><th>Principal</th><th>Owed</th><th>Rate</th><th>Action</th></tr></thead><tbody>${loans
    .map(
      (l) =>
        l.status === "active"
          ? `<tr><td>${money(l.principal)}</td><td>${money(l.owed)}</td><td>${(l.rate * 100).toFixed(0)}%</td><td>${form(`repay-${l.id}`, "worldBankRepay", `<input type="hidden" name="loanId" value="${l.id}">${input("Repay ($)", "amount", Math.min(l.owed, n.money), "number", 'required min="1" max="999999999999"')}`, "Repay loan", n.money > 0)}</td></tr>`
          : ""
    )
    .join("")}</tbody></table></div>`
    : '<p class="muted">No active World Bank loans.</p>'}${button(
    "Take loan",
    "openLoanModal",
    canBorrow,
    "",
  )}<p class="help">Borrow up to one year of tax revenue. Maximum 3 active loans. Repay with interest over time.</p></section><section class="card section"><h3>World Bank market</h3><p class="muted">Currency exchange rates move with global usage and bank activity.</p><div class="table-wrap"><table><thead><tr><th>Currency</th><th>Rate</th><th>Your points</th><th>Spent</th><th>Value</th><th>P/L</th><th>Action</th></tr></thead><tbody>${currencyRows || '<tr><td colspan="7" class="muted">No currency data.</td></tr>'}</tbody></table></div><p class="help">Buy currency points with your treasury; sell them back at the live rate. P/L is vs your average entry price.</p></section></div><aside class="stack"><section class="card section"><h3>National Pet Lottery</h3><p class="muted">Powerball-style drawing funded by World Bank interest & territory tax. ${money(TICKET_COST)} per ticket, max ${MAX_TICKETS_PER_NATION} per nation per drawing.</p><div class="metrics"><div class="metric"><small>Jackpot pool</small><strong>${money(lottery.pool || 0)}</strong></div><div class="metric"><small>Tickets sold</small><strong>${number(lottery.ticketsSold || 0)}</strong></div><div class="metric"><small>Max per nation</small><strong>${MAX_TICKETS_PER_NATION}</strong></div></div>${lottery.currentDrawing && lottery.currentDrawing.status === "open" ? `<div class="section"><h4>Buy tickets</h4>${form("lottery-form", "lotteryPurchase", `<label>Quick picks<input type="number" name="count" value="1" min="1" max="${MAX_TICKETS_PER_NATION}" required></label>${button("Buy quick picks", "lotteryPurchaseQuick", {}, true, "primary")}</form>`)}<p class="help">Or open the custom picker to choose your own pets.</p>${button("Pick your own pets", "openLotteryPicker", {}, true, "")}</div>` : `<p class="help">No drawing open. A new drawing is scheduled each week.</p>`}${
    lottery.unclaimedWinnings && lottery.unclaimedWinnings.length
      ? `<section class="card section"><h3>Unclaimed winnings</h3>${lottery.unclaimedWinnings.map((w) => `<div class="row spread section"><span>${esc(w.nationName)} — ${esc(w.tier)}</span>${money(w.prize)} ${button("Claim", "lotteryClaim", { ticketId: w.ticketId }, true, "")}</div>`).join("")}</section>`
      : ""
  }${lottery.previousDrawings && lottery.previousDrawings.length ? `<section class="card section"><h3>Recent drawings</h3>${lottery.previousDrawings.map((d) => `<div class="row spread section"><span>${date(d.drawTime)}</span><span>${d.winningNumbers.join(", ")} <span class="muted">| M: ${d.multiplier}</span></span><span>${d.winners.length} winner(s) � ${money(d.totalPayout || 0)}</span></div>`).join("")}</section>` : ""}</aside></div>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   MAIN RENDER
   ═════════════════════════════════════════════════════════════════════════════ */

const CURRENCY_DEF = {
  aurel: { name: "Aurel", abbrev: "AUR", symbol: "₳" },
  velt: { name: "Velt", abbrev: "VLT", symbol: "✦" },
  krona: { name: "Krona", abbrev: "KRN", symbol: "₭" },
  drachma: { name: "Drachma", abbrev: "DRM", symbol: "ð" },
  sovereign: { name: "Sovereign", abbrev: "SOV", symbol: "ꜱ" },
  talon: { name: "Talon", abbrev: "TLN", symbol: "₮" },
};

function heading(title, subtitle, kicker = "World") {
  return `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><button data-help-topic="world">Help with this page</button></header>`;
}
function subnav(name, items, active) {
  return `<div class="subnav" role="group" aria-label="${esc(name)}">${Object.entries(
    items,
  )
    .map(
      ([value, label]) =>
        `<button data-view="${name}" data-value="${value}" class="${value === active ? "active" : ""}">${esc(label)}</button>`,
    )
    .join("")}</div>`;
}
function badge(value, style = "") {
  return `<span class="badge ${style}">${esc(value)}</span>`;
}
function icon(group, key, style = "") {
  if (window.Assets && window.Assets.icon) {
    const src = window.Assets.icon(group, key);
    if (src) return `<img class="game-icon ${style}" src="${esc(src)}" alt="${esc(key)}" width="40" height="40" loading="lazy" decoding="async">`;
  }
  return `<span class="game-icon ${style}">?</span>`;
}
function list(object) {
  return `<dl class="data-list">${Object.entries(object)
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("")}</dl>`;
}
function input(label, name, value = "", type = "text", extra = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label>`;
}
function textarea(label, name, value = "", extra = "") {
  return `<label>${esc(label)}<textarea name="${esc(name)}" ${extra}>${esc(value)}</textarea></label>`;
}
function form(id, action, fields, label = "Save", enabled = true) {
  return `<form id="${id}" data-command="${action}" data-allowed="${!!enabled}"><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled ? "" : "disabled"}>${esc(label)}</button></div></form>`;
}

function renderWorldTab(state, catalog) {
  const worldView = state.worldView || "global";
  const active = worldView === "global" ? "global" : "bank";
  return `<div class="world-subtabs"><button data-view="worldView" data-value="global" class="${active === "global" ? "active" : ""}">Global</button><button data-view="worldView" data-value="bank" class="${active === "bank" ? "active" : ""}">World Bank</button></div>${worldView === "global" ? renderGlobalTab(state, catalog) : renderBankTab(state, catalog)}`;
}

window.renderWorldTab = renderWorldTab;
window.TICKET_COST = TICKET_COST;
window.MAX_TICKETS_PER_NATION = MAX_TICKETS_PER_NATION;
window.PET_ICONS_UNIQUE = PET_ICONS_UNIQUE;
