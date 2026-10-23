"use strict";
(() => {
  const app = document.getElementById("app");
  let catalog,
    state,
    stream,
    pending = false,
    online = false,
    tab = "nation",
    authMode = "login",
    category = "improvements",
    researchCategory = "economy",
    forumScope = "color",
    articleId = null,
    messageChannel = "world",
    clockOffset = 0;
  const tabs = [
    ["nation", "▣", "Nation"],
    ["build", "▤", "Build"],
    ["military", "⚔", "Military"],
    ["research", "⌘", "Research"],
    ["diplomacy", "⚑", "Diplomacy"],
    ["trade", "⇄", "Trade"],
    ["alliance", "♜", "Alliance"],
    ["world", "◎", "World"],
    ["news", "▧", "News"],
    ["messages", "✉", "Messages"],
    ["map", "▦", "Map"],
    ["team", "◉", "Team"],
    ["settings", "⚙", "Settings"],
  ];
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
  const attr = (value) => esc(JSON.stringify(value));
  const nationName = (id) =>
    state?.nations.find((n) => n.id === id)?.name || "Unknown nation";
  const empty = (message) => `<div class="empty">${esc(message)}</div>`;
  const badge = (value, style = "") =>
    `<span class="badge ${style}">${esc(value)}</span>`;
  const heading = (title, subtitle, kicker = "Nation command") =>
    `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${badge("Persistent world", "good")}</header>`;
  const button = (
    label,
    action,
    data = {},
    enabled = true,
    style = "primary",
  ) =>
    `<button class="${style}" data-action="${esc(action)}" data-payload="${attr(data)}" ${!enabled || pending || !online ? "disabled" : ""}>${esc(label)}</button>`;
  const cost = (object) =>
    `<div class="cost">${
      Object.entries(object || {})
        .filter(([, v]) => v > 0)
        .map(
          ([key, value]) =>
            `<span class="${state && (key === "money" ? state.nation.money : state.nation.resources[key] || 0) < value ? "short" : ""}">${key === "money" ? money(value) : number(value) + " " + human(key)}</span>`,
        )
        .join("") || "<span>None</span>"
    }</div>`;
  const list = (object) =>
    `<dl class="data-list">${Object.entries(object)
      .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
      .join("")}</dl>`;
  const options = (items, selected) =>
    Object.entries(items)
      .map(
        ([key, value]) =>
          `<option value="${esc(key)}" ${(Array.isArray(selected) ? selected.includes(key) : key === selected) ? "selected" : ""}>${esc(typeof value === "object" ? value.name : value)}</option>`,
      )
      .join("");
  const select = (label, name, items, selected, disabled = false) =>
    `<label>${esc(label)}<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${options(items, selected)}</select></label>`;
  const input = (label, name, value = "", type = "text", extra = "") =>
    `<label>${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
  const textarea = (label, name, value = "", extra = "") =>
    `<label>${esc(label)}<textarea name="${esc(name)}" ${extra}>${esc(value)}</textarea></label>`;
  const form = (
    id,
    action,
    fields,
    label = "Save",
    enabled = true,
    extra = "",
  ) =>
    `<form id="${id}" data-command="${action}" ${extra}><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled && !pending && online ? "" : "disabled"}>${esc(label)}</button></div></form>`;
  const subnav = (name, items, active) =>
    `<div class="subnav" role="tablist" aria-label="${esc(name)}">${Object.entries(
      items,
    )
      .map(
        ([value, label]) =>
          `<button role="tab" aria-selected="${value === active}" data-view="${name}" data-value="${value}" class="${value === active ? "active" : ""}">${esc(label)}</button>`,
      )
      .join("")}</div>`;
  function notice(message, error = false) {
    const node = document.getElementById("notice");
    node.textContent = message;
    node.className = error ? "error" : "";
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => {
      node.textContent = "";
    }, 7000);
  }
  async function api(url, body) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || "Request failed");
    return value;
  }
  function receive(next) {
    if (state && next.revision < state.revision) return;
    if (state && next.revision > state.revision && !pending) {
      const preferences = next.player.settings.notifications;
      if (
        preferences.research &&
        next.nation.completedResearch.length >
          state.nation.completedResearch.length
      )
        notice("Research completed. Your nation has new knowledge.");
      else if (
        preferences.battles &&
        JSON.stringify(next.wars) !== JSON.stringify(state.wars)
      )
        notice("A battle report has been updated.");
      else if (
        preferences.diplomacy &&
        next.treaties.length > state.treaties.length
      )
        notice("A new diplomatic proposal has arrived.");
      else if (
        preferences.general &&
        next.messages.length > state.messages.length
      )
        notice("A new message has arrived.");
      else if (preferences.trade && next.offers.length !== state.offers.length)
        notice("The trade exchange has been updated.");
    }
    state = next;
    clockOffset = next.serverTime - Date.now();
    render();
  }
  function connect() {
    stream?.close();
    stream = new EventSource("/api/events");
    stream.addEventListener("state", (event) => {
      online = true;
      receive(JSON.parse(event.data));
    });
    stream.addEventListener("clock", (event) => {
      online = true;
      clockOffset = JSON.parse(event.data).serverTime - Date.now();
      updateClock();
    });
    stream.onerror = () => {
      online = false;
      render();
    };
  }
  async function command(action, data) {
    if (pending || !online) return;
    pending = true;
    render();
    try {
      receive(
        await api("/api/action", {
          action,
          data,
          requestId: crypto.randomUUID(),
        }),
      );
      notice("Saved to the world.");
    } catch (error) {
      notice(error.message, true);
      try {
        receive(await api("/api/state"));
      } catch {
        online = false;
      }
    } finally {
      pending = false;
      render();
    }
  }
  function auth() {
    const fields = `${input("Username", "username", "", "text", 'required minlength="3" maxlength="32" autocomplete="username"')}${input("Password", "password", "", "password", `required minlength="10" maxlength="200" autocomplete="${authMode === "login" ? "current-password" : "new-password"}"`)}${authMode === "register" ? `${input("Nation name", "name", "", "text", 'required minlength="3" maxlength="60"')}<div class="form-grid">${select("Government", "government", catalog.governments, "liberalDemocracy")}${select("Religion", "religion", catalog.religions, "monotheism")}${select("Color faction", "factionKey", catalog.colors, "blue")}${select("Primary resource", "primaryResource", Object.fromEntries(catalog.resources.slice(0, 10).map((r) => [r, human(r)])), "food")}</div><p class="muted">Your nation begins with $15,000,000, 10 land blocks, 1,000 infrastructure and 0 technology. Buy your first technology level to establish a population.</p>` : ""}`;
    app.innerHTML = `<main class="auth"><section class="auth-intro"><div class="crest">DW</div><div class="eyebrow section">A living world. Your legacy.</div><h1>Every nation<br>has a beginning.</h1><div class="line"></div><p>Build a nation. Shape its government. Trade, form alliances, and make your voice heard in the World Forum.</p><p>One real hour is one game day. Your nation continues to develop while you’re away.</p></section><section class="card">${subnav("auth", { login: "Sign in", register: "Found a nation" }, authMode)}<h2>${authMode === "login" ? "Welcome back" : "Write your first chapter"}</h2><form id="auth-form"><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${pending ? "disabled" : ""}>${authMode === "login" ? "Enter the world" : "Create account & nation"}</button></div></form></section></main>`;
  }
  function capture() {
    const drafts = [];
    for (const element of app.querySelectorAll("input,select,textarea"))
      if (element.form?.id && element.name)
        drafts.push([
          element.form.id,
          element.name,
          element.multiple
            ? [...element.selectedOptions].map((o) => o.value)
            : element.value,
          element.checked,
        ]);
    const focused = document.activeElement;
    return {
      drafts,
      focus: focused?.form?.id
        ? [
            focused.form.id,
            focused.name,
            focused.selectionStart,
            focused.selectionEnd,
          ]
        : null,
      details: [...app.querySelectorAll("details[open][id]")].map((d) => d.id),
      scroll: document.querySelector(".chat-log")?.scrollTop,
    };
  }
  function restore(saved) {
    for (const [id, name, value, checked] of saved.drafts) {
      const e = document.getElementById(id)?.elements.namedItem(name);
      if (e) {
        if (Array.isArray(value) && e.multiple) {
          for (const option of e.options)
            option.selected = value.includes(option.value);
        } else e.value = value;
        if (e.type === "checkbox") e.checked = checked;
      }
    }
    for (const id of saved.details) {
      const d = document.getElementById(id);
      if (d) d.open = true;
    }
    if (saved.focus) {
      const [id, name, start, end] = saved.focus,
        e = document.getElementById(id)?.elements.namedItem(name);
      if (e) {
        e.focus({ preventScroll: true });
        if (
          e.setSelectionRange &&
          start !== null &&
          ["text", "password", "search", "textarea"].includes(e.type)
        )
          e.setSelectionRange(start, end);
      }
    }
    const log = document.querySelector(".chat-log");
    if (log && saved.scroll !== undefined) log.scrollTop = saved.scroll;
  }
  function render(preserve = true) {
    if (!state) {
      auth();
      return;
    }
    const saved = preserve ? capture() : null,
      n = state.nation;
    app.innerHTML = `<header class="topbar"><div class="brand"><div class="crest">DW</div><div><strong>${esc(state.worldName)}</strong><small>${esc(n.name)}</small></div></div><div class="top-stats"><div class="top-stat"><small>Treasury</small><strong>${money(n.money)}</strong></div><div class="top-stat"><small>Population</small><strong>${number(n.population)}</strong></div><div class="top-stat"><small>Next turn</small><strong class="ticker" id="next-turn">—</strong></div><div><div class="live ${online ? "" : "offline"}">${online ? "World connected" : "Reconnecting…"}</div><small>Year ${Math.floor(state.day / 360) + 1} · Day ${(state.day % 360) + 1}</small></div></div></header><div class="layout"><nav class="sidebar" aria-label="Main menu"><div class="nav-label">YOUR EMPIRE</div>${tabs.map(([key, icon, label]) => `<button class="nav-button ${tab === key ? "active" : ""}" data-tab="${key}" ${tab === key ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</button>`).join("")}<div class="sidebar-footer">THE WORLD KEEPS TURNING<br>1 hour = 1 game day<br>All actions save automatically.</div></nav><main class="workspace" id="workspace">${pages[tab]()}</main></div>`;
    if (saved) restore(saved);
    motionFields();
    if (saved) restore(saved);
    updateClock();
    updateUnitButtons();
  }
  function updateClock() {
    if (!state) return;
    const remaining = Math.max(0, state.nextTurnAt - Date.now() - clockOffset),
      seconds = Math.floor(remaining / 1000);
    const el = document.getElementById("next-turn");
    if (el)
      el.textContent = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    for (const e of document.querySelectorAll("[data-deadline]")) {
      const left = Math.max(
        0,
        Number(e.dataset.deadline) - Date.now() - clockOffset,
      );
      e.textContent = `${Math.floor(left / 3600000)}h ${Math.floor(left / 60000) % 60}m remaining`;
    }
  }
  function nationPage() {
    const n = state.nation,
      p = state.player,
      faction = catalog.colors[n.factionKey];
    const bars = [
      "happiness",
      "literacy",
      "environment",
      "crime",
      "disease",
      "pollution",
    ]
      .map(
        (key) =>
          `<div class="stat-row"><div class="stat-label"><span>${human(key)}${["crime", "disease", "pollution"].includes(key) ? " · lower is better" : ""}</span><strong>${number(n.nationStats[key])}%</strong></div><progress max="100" value="${Math.min(100, n.nationStats[key])}" aria-label="${key}"></progress></div>`,
      )
      .join("");
    const choices = ["government", "religion"]
      .map((key) => {
        const definitions =
            key === "government" ? catalog.governments : catalog.religions,
          def = definitions[n[key]],
          locked =
            key === "government"
              ? n.projects.governmentStatue && !n.wonders.governmentMonument
              : n.projects.religiousStatue && !n.wonders.religiousMonument;
        return `<section class="card"><h3>${human(key)}</h3>${form(`nation-${key}`, key, select("Current selection", "value", definitions, n[key], locked) + `<p class="muted">${esc(def.description)}</p>${n.demandTimer?.[`isDemanding${human(key)}`] ? `<p class="help">Public priority: ${esc(n.demandTimer[`current${human(key)}Hint`])}</p>` : ""}<details id="${key}-effects"><summary>Benefits & deductions</summary>${list({ ...Object.fromEntries(Object.entries(def.bonuses || {}).map(([k, v]) => [human(k), number(v)])), ...Object.fromEntries(Object.entries(def.penalties || {}).map(([k, v]) => ["Penalty: " + human(k), number(v)])) })}</details><small>${locked ? "Locked by a permanent statue." : "Changes are subject to the nation’s government/religion rules."}</small>`, "Apply selection", !locked)}</section>`;
      })
      .join("");
    const policies = Object.entries(catalog.policies)
      .map(([key, values]) =>
        form(
          `policy-${key}`,
          "policy",
          `<input type="hidden" name="policy" value="${key}">${select(human(key), "value", Object.fromEntries(values.map((v) => [v, human(v)])), n.domesticPolicies[key], !n.improvements.internalAffairsOffice)}`,
          "Set policy",
          !!n.improvements.internalAffairsOffice,
        ),
      )
      .join("");
    return `${heading("Nation sheet", "Identity, people, economy, and policy. Your nation at a glance.")}<section class="nation-banner"><div class="nation-flag" style="--faction:${faction.hex}" aria-label="${esc(faction.name)} flag">${esc(n.name.slice(0, 1))}</div><div><div class="eyebrow">${esc(faction.name)} · Founded turn ${n.foundedDay + 1}</div><h1>${esc(n.name)}</h1><p class="motto">“${esc(n.motto)}”</p><small>Led by ${esc(n.leader)} · ${esc(n.capitalCity)}</small></div></section><div class="metrics">${[
      ["Population", number(n.population), "Nation’s people"],
      ["Treasury", money(n.money), "Available to spend"],
      ["Net / turn", money(n.budget.balance), "Taxes less military upkeep"],
      ["Land blocks", number(n.mapBlocks), `${number(n.land)} square miles`],
    ]
      .map(
        ([k, v, h]) =>
          `<div class="metric"><small>${k}</small><strong>${v}</strong><span>${h}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="two-column"><div class="stack"><section class="card"><h3>National record</h3>${list({ Capital: n.capitalCity, Leader: n.leader, Government: catalog.governments[n.government].name, Religion: catalog.religions[n.religion].name, "Primary resource": human(n.primaryResource), Technology: number(n.tech), Infrastructure: number(n.infra), Age: `${state.day - n.foundedDay} game days` })}<details id="edit-identity" class="section"><summary>Edit national identity</summary>${form("identity-form", "identity", input("Capital city", "capital", n.capitalCity, "text", 'required maxlength="60"') + input("National motto", "motto", n.motto, "text", 'maxlength="160"'))}</details></section><section class="card"><h3>Development</h3><p class="muted">Land expands building capacity. Infrastructure and technology support population and taxable income.</p><div class="grid section">${["land", "infra", "tech"].map((kind) => `<div><h4>${kind === "land" ? "100-mile land block" : human(kind)}</h4><p>${money(state.development[kind])} for next unit</p>${form(`develop-${kind}`, "develop", `<input type="hidden" name="kind" value="${kind}">${input("Quantity", "amount", 1, "number", 'min="1" max="100" step="1" required')}`, "Purchase", n.money >= state.development[kind])}</div>`).join("")}</div></section><div class="grid">${choices}</div></div><aside class="stack"><section class="card"><h3>People & quality of life</h3>${bars}</section><section class="card"><h3>Budget per turn</h3>${list({ "Tax rate": number(n.taxRate) + "%", "Taxable income": money(n.taxableIncome), "Tax revenue": money(n.taxRevenue), "Military upkeep": money(n.militaryBudget), "Net income": money(n.budget.balance), "Lifetime taxes": money(n.totalTaxEarned) })}<p class="help">Taxes are collected once per hourly turn. Purchases and opening menus do not collect income.</p></section><section class="card"><h3>Leader progression</h3>${list({ Level: p.level, Experience: `${number(p.experience)} / ${number(p.experienceToNext)}`, "Skill points": p.unallocatedSkillPoints, "Legendary points": p.unallocatedLegendarySkillPoints, Energy: number(p.currentEnergy), Intuition: number(p.currentIntuition) })}<progress value="${p.experience}" max="${p.experienceToNext}" aria-label="Level progress"></progress></section></aside></div><section class="section"><div class="section-title"><h2>Domestic policies</h2>${badge(n.improvements.internalAffairsOffice ? "Office active" : "Internal Affairs Office required")}</div><div class="grid">${policies}</div></section><section class="section"><h2>Leader skills</h2><div class="grid section">${Object.entries(
      catalog.skills,
    )
      .map(
        ([key, def]) =>
          `<article class="card"><h3>${esc(def.name)}</h3><p class="muted">${esc(def.description)}</p><p>Level ${p.skills[key].level} · ${esc(state.skills[key].value)}</p><div class="row section">${button(`Upgrade · ${state.skills[key].cost ?? "Max"} SP`, "skill", { key }, state.skills[key].cost !== null && p.unallocatedSkillPoints >= state.skills[key].cost)}${button("Legendary +1", "legendarySkill", { key }, p.unallocatedLegendarySkillPoints > 0, "")}</div></article>`,
      )
      .join(
        "",
      )}</div><div class="section">${button("Go legendary · reset normal skills, gain permanent progression", "legendary", {}, p.level === 100)}</div></section>`;
  }
  function buildPage() {
    const definitions = catalog.buildings[category],
      quotes = state.buildings[category],
      first = Object.values(quotes)[0];
    return `${heading("Construction & development", "Choose your next investment. Requirements and availability update with your nation.", "Build your future")}${subnav("build", { improvements: "Improvements", projects: "Projects", wonders: "Wonders" }, category)}<section class="slots"><div><strong>${first.available}</strong><small>available slots</small></div><div><strong>${first.used} / ${first.capacity}</strong><small>slots occupied</small></div><div><strong>${first.cooldown}</strong><small>turns until next construction</small></div><small>${category === "improvements" ? "1 slot per land block." : category === "projects" ? "1 slot per 10 blocks. Broadcasting uses no slot. 14-turn cooldown." : "1 slot per 20 blocks. 28-turn cooldown."}</small></section><div class="grid">${Object.entries(
      definitions,
    )
      .map(([key, def]) => {
        const q = quotes[key];
        return `<article class="card building-card"><div class="card-title"><div><div class="eyebrow">${esc(def.category)}</div><h3>${esc(def.name)}</h3></div>${badge(`${q.owned} / ${def.maxCount} owned`, q.owned ? "good" : "")}</div><p class="description">${esc(def.description)}</p><div class="effect">${esc(def.effect)}</div><div><h4>Construction cost</h4><div style="margin-top:9px">${cost(q.cost)}</div></div><div class="requirements"><strong>Requirements:</strong> ${esc([def.techRequired ? `Technology ${def.techRequired}` : "", def.requires ? `Requires ${catalog.buildings.projects[def.requires]?.name || catalog.buildings.wonders[def.requires]?.name || human(def.requires)}` : "", def.bonusRequirement ? `${human(def.bonusRequirement)} bonus` : ""].filter(Boolean).join(" · ") || "No technology or building prerequisites")}<br>${def.permanent ? "Permanent · cannot be demolished." : "Can be demolished. Salvage Yard enables cost recovery."}${def.special ? `<br>${esc(def.special)}` : ""}</div><footer><div class="reasons">${esc(q.reasons.join(" · ") || "Ready to build")}</div><div class="actions">${button("Build", "build", { category, key }, q.canBuild)}${button("Demolish", "demolish", { category, key }, q.canDestroy, "")}</div>${!q.canDestroy && q.owned ? `<div class="reasons">${esc(q.destroyReasons.join(" · "))}</div>` : ""}</footer></article>`;
      })
      .join("")}</div>`;
  }
  function militaryPage() {
    const n = state.nation;
    const mods = {
      ...n.improvementEffects,
      ...n.projectEffects,
      ...n.wonderEffects,
      ...n.motionModifiers,
    };
    const effects = Object.fromEntries(
      Object.entries(mods)
        .filter(([k]) =>
          /military|soldier|tank|aircraft|ship|missile|nuclear|spy|defens|upkeep|energy/i.test(
            k,
          ),
        )
        .map(([k, v]) => [
          human(k),
          typeof v === "boolean" ? (v ? "Active" : "Inactive") : number(v),
        ]),
    );
    return `${heading("Armed forces", "Recruit, maintain, and command your military. All costs and capacity limits are enforced at purchase.", "National defense")}<div class="metrics">${[
      ["Strength", number(n.militaryStrength)],
      ["Morale", number(n.nationStats.militaryMorale) + "×"],
      ["Energy", number(state.player.currentEnergy)],
      ["Upkeep / turn", money(state.upkeep.money)],
    ]
      .map(
        ([k, v]) =>
          `<div class="metric"><small>${k}</small><strong>${v}</strong></div>`,
      )
      .join(
        "",
      )}</div>${n.militaryMaintenanceDeficit ? '<div class="locked">Maintenance could not be paid last turn. Military strength is reduced by 50% until upkeep is paid on a later turn.</div>' : ""}<div class="two-column section"><section class="card"><h3>Upkeep & readiness</h3>${cost({ money: state.upkeep.money, ...state.upkeep.resources })}<p class="help">Upkeep is charged every game day (one real hour). Soldier upkeep rounds up per 100 units; tank upkeep rounds up per 10.</p>${list({ Intuition: number(state.player.currentIntuition), "Maintenance penalty": n.militaryMaintenanceDeficit ? "−50%" : "None", "Population efficiency": number(n.nationStats.populationEfficiency) + "×", "Temporary workforce reduction": number((n.temporaryEffects || []).filter((e) => e.type === "populationReduction").reduce((s, e) => s + e.amount, 0)) })}</section><section class="card"><h3>Active boosts & deductions</h3>${Object.keys(effects).length ? list(effects) : '<p class="muted">No military building effects yet.</p>'}</section></div><div class="grid section">${Object.entries(
      state.units,
    )
      .map(
        ([type, q]) =>
          `<article class="card building-card"><div class="card-title"><h3>${human(type)}</h3>${badge(`${number(q.owned)} / ${number(q.capacity)}`)}</div><p class="muted">${esc(q.description)}</p><div><h4>Cost per unit</h4>${cost(q.cost)}</div><div><h4>Upkeep per ${catalog.unitUpkeep[type].group} / turn</h4>${cost(Object.fromEntries(Object.entries(catalog.unitUpkeep[type]).filter(([key]) => key !== "group")))}</div><div class="requirements">${q.techRequired ? `Technology ${q.techRequired}` : "No technology requirement"}${q.prerequisite ? ` · Requires ${human(q.prerequisite)}` : ""}<br>${q.populationImpact ? `${q.populationImpact} workforce reduction per unit / one turn` : type === "soldiers" ? "1 workforce reduction per 10 soldiers / one turn" : ""}</div><footer><form class="unit-form" id="unit-${type}" data-command="buyUnit"><input type="hidden" name="type" value="${type}">${input("Quantity", "amount", 1, "number", 'min="1" max="1000000" step="1" required')}<button class="primary" data-buy-unit="${type}">Buy</button><button type="button" data-sell-unit="${type}">Sell</button></form><p class="reasons" id="unit-reason-${type}">${esc(q.reasons.join(" · ") || "Ready to recruit")}</p><small>Sell for 50% of paid money. No resource refund. Automatic production has no sale value.</small></footer></article>`,
      )
      .join(
        "",
      )}</div><section class="card section"><h2>Intelligence reports</h2>${
      Object.entries(n.intelligence || {})
        .map(
          ([id, report]) =>
            `<article class="section"><h3>${esc(nationName(id))}</h3><small>Observed ${date(report.at)} · Information reflects the time of the mission.</small>${list({ Treasury: money(report.money), ...Object.fromEntries(Object.entries(report.units).map(([key, value]) => [human(key), number(value)])) })}</article>`,
        )
        .join("") ||
      '<p class="muted">Successful spy missions reveal military inventories and treasury balances here.</p>'
    }</section><section class="section"><div class="section-title"><h2>Active wars</h2><small>15-minute preparation · 4-hour rounds · best of 3</small></div>${
      state.wars.length
        ? state.wars
            .map(
              (w) =>
                `<article class="card section"><div class="row spread"><h3>${esc(nationName(w.attacker))} vs ${esc(nationName(w.defender))}</h3>${badge(w.status)}</div><p>${esc(w.reason)}</p><p>Round ${w.round} · ${w.status === "ended" ? `Result: ${esc(nationName(w.result) === "Unknown nation" ? w.result : nationName(w.result))}` : `<span data-deadline="${w.endsAt}"></span>`}</p><div class="row section">${["conventional", "missiles", "nukes", "spies"].map((type) => button(human(type), "attack", { id: w.id, type }, w.status === "active")).join("")}${button("Offer white peace", "peace", { id: w.id }, w.status !== "ended", "")}</div><details id="war-${w.id}" class="section"><summary>Battle reports</summary>${w.log.map((e) => `<p>${esc(nationName(e.actor))} · ${human(e.type)} · ${number(e.damage)} ${e.type === "conventional" ? "combat" : "infrastructure"} damage · ${date(e.at)}</p>`).join("") || "No engagements yet."}${
                  w.casualties
                    ? `<h4 class="section">Units lost</h4>${Object.entries(
                        w.casualties,
                      )
                        .map(
                          ([id, units]) =>
                            `<p>${esc(nationName(id))}: ${
                              Object.entries(units)
                                .map(
                                  ([key, value]) =>
                                    number(value) + " " + human(key),
                                )
                                .join(", ") || "None"
                            }</p>`,
                        )
                        .join("")}`
                    : ""
                }</details></article>`,
            )
            .join("")
        : empty(
            "No current wars. Use Diplomacy to view other nations and declare a war.",
          )
    }</section>`;
  }
  function updateUnitButtons() {
    if (!state) return;
    for (const [type, q] of Object.entries(state.units)) {
      const f = document.getElementById(`unit-${type}`);
      if (!f) continue;
      const amount = Number(f.elements.amount.value),
        valid = Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
      const resources = Object.entries(q.resources).every(
        ([key, value]) => (state.nation.resources[key] || 0) >= value * amount,
      );
      const totalMoney = Math.max(
        amount,
        Math.floor(q.money * amount * q.moneyMultiplier),
      );
      const enough = state.nation.money >= totalMoney;
      const reasons = q.reasons.filter(
        (reason) =>
          !reason.startsWith("Need ") && !reason.startsWith("Capacity "),
      );
      if (!valid) reasons.push("Enter a positive whole quantity");
      if (q.owned + amount > q.capacity) reasons.push("Exceeds capacity");
      if (!resources || !enough)
        reasons.push("Insufficient money or resources");
      f.querySelector("[data-buy-unit]").disabled =
        pending || !online || reasons.length > 0;
      f.querySelector("[data-sell-unit]").disabled =
        pending || !online || !valid || q.owned < amount;
      document.getElementById(`unit-reason-${type}`).textContent =
        reasons.join(" · ") || `Total: ${money(totalMoney)} plus resources`;
    }
  }
  function researchPage() {
    const n = state.nation;
    return `${heading("Research bureau", "Advance through the technology tree. Research continues while you are away.", "Knowledge is power")}<section class="card"><div class="row spread"><h2>Research queue</h2>${badge(`${n.activeResearch.length} / ${n.wonders.great_library ? 2 : 1} slots`)}</div>${n.activeResearch.length ? n.activeResearch.map((task) => `<div class="section"><div class="row spread"><strong>${esc(catalog.research[task.key].name)}</strong><span data-deadline="${task.endsAt}"></span>${button("Cancel · 50% refund", "cancelResearch", { key: task.key }, true, "")}</div><progress value="${Math.max(0, Date.now() + clockOffset - task.startedAt)}" max="${task.endsAt - task.startedAt}" aria-label="Research progress"></progress></div>`).join("") : '<p class="muted">Your researchers are ready for their next project.</p>'}</section><div class="section">${subnav("research", { economy: "Economy", healthcare: "Healthcare", production: "Production", war: "War" }, researchCategory)}</div><div class="grid">${Object.entries(
      catalog.research,
    )
      .filter(([, d]) => d.category === researchCategory)
      .map(([key, d]) => {
        const q = state.research[key];
        return `<article class="card building-card"><div class="row spread"><div class="eyebrow">Tier ${d.tier}</div>${badge(n.completedResearch.includes(key) ? "Completed" : `${number(q.duration / 3600000)} hours`, n.completedResearch.includes(key) ? "good" : "")}</div><h3>${esc(d.name)}</h3><p class="description">${esc(d.description)}</p>${cost({ money: d.cost })}<div class="requirements">Technology ${d.requirements.tech_level}${d.requirements.prerequisites?.length ? " · " + esc(d.requirements.prerequisites.map((id) => catalog.research[id]?.name || id).join(", ")) : ""}</div><details id="research-effects-${key}"><summary>Research effects</summary>${list(Object.fromEntries(Object.entries(d.effects).map(([k, v]) => [human(k), "+" + number(v)])))}</details><footer><p class="reasons">${esc(q.reasons.join(" · ") || "Available to research")}</p>${button("Start research", "startResearch", { key }, q.canStart)}</footer></article>`;
      })
      .join("")}</div>`;
  }
  function teamPage() {
    const n = state.nation,
      s = state.sports;
    const teamName = (id) =>
      s.teams.find((t) => t.id === id)?.name || "Unknown team";
    const sportCards = catalog.sports.types
      .map((sport) => {
        const team = s.own[sport],
          unlocked = !!n.wonders[`${sport}Stadium`];
        if (!team)
          return `<section class="card"><h2>${human(sport)}</h2><p class="muted">Requires the ${human(sport)} Stadium wonder. Create a club with a starting roster, coach, and $10M club budget.</p>${form(`team-create-${sport}`, "teamCreate", `<input type="hidden" name="sport" value="${sport}">${input("Club name", "name", "", "text", 'required minlength="3" maxlength="60"')}`, "Create club · $10M", unlocked && n.money >= catalog.sports.creationCost)}</section>`;
        return `<section class="card section"><div class="row spread"><h2>${esc(team.name)}</h2>${badge(human(sport))}</div><div class="metrics section">${[
          ["Club budget", money(team.budget)],
          ["Revenue / turn", money(team.revenue)],
          ["Expenses / turn", money(team.expenses)],
          [
            "Record",
            `${team.stats.wins} W · ${team.stats.losses} L · ${team.stats.draws} D`,
          ],
        ]
          .map(
            ([k, v]) =>
              `<div class="metric"><small>${k}</small><strong>${v}</strong></div>`,
          )
          .join(
            "",
          )}</div><p>Coach: ${esc(team.coach.name)} · Stadium capacity: ${number(team.stadium.capacity)} · Championships: ${team.stats.championships}</p><details id="facilities-${sport}" class="section"><summary>Stadium facilities</summary><div class="grid section">${catalog.sports.upgrades.map((key) => `<article class="card"><h3>${esc(key)}</h3><p>Level ${team.stadium.upgrades[key]} / 10</p>${button("Upgrade · " + money(team.upgradeCosts[key]), "teamUpgrade", { sport, upgradeType: key }, team.stadium.upgrades[key] < 10 && n.money >= team.upgradeCosts[key])}</article>`).join("")}</div></details><details id="lineup-${sport}" class="section"><summary>Starting lineup & roster</summary><div class="grid section">${catalog.sports.positions[sport].map((position, slot) => form(`starter-${sport}-${slot}`, "teamStarter", `<input type="hidden" name="sport" value="${sport}"><input type="number" name="slot" value="${slot}" hidden>${select(position, "playerId", Object.fromEntries(team.players.filter((p) => p.position === position && !p.isInjured && !p.isRetired).map((p) => [p.id, p.name + " · " + number(p.rating)])), team.roster.find(([key]) => String(key) === String(slot))?.[1])}`, "Set starter")).join("")}</div><div class="table-wrap section"><table><thead><tr><th>Player</th><th>Position</th><th>Rating</th><th>Age</th><th>Salary / year</th><th>Status</th><th></th></tr></thead><tbody>${team.players.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.position)}</td><td>${number(p.rating)}</td><td>${p.age}</td><td>${money(p.salary)}</td><td>${p.isInjured ? p.injuryDaysLeft + " turns injured" : team.roster.some(([, key]) => key === p.id) ? "Starting" : "Bench"}</td><td>${button("Release", "teamRelease", { sport, playerId: p.id }, team.players.length > catalog.sports.positions[sport].length, "")}</td></tr>`).join("")}</tbody></table></div></details><details id="agents-${sport}" class="section"><summary>Free agents</summary>${
          s.freeAgents
            .filter((p) => p.sport === sport)
            .map(
              (p) =>
                `<div class="row spread section"><span>${esc(p.name)} · ${esc(p.position)}</span>${button("Sign · " + money(p.salary), "teamSign", { sport, playerId: p.id }, team.budget >= p.salary && team.players.length < 40)}</div>`,
            )
            .join("") ||
          '<p class="muted">Released players will appear here.</p>'
        }</details><details id="competition-create-${sport}" class="section"><summary>Organize a competition</summary><p class="help">Fund a $10M prize from your nation. Registration closes in 3 real days; play begins in 7. The prize returns if fewer than two teams register. Matches are scheduled one hour apart; knockout draws advance the stronger team.</p>${form(`tournament-create-${sport}`, "teamTournament", `<input type="hidden" name="sport" value="${sport}">${select("Format", "type", { league: "League (home and away)", cup: "Knockout cup", championship: "Championship" }, "league")}`, "Organize · $10M", n.money >= catalog.sports.tournamentPrize && !s.tournaments.some((t) => t.sport === sport && ["registration", "active"].includes(t.status)))}</details></section>`;
      })
      .join("");
    return `${heading("National sports clubs", "Manage your squads, improve facilities, and compete with other nations.", "Team management")}${sportCards}<section class="section"><h2>Competitions</h2>${s.tournaments.map((t) => `<article class="card section"><div class="row spread"><h3>${esc(t.name)}</h3>${badge(t.status)}</div><p>${t.participants.length} teams · Prize ${money(t.prize.money)}${t.winner ? " · Winner: " + esc(teamName(t.winner)) : ""}</p>${t.status === "registration" ? `<p>Registration closes ${date(t.registrationDeadline)} · Starts ${date(t.startDate)}</p>${button("Register team", "teamRegister", { sport: t.sport, tournamentId: t.id }, !!s.own[t.sport] && !t.participants.some((p) => p.nationId === n.id) && t.registrationDeadline > state.serverTime)}` : ""}<details id="standings-${t.id}" class="section"><summary>Standings</summary>${t.standings.map(([id, v]) => `<p>${esc(teamName(id))} · ${v.points} points · ${v.wins} W / ${v.draws} D / ${v.losses} L</p>`).join("")}</details></article>`).join("") || empty("No competitions yet. Club owners can organize one above.")}</section><section class="section"><h2>Fixtures & results</h2><div class="grid section">${
      s.matches
        .slice()
        .reverse()
        .map(
          (m) =>
            `<article class="card"><div class="row spread"><strong>${esc(teamName(m.team1))} vs ${esc(teamName(m.team2))}</strong>${badge(m.status)}</div><p>${date(m.date)} · ${human(m.sport)}</p>${m.status === "completed" ? `<h3>${m.score1} – ${m.score2}</h3><details id="match-events-${m.id}" class="section"><summary>Match report</summary>${m.events.map((e) => `<p>${e.minute}′ ${esc(teamName(e.team))} · ${esc(e.type)}</p>`).join("") || "No scoring events."}</details>` : form(`bet-${m.id}`, "teamBet", `<input type="hidden" name="matchId" value="${m.id}">${select("Predicted winner", "prediction", { [m.team1]: teamName(m.team1), [m.team2]: teamName(m.team2), draw: "Draw" }, m.team1)}${input("Stake ($)", "amount", 100, "number", 'min="1" max="1000000" required')}`, "Place bet", !!n.projects.sportsBetting && !s.bets.some((b) => b.matchId === m.id) && ![m.team1, m.team2].some((id) => s.teams.find((t) => t.id === id)?.nationId === n.id))}</article>`,
        )
        .join("") ||
      empty("Registered competitions schedule matches when play begins.")
    }</div><p class="help">Sports Betting unlocks one winner bet per fixture. Club owners cannot bet on their own fixtures. Stakes are deducted immediately and winning returns settle when the match completes.</p></section><section class="card section"><h3>Your bets</h3>${s.bets.map((b) => `<p>${money(b.amount)} at ${number(b.odds)}× · ${esc(b.status)}${b.winnings ? " · Return " + money(b.winnings) : ""}</p>`).join("") || '<p class="muted">No bets placed.</p>'}</section>`;
  }
  function tradeAgreements() {
    const n = state.nation,
      resources = Object.fromEntries(
        catalog.resources.map((key) => [key, human(key)]),
      );
    const others = Object.fromEntries(
      state.nations
        .filter((other) => other.id !== n.id)
        .map((other) => [other.id, other.name]),
    );
    return `<section class="section"><h2>Trade partners</h2><p class="muted">${state.tradePartners.length} / ${n.improvements.port || 0} partners · One partner per Port. Exchanges run after production each hourly turn. No partial deliveries. Either nation can cancel future exchanges.</p><div class="two-column section"><section class="card"><h3>Propose recurring exchange</h3>${form("trade-agreement", "tradePropose", select("Partner", "target", others, Object.keys(others)[0]) + select("You supply", "give", resources, "food") + input("You supply per turn", "giveAmount", 1, "number", 'required min="1" max="1000000"') + select("They supply", "receive", resources, "water") + input("They supply per turn", "receiveAmount", 1, "number", 'required min="1" max="1000000"') + input("Duration (real days; 0 = permanent)", "duration", 7, "number", `required min="${n.projects.tradeHub ? 0 : 1}" max="30"`), "Propose agreement", !!n.improvements.port && Object.keys(others).length > 0)}<p class="help">A Trade Hub unlocks permanent agreements and unlimited market proposals. Both partners need a Port.</p></section><div class="stack">${state.tradeAgreements.map((a) => `<article class="card"><div class="row spread"><h3>${esc(nationName(a.from === n.id ? a.to : a.from))}</h3>${badge(a.status)}</div><p>${esc(nationName(a.from))} supplies ${number(a.giveAmount)} ${human(a.give)}; ${esc(nationName(a.to))} supplies ${number(a.receiveAmount)} ${human(a.receive)} per turn.</p><p>${a.duration ? a.duration + " real days" : "Permanent"} · ${a.deliveries} completed deliveries${a.endsAt ? " · Ends " + date(a.endsAt) : ""}</p>${a.blocked ? `<p class="reasons">${esc(a.blocked)}</p>` : ""}<div class="row section">${a.status === "pending" && a.to === n.id ? button("Accept", "tradeRespond", { id: a.id, accept: true }) + button("Decline", "tradeRespond", { id: a.id, accept: false }, true, "") : ""}${["active", "pending"].includes(a.status) ? button("Cancel", "tradeCancel", { id: a.id }, true, "") : ""}</div></article>`).join("") || empty("No recurring agreements yet.")}</div></div></section>`;
  }
  function tradePage() {
    const n = state.nation;
    return `${heading("Trade exchange", "Buy and sell resources with other nations. Open offers hold money or goods in escrow.", "Commerce & production")}<div class="two-column"><section class="card"><h3>Resource stockpile</h3><div class="table-wrap"><table><thead><tr><th>Resource</th><th>Available</th><th>Type</th></tr></thead><tbody>${catalog.resources.map((key, index) => `<tr><td>${human(key)} ${key === n.primaryResource ? badge("Primary", "good") : ""}</td><td>${number(n.resources[key])}</td><td>${index < 10 ? "Basic" : "Manufactured"}</td></tr>`).join("")}</tbody></table></div></section><div class="stack"><section class="card"><h3>Create market offer</h3>${form("offer-form", "offer", select("Offer type", "side", { sell: "Sell resources", buy: "Buy resources" }, "sell") + select("Resource", "resource", Object.fromEntries(catalog.resources.map((r) => [r, human(r)])), "food") + `<div class="form-grid">${input("Quantity", "amount", 1, "number", 'min="1" max="1000000" required')}${input("Price per unit ($)", "price", 1, "number", 'min="1" max="1000000000" required')}</div>`, "Place offer")}<p class="help">Cancelled offers return escrow after 12 hourly turns. Offers are filled in full and cannot be accepted twice.</p></section><section class="card"><h3>Resource combinations</h3>${Object.entries(
      catalog.bonuses,
    )
      .map(
        ([key, def]) =>
          `<div class="section"><div class="row spread"><strong>${human(key)}</strong>${badge(n.bonusEffects[key] ? "Active" : "Inactive", n.bonusEffects[key] ? "good" : "")}</div><small>${esc(def.description)}<br>Requires: ${esc(def.required.map(human).join(", "))}${def.techRequirement ? " · Technology " + def.techRequirement.tech : ""}</small></div>`,
      )
      .join(
        "",
      )}</section></div></div><section class="section"><h2>Market board</h2><div class="card section table-wrap">${state.offers.length ? `<table><thead><tr><th>Nation</th><th>Side</th><th>Resource</th><th>Quantity</th><th>Price / unit</th><th>Action</th></tr></thead><tbody>${state.offers.map((o) => `<tr><td>${esc(nationName(o.owner))}</td><td>${human(o.side)}</td><td>${human(o.resource)}</td><td>${number(o.amount)}</td><td>${money(o.price)}</td><td>${o.status === "returning" ? `Escrow returns in ${o.returnDay - state.day} turns` : o.owner === n.id ? button("Cancel", "cancelOffer", { id: o.id }, true, "") : button("Accept offer", "acceptOffer", { id: o.id }, o.side === "sell" ? n.money >= o.amount * o.price : n.resources[o.resource] >= o.amount)}</td></tr>`).join("")}</tbody></table>` : empty("No offers yet. Place the first offer for other nations to accept.")}</div></section>${tradeAgreements()}<section class="section"><h2>Manufacturing</h2><p class="muted">Assembly plants manufacture continuously on hourly turns. Choose which production lines run automatically.</p><div class="grid section">${Object.entries(
      catalog.recipes,
    )
      .map(
        ([key, recipe]) =>
          `<article class="card"><h3>${human(key)}</h3><p>${Object.entries(
            recipe.inputs,
          )
            .map(([k, v]) => `${v} ${human(k)}`)
            .join(
              " + ",
            )} → ${recipe.output} ${human(key)}</p><p class="muted">${esc(recipe.description)}</p>${form(`manufacturing-${key}`, "manufacturing", `<input type="hidden" name="product" value="${key}"><label class="checkbox"><input type="checkbox" name="enabled" ${n.manufacturing[key] !== false ? "checked" : ""}>Automatic production</label>`, "Save production")}<details id="manufacture-${key}" class="section"><summary>Manufacture immediately</summary>${form(`batch-${key}`, "manufacture", `<input type="hidden" name="product" value="${key}">${input("Batches", "amount", 1, "number", 'required min="1" max="10000"')}`, "Manufacture", !!n.improvements.assemblyPlant)}</details></article>`,
      )
      .join("")}</div></section>`;
  }
  function diplomacyPage() {
    const n = state.nation,
      nations = state.nations.filter((other) => other.id !== n.id),
      enabled = !!n.improvements.foreignAffairsOffice;
    return `${heading("Diplomatic service", "Build relationships, negotiate treaties, send aid, and manage conflicts.", "Foreign affairs")}${!enabled ? '<div class="locked">Build a Foreign Affairs Office to unlock diplomatic relationships, treaties, and aid.</div>' : ""}<section class="section"><h2>Foreign aid</h2>${state.aid.length ? state.aid.map((a) => `<article class="card section"><div class="row spread"><strong>${esc(nationName(a.from))} → ${esc(nationName(a.to))}</strong>${badge(a.status)}</div><p>${number(a.amount)} ${human(a.type)} · ${["pending", "accepted", "returning"].includes(a.status) ? `<span data-deadline="${a.endsAt}"></span>` : "Settled"}</p>${a.status === "pending" && a.to === n.id ? `<div class="row section">${button("Accept aid", "aidRespond", { id: a.id, accept: true })}${button("Decline", "aidRespond", { id: a.id, accept: false }, true, "")}</div>` : ""}</article>`).join("") : empty("No pending aid. Proposals occupy one of three slots and expire after 7 real days.")}</section><section class="section"><h2>Treaties & proposals</h2>${state.treaties.length ? state.treaties.map((t) => `<article class="card section"><div class="row spread"><h3>${esc(catalog.treatyTypes[t.type].name)}</h3>${badge(t.status)}</div><p>${esc(nationName(t.from))} → ${esc(nationName(t.to))}</p><p class="muted">${esc(catalog.treatyTypes[t.type].description)}</p><small>Agreed compensation: ${money(t.compensation)}${t.endsAt && t.status === "active" ? ` · Expires ${date(t.endsAt)}` : ""}</small><div class="row section">${t.status === "pending" && t.to === n.id ? button("Accept", "treatyRespond", { id: t.id, accept: true }, enabled) + button("Decline", "treatyRespond", { id: t.id, accept: false }, enabled, "") : ""}${["active", "pending"].includes(t.status) ? button("Cancel treaty", "treatyCancel", { id: t.id }, enabled && !(t.status === "active" && catalog.treatyTypes[t.type].cannotBreakEarly), "") : ""}</div></article>`).join("") : empty("No treaties or proposals yet.")}</section><section class="section"><h2>Nations of the world</h2><div class="grid section">${nations.length ? nations.map((other) => `<article class="card"><div class="eyebrow">${esc(catalog.colors[other.factionKey].name)}</div><h3>${esc(other.name)}</h3>${list({ Leader: other.leader, Population: other.population === null ? "Private" : number(other.population), "Last activity": other.lastActive ? date(other.lastActive) : "Private", "Military strength": other.militaryStrength === null ? "Private" : number(other.militaryStrength), Relationship: human(n.relationships[other.id] || "neutral") })}<details id="diplomacy-${other.id}" class="section"><summary>Diplomatic actions</summary><div class="stack">${form(`relationship-${other.id}`, "relationship", `<input type="hidden" name="target" value="${other.id}">${select("Relationship", "relationship", { friend: "Friend", bestFriend: "Best friend", foe: "Foe", nemesis: "Nemesis", neutral: "Neutral" }, n.relationships[other.id] || "neutral")}`, "Set relationship", enabled)}${form(`treaty-${other.id}`, "treatyPropose", `<input type="hidden" name="target" value="${other.id}">${select("Treaty", "type", catalog.treatyTypes, "peace")}${input("Compensation ($)", "compensation", 0, "number", 'min="0" max="1000000000"')}${input("Peace duration (real days)", "duration", 30, "number", 'min="1" max="30"')}`, "Propose treaty", enabled)}${form(`aid-${other.id}`, "aid", `<input type="hidden" name="target" value="${other.id}">${select("Aid type", "type", { money: "Money", tech: "Technology (20% of current level)" }, "money")}${input("Financial aid ($)", "amount", 1000, "number", 'min="1" max="1000000000" required')}`, "Propose aid", enabled && !!n.projects.financialAssistanceOffice)}</div></details><details id="war-declare-${other.id}" class="section"><summary>Military actions</summary>${form(`war-${other.id}`, "declareWar", `<input type="hidden" name="target" value="${other.id}">${input("Reason for war", "reason", "Territorial dispute", "text", 'required maxlength="300"')}`, "Declare war", !n.motionModifiers.peace)}</details></article>`).join("") : empty("No other nations have joined yet. New nations appear here in real time.")}</div></section>`;
  }
  function alliancePage() {
    const n = state.nation,
      a = state.alliances.find((a) => a.id === n.allianceId);
    if (!a)
      return `${heading("Alliance hall", "Find your people. Coordinate diplomacy, pool resources, and build lasting partnerships.", "Stronger together")}<div class="two-column"><section class="stack">${state.alliances.length ? state.alliances.map((a) => `<article class="card"><div class="row spread"><h2>${esc(a.name)}</h2>${badge(a.open ? "Recruiting" : "Closed")}</div><p>${esc(a.description)}</p><p class="muted">${esc(catalog.allianceTemplates[a.government].name)} · ${Object.keys(a.members).length} / 6 members</p><div class="section">${button(a.applications.includes(n.id) ? "Application pending" : "Apply to join", "allianceApply", { id: a.id }, a.open && !a.applications.includes(n.id))}</div></article>`).join("") : empty("No alliances have formed yet.")}</section><section class="card"><h2>Found an alliance</h2><p class="help">Requires the Alliance Headquarters wonder, or a best friend and five friends with the qualifying mutual treaties.</p>${form("alliance-create", "allianceCreate", input("Alliance name", "name", "", "text", 'required minlength="3" maxlength="60"') + select("Government", "government", Object.fromEntries(Object.entries(catalog.allianceTemplates).filter(([key]) => key !== "custom")), "democratic") + textarea("Charter & description", "description", "", 'maxlength="2000"'), "Found alliance", state.canFoundAlliance)}</section></div>`;
    const can = (permission) =>
        a.permissions.includes("all") || a.permissions.includes(permission),
      roles = catalog.allianceTemplates[a.government].roles;
    return `${heading(a.name, a.description || "Your alliance headquarters.", catalog.allianceTemplates[a.government].name)}<div class="metrics"><div class="metric"><small>Members</small><strong>${Object.keys(a.members).length} / 6</strong></div><div class="metric"><small>Treasury</small><strong>${money(a.treasury)}</strong></div><div class="metric"><small>Your role</small><strong style="font-size:18px">${esc(roles.find((r) => r.id === a.members[n.id])?.name)}</strong></div><div class="metric"><small>Recruitment</small><strong>${a.open ? "Open" : "Closed"}</strong></div></div><div class="two-column"><section class="card"><h2>Member roster</h2><div class="table-wrap"><table><thead><tr><th>Nation</th><th>Role</th><th>Management</th></tr></thead><tbody>${Object.entries(
      a.members,
    )
      .map(
        ([id, role]) =>
          `<tr><td>${esc(nationName(id))}${id === a.founder ? " · Founder" : ""}</td><td>${esc(roles.find((r) => r.id === role)?.name || role)}</td><td>${can("all") && id !== a.founder ? form(`role-${id}`, "allianceRole", `<input type="hidden" name="target" value="${id}">${select("Assign role", "role", Object.fromEntries(roles.map((r) => [r.id, r.name])), role)}`, "Assign") : ""}${n.id === a.founder && id !== n.id ? button("Transfer leadership", "allianceTransfer", { target: id }, true, "") : ""}${can("members") && id !== a.founder && id !== n.id ? button("Remove", "allianceKick", { target: id }, true, "danger") : ""}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><div class="section"><h3>Your permissions</h3><div class="pill-row">${a.permissions.map((p) => badge(human(p))).join("")}</div></div>${can("members") ? `<div class="section"><h3>Membership applications</h3>${a.applications.length ? a.applications.map((id) => `<div class="row spread section"><strong>${esc(nationName(id))}</strong><div>${button("Accept", "allianceReview", { target: id, accept: true })}${button("Decline", "allianceReview", { target: id, accept: false }, true, "")}</div></div>`).join("") : '<p class="muted">No pending applications.</p>'}</div>` : ""}</section><div class="stack"><section class="card"><h3>Alliance treasury</h3>${form("alliance-deposit", "allianceDeposit", input("Contribution ($)", "amount", 1000, "number", 'required min="1" max="1000000000"'), "Contribute")}${can("resources") ? `<div class="section">${form("alliance-withdraw", "allianceWithdraw", input("Withdrawal ($)", "amount", 1000, "number", 'required min="1" max="1000000000"'), "Withdraw")}</div>` : '<p class="help">Your role does not grant withdrawal permissions.</p>'}</section>${can("domestic") ? `<section class="card"><h3>Alliance settings</h3>${form("alliance-settings", "allianceSettings", textarea("Charter & description", "description", a.description, 'maxlength="2000"') + `<label class="checkbox"><input name="open" type="checkbox" ${a.open ? "checked" : ""}>Accept membership applications</label>`, "Save settings")}</section>` : ""}<section class="card"><h3>Membership</h3><p class="muted">Founders must transfer leadership before leaving an alliance with other members.</p><div class="section">${button("Leave alliance", "allianceLeave", {}, a.founder !== n.id || Object.keys(a.members).length === 1, "danger")}</div></section></div></div><section class="card section"><h3>Alliance activity</h3>${
      a.log
        .slice()
        .reverse()
        .map(
          (log) =>
            `<p><small>${date(log.at)}</small> · ${esc(nationName(log.actor))} · ${esc(human(log.action.replace("alliance", "")))}</p>`,
        )
        .join("") || '<p class="muted">Your alliance story starts here.</p>'
    }</section>`;
  }
  function worldPage() {
    const n = state.nation,
      allowed =
        forumScope === "world"
          ? n.projects.broadcasting && n.wonders.internet
          : n.projects.broadcasting,
      representative = state.congress[n.factionKey].representatives.includes(
        n.id,
      );
    const motions = state.motions.filter((m) => m.scope === forumScope),
      definitions = Object.fromEntries(
        Object.entries(catalog.motionTypes).filter(
          ([, d]) => d.scope === forumScope,
        ),
      );
    return `${heading("World Forum", "Debate the issues. Cast your vote. Shape the future of your color bloc and the world.", "The assembly")}${subnav("forum", { color: catalog.colors[n.factionKey].name, world: "World Congress" }, forumScope)}<div class="two-column"><div class="stack">${
      !allowed
        ? `<section class="locked"><h3>${forumScope === "world" ? "Global Internet Network required" : "Broadcasting Network required"}</h3><p>${forumScope === "world" ? "Build the Broadcasting project and Internet wonder to access world motions and vote in global affairs." : "Build the Broadcasting project to read, propose, and vote on motions in your color forum."}</p></section>`
        : `<section class="card" style="padding:0">${
            motions.length
              ? motions
                  .slice()
                  .reverse()
                  .map((m) => {
                    const votes = Object.values(m.votes),
                      support = votes.filter((v) => v.vote === "for").length;
                    return `<article class="forum-topic"><div class="vote-count">${support}<small>SUPPORT</small></div><div class="topic-body"><div class="row">${badge(human(m.status), m.status === "passed" ? "good" : "")}<small>${esc(nationName(m.author))} · ${date(m.createdAt)}</small></div><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p><details id="motion-${m.id}" class="section"><summary>Motion parameters & tally</summary>${list({ ...Object.fromEntries(Object.entries(m.parameters).map(([k, v]) => [human(k), String(v)])), For: support, Against: votes.filter((v) => v.vote === "against").length, Abstain: votes.filter((v) => v.vote === "abstain").length, "Required support": number(m.threshold * 100) + "%" })}</details><div class="row section">${["for", "against", "abstain"].map((v) => button(human(v), "vote", { id: m.id, vote: v }, m.status === "faction_voting" && !m.votes[n.id] && state.serverTime - n.factionJoinedAt >= 86400000)).join("")}${m.votes[n.id] ? badge(`You voted ${m.votes[n.id].vote}`, "good") : ""}</div><small>${m.status.includes("voting") ? `<span data-deadline="${m.endsAt}"></span>` : m.status === "passed" ? `Effect expires ${date(m.effectEndsAt)}` : "Voting concluded"}</small></div></article>`;
                  })
                  .join("")
              : empty(
                  "No motions have been proposed. Open the discussion with a proposal below.",
                )
          }</section>${form("motion-form", "proposeMotion", select("Motion type", "type", definitions, Object.keys(definitions)[0]) + input("Title", "title", "", "text", 'required minlength="3" maxlength="120"') + textarea("Proposal", "body", "", 'required minlength="10" maxlength="5000"') + `<div id="motion-parameters"></div>`, "Propose motion", forumScope === "color" || representative)}`
    }</div><aside class="stack"><section class="card"><h3>Your standing</h3>${list({ "Color faction": catalog.colors[n.factionKey].name, Role: representative ? "Congress representative" : "Faction member", "Color forum": n.projects.broadcasting ? "Access granted" : "Locked", "World affairs": n.wonders.internet && n.projects.broadcasting ? "Access granted" : "Locked", "Voting membership": state.serverTime - n.factionJoinedAt >= 86400000 ? "Eligible" : "24 real hours required" })}${form("election-form", "elect", `<label>Representative ballot · up to ${state.congress[n.factionKey].seats} candidates<select name="targets" multiple size="4">${options(Object.fromEntries(state.congress[n.factionKey].eligible.map((id) => [id, nationName(id)])), state.electionVote)}</select></label><small>${state.election.status === "voting" ? "Voting closes " + date(state.election.endsAt) : "Next election opens " + date(state.election.opensAt)}</small>`, "Submit ballot", state.election.status === "voting" && !!n.projects.broadcasting && state.serverTime - n.factionJoinedAt >= 86400000 && state.congress[n.factionKey].eligible.length > 0)}<p class="help">Color voting lasts 24 real hours. World motions then enter a 48-hour congress stage weighted by faction seats. Each nation gets one recorded vote.</p></section><section class="card"><h3>Congress composition</h3>${Object.entries(
      state.congress,
    )
      .map(
        ([key, c]) =>
          `<div class="row spread section"><span>${esc(catalog.colors[key].name)}</span>${badge(`${c.seats} seats`)}<small>${c.representatives.map(nationName).map(esc).join(", ") || "No eligible representative"}</small></div>`,
      )
      .join("")}</section></aside></div>`;
  }
  function newsPage() {
    const article = state.articles.find((a) => a.id === articleId);
    const masthead = `<header class="news-masthead"><div class="eyebrow">Independent voices from every nation</div><h1>The Dominion Herald</h1><div class="eyebrow">Year ${Math.floor(state.day / 360) + 1} · Day ${(state.day % 360) + 1} &nbsp; / &nbsp; World news & opinion</div></header>`;
    if (article)
      return `${masthead}<button data-view="article" data-value="">← Back to the newsroom</button><div class="two-column section"><article class="card"><div class="eyebrow">${esc(article.category)}</div><h1 class="section">${esc(article.title)}</h1><div class="article-meta">By ${esc(nationName(article.author))} · ${date(article.createdAt)}${article.editedAt ? " · Edited " + date(article.editedAt) : ""}</div><div class="article-body">${esc(article.body)}</div><div class="row section">${button(`${article.reactions[state.nation.id] ? "Liked" : "Like"} · ${Object.keys(article.reactions).length}`, "react", { id: article.id }, true, "")}${article.author === state.nation.id ? button("Delete article", "deleteArticle", { id: article.id }, true, "danger") : ""}</div>${article.author === state.nation.id ? `<details id="edit-article" class="section"><summary>Edit article</summary>${form("edit-article-form", "editArticle", `<input type="hidden" name="id" value="${article.id}">${input("Headline", "title", article.title, "text", 'required maxlength="120"')}${textarea("Article", "body", article.body, 'required minlength="10" maxlength="20000"')}`)}</details>` : ""}</article><section class="card"><h3>Discussion · ${article.comments.length}</h3>${article.comments.map((c) => `<div class="comment"><small>${esc(nationName(c.author))} · ${date(c.createdAt)}</small>${esc(c.body)}</div>`).join("") || '<p class="muted">Start the conversation.</p>'}<div class="section">${form("comment-form", "comment", `<input type="hidden" name="id" value="${article.id}">${textarea("Your comment", "body", "", 'required maxlength="2000"')}`, "Post comment")}</div></section></div>`;
    return `${masthead}<div class="two-column"><section class="stack">${state.articles.length ? state.articles.map((a) => `<article class="card"><div class="eyebrow">${esc(a.category)}</div><h2 class="article-title section">${esc(a.title)}</h2><div class="article-meta">${esc(nationName(a.author))} · ${date(a.createdAt)}</div><p class="article-preview">${esc(a.body.slice(0, 260))}${a.body.length > 260 ? "…" : ""}</p><div class="row spread section"><button data-view="article" data-value="${a.id}">Read article →</button><small>${a.comments.length} comments · ${Object.keys(a.reactions).length} likes</small></div></article>`).join("") : empty("The presses are ready. Publish the first story from your nation.")}</section><aside class="card" style="align-self:start"><h2>Publish an article</h2><p class="muted">Share reporting, announcements, analysis, or an opinion with the world.</p><div class="section">${form("article-form", "article", input("Headline", "title", "", "text", 'required minlength="3" maxlength="120"') + select("Section", "category", { News: "World news", Politics: "Politics", Economy: "Economy", Military: "Military", Opinion: "Opinion", Announcement: "Announcements" }, "News") + textarea("Your article", "body", "", 'required minlength="10" maxlength="20000"'), "Publish article")}</div></aside></div>`;
  }
  function messagesPage() {
    const n = state.nation;
    const messages = state.messages.filter((m) => m.channel === messageChannel);
    return `${heading("Communications", "Talk with the world, coordinate with your alliance, or send a private message.", "Dispatches")}${subnav("messages", { world: "World", alliance: "Alliance", private: "Private" }, messageChannel)}<section class="card">${messageChannel === "alliance" && !n.allianceId ? empty("Join an alliance to use its private channel.") : `<div class="chat-log">${messages.map((m) => `<div class="chat-bubble ${m.author === n.id ? "mine" : ""}"><small>${esc(nationName(m.author))}${m.channel === "private" ? " → " + esc(nationName(m.target)) : ""} · ${date(m.createdAt)}</small>${esc(m.body)}</div>`).join("") || '<p class="muted">No messages in this channel yet.</p>'}</div><div class="section">${form("message-form", "message", `<input type="hidden" name="channel" value="${messageChannel}">${messageChannel === "private" ? select("Recipient", "target", Object.fromEntries(state.nations.filter((other) => other.id !== n.id).map((other) => [other.id, other.name]))) : ""}${textarea("Message", "body", "", 'required maxlength="2000"')}`, "Send message", messageChannel !== "private" || state.nations.length > 1)}</div>`}</section>`;
  }
  function mapPage() {
    return `${heading("World atlas", "Every square is 100 square miles. Select an unclaimed square to place one of your available land blocks.", "Territory & influence")}<section class="card"><div class="row spread"><h3>World territories</h3><small>${number(state.nation.mapBlocks - state.nation.territories.length)} unplaced blocks</small></div><div class="map-shell"><div class="world-grid">${Array.from(
      { length: 51 * 51 },
      (_, index) => {
        const x = (index % 51) - 25,
          y = Math.floor(index / 51) - 25,
          key = `${x},${y}`,
          owner = state.territories?.[key],
          nation = state.nations.find((n) => n.id === owner);
        return `<button class="map-tile ${owner ? "owned" : ""}" style="${nation ? `background:${catalog.colors[nation.factionKey].hex}` : ""}" data-action="claim" data-payload="${attr({ x, y })}" title="${x},${y} · ${esc(nation?.name || "Unclaimed")}" aria-label="${x},${y} ${esc(nation?.name || "Unclaimed")}" ${owner || pending || !online || state.nation.territories.length >= state.nation.mapBlocks ? "disabled" : ""}>${nation ? esc(nation.name.slice(0, 1)) : ""}</button>`;
      },
    ).join("")}</div></div><div class="pill-row section">${Object.values(
      catalog.colors,
    )
      .map((c) => badge(c.name))
      .join("")}</div></section>`;
  }
  function settingsPage() {
    return `${heading("Preferences", "Manage notifications, privacy, and your session. The world continues running when you sign out.", "Your account")}<div class="grid">${[
      "notifications",
      "privacy",
    ]
      .map(
        (group) =>
          `<section class="card"><h2>${human(group)}</h2><div class="stack">${Object.entries(
            state.player.settings[group],
          )
            .map(([key, value]) =>
              form(
                `setting-${key}`,
                "settings",
                `<input type="hidden" name="group" value="${group}"><input type="hidden" name="key" value="${key}"><label class="checkbox"><input name="value" type="checkbox" ${value ? "checked" : ""}>${human(key)}</label>`,
                "Save",
              ),
            )
            .join("")}</div></section>`,
      )
      .join(
        "",
      )}<section class="card"><h2>Session</h2><p>Signed in as <strong>${esc(state.player.username)}</strong></p><p class="help">All successful actions are saved on the server. You can close this browser without pausing your nation.</p><button id="logout" class="danger">Sign out</button></section></div>`;
  }
  const pages = {
    team: teamPage,
    nation: nationPage,
    build: buildPage,
    military: militaryPage,
    research: researchPage,
    diplomacy: diplomacyPage,
    trade: tradePage,
    alliance: alliancePage,
    world: worldPage,
    news: newsPage,
    messages: messagesPage,
    map: mapPage,
    settings: settingsPage,
  };
  function motionFields() {
    const f = document.getElementById("motion-form"),
      container = document.getElementById("motion-parameters");
    if (!f || !container) return;
    const def = catalog.motionTypes[f.elements.type.value];
    const defaults = {
      duration: 7,
      resourceType: "all",
      newWorldName: "Dominion Wars",
      timeMultiplier: 1,
      dayLength: 1,
      monthLength: 30,
      yearLength: 360,
      resetCalendar: false,
      penaltyType: "immediate_disarmament",
      tradeRestrictions: "none",
      resourceTypes: "uranium",
      exemptFactions: "",
      exemptions: "",
      exceptions: "",
      projectType: "infrastructure",
      costPerNation: 1000,
      benefits: 1,
    };
    container.innerHTML = `<p class="help">${esc(def.description)} Duration is in real days. Numeric effects are percentages unless named otherwise.</p><div class="form-grid">${(def.parameters || []).map((key) => (key === "resetCalendar" ? '<input type="hidden" name="param-resetCalendar" value="false">' : input(human(key), "param-" + key, defaults[key] ?? 10, typeof defaults[key] === "string" ? "text" : "number", typeof defaults[key] === "string" ? 'maxlength="80"' : `min="0" max="${key === "costPerNation" ? 1000000 : key === "techThreshold" ? 10000 : key === "yearLength" ? 360 : 100}"`))).join("")}</div>`;
  }
  function formData(f) {
    const values = new FormData(f);
    const data = Object.fromEntries(values);
    if (f.dataset.command === "elect") data.targets = values.getAll("targets");
    for (const el of f.elements) {
      if (!el.name) continue;
      if (el.type === "number") data[el.name] = Number(el.value);
      if (el.type === "checkbox") data[el.name] = el.checked;
    }
    if (f.dataset.command === "proposeMotion") {
      data.parameters = {};
      for (const [key, value] of Object.entries(data))
        if (key.startsWith("param-")) {
          data.parameters[key.slice(6)] =
            key === "param-resetCalendar" ? false : value;
          delete data[key];
        }
    }
    return data;
  }
  app.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    if (target.dataset.tab) {
      tab = target.dataset.tab;
      render(false);
      motionFields();
      window.scrollTo({ top: 0 });
      return;
    }
    if (target.dataset.view) {
      const { view, value } = target.dataset;
      if (view === "auth") authMode = value;
      if (view === "build") category = value;
      if (view === "research") researchCategory = value;
      if (view === "forum") forumScope = value;
      if (view === "article") articleId = value || null;
      if (view === "messages") messageChannel = value;
      render(false);
      motionFields();
      return;
    }
    if (target.dataset.action) {
      await command(target.dataset.action, JSON.parse(target.dataset.payload));
      return;
    }
    if (target.dataset.sellUnit) {
      const type = target.dataset.sellUnit;
      await command("sellUnit", {
        type,
        amount: Number(
          document.getElementById(`unit-${type}`).elements.amount.value,
        ),
      });
      return;
    }
    if (target.id === "logout") {
      try {
        await api("/api/logout", {});
        stream?.close();
        state = null;
        online = true;
        render(false);
      } catch (error) {
        notice(error.message, true);
      }
    }
  });
  app.addEventListener("input", (event) => {
    if (event.target.closest(".unit-form")) updateUnitButtons();
  });
  app.addEventListener("change", (event) => {
    if (event.target.form?.id === "motion-form" && event.target.name === "type")
      motionFields();
  });
  app.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = event.target;
    if (pending) return;
    if (f.id === "auth-form") {
      const data = formData(f);
      pending = true;
      f.querySelector("button").disabled = true;
      try {
        const payload =
          authMode === "register"
            ? {
                username: data.username,
                password: data.password,
                nation: {
                  name: data.name,
                  government: data.government,
                  religion: data.religion,
                  factionKey: data.factionKey,
                  primaryResource: data.primaryResource,
                },
              }
            : data;
        online = true;
        receive(await api(`/api/${authMode}`, payload));
        connect();
      } catch (error) {
        notice(error.message, true);
      } finally {
        pending = false;
        if (!state) f.querySelector("button").disabled = false;
        else render();
      }
      return;
    }
    if (f.dataset.command) await command(f.dataset.command, formData(f));
  });
  async function boot() {
    try {
      catalog = await api("/api/catalog");
      online = true;
      const response = await fetch("/api/state");
      if (response.ok) {
        receive(await response.json());
        connect();
      } else auth();
    } catch (error) {
      app.innerHTML = `<main class="loading"><div class="crest">DW</div><h1>World connection unavailable</h1><p>The game server must be running to enter this persistent world.</p><button id="retry-connect">Try again</button></main>`;
      document.getElementById("retry-connect").onclick = boot;
    }
  }
  setInterval(updateClock, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state)
      api("/api/state")
        .then(receive)
        .catch(() => {
          online = false;
          render();
        });
  });
  boot();
})();
