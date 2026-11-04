"use strict";
/**
 * Nation Tab - Sovereignty Epochs
 * Renders the full Nation tab content.
 *
 * Exports: renderNationTab(state) -> HTML string
 */

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

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
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const sectionButton = (label, action) =>
  `<button class="section" data-action="${esc(action)}">${esc(label)}</button>`;

/* ═══════════════════════════════════════════════════════════════════════════
   FLAG HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function flagImageSrc(n, faction) {
  if (n.flag) {
    if (n.flag.type === "uploaded" && n.flag.data) return n.flag.data;
    if (n.flag.image) return n.flag.image;
  }
  return faction?.image || "";
}

function flagFallback(n, faction) {
  return faction?.name?.[0] || "?";
}

function designedFlagPreview(flag) {
  if (!flag || flag.type !== "designed") return "";
  const count = Math.max(1, Math.min(8, Number(flag.stripeCount) || 3));
  const orientation = flag.orientation || "horizontal";
  const colors = (flag.colors || []).slice(0, count);
  const defaultColors = ["#ef4444", "#fbbf24", "#22c55e"];
  const items = colors
    .map((c, i) => {
      const color = c || defaultColors[i % defaultColors.length];
      return `<span class="flag-stripe" style="flex:${orientation === "horizontal" ? "1" : "auto"};background:${esc(color)}"></span>`;
    })
    .join("");
  const dir = orientation === "horizontal" ? "row" : "column";
  return `<div class="designed-flag" style="display:flex;flex-direction:${dir};width:100%;height:100%;border:1px solid var(--border);border-radius:4px;overflow:hidden">${items}</div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HAPPINESS EMOJI (0-100) — red cussing rage face → heart eyes kissing face
   ═══════════════════════════════════════════════════════════════════════════ */

function happinessEmoji(h) {
  h = Number(h || 50);
  if (h <= 0) return "😵";
  if (h <= 10) return "🤬";
  if (h <= 20) return "😡";
  if (h <= 30) return "😤";
  if (h <= 40) return "🤨";
  if (h <= 50) return "😐";
  if (h <= 60) return "🙂";
  if (h <= 70) return "😎";
  if (h <= 80) return "😁";
  if (h <= 90) return "🥰";
  return "🥳";
}

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════════════════════════════ */

function combineBuildingEffects(n) {
  const improvementEffects = n.improvementEffects || {};
  const projectEffects = n.projectEffects || {};
  const wonderEffects = n.wonderEffects || {};

  const combined = {};
  for (const obj of [improvementEffects, projectEffects, wonderEffects]) {
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue;
      combined[k] = (combined[k] || 0) + Number(v || 0);
    }
  }
  return combined;
}

function formatEffect(k, v) {
  if (v === 0) return null;
  const sign = v > 0 ? "+" : "";
  const abs = Math.abs(v);
  // Percent-style stats
  const pctStats = [
    "crime", "disease", "pollution", "environment", "literacy",
    "crimeReduction", "crimeIncrease", "diseaseReduction", "pollutionReduction",
    "literacyBonus", "environmentBonus", "happinessModifier", "foodBonus", "waterBonus"
  ];
  const isPct = pctStats.some((s) => k.includes(s)) || k.endsWith("Reduction") || k.endsWith("Bonus") || k.endsWith("Modifier");
  const raw = isPct ? `${sign}${abs.toFixed(1)}%` : `${sign}${number(abs)}`;
  const label = human(k);
  return { label, raw, good: v > 0, k };
}

function renderCombinedEffects(n) {
  const combined = combineBuildingEffects(n);
  const entries = [];
  for (const [k, v] of Object.entries(combined)) {
    if (v === 0) continue;
    const f = formatEffect(k, v);
    if (f) entries.push(f);
  }
  if (entries.length === 0) return "";

  // Sort: positive first, then by label
  entries.sort((a, b) => (b.good === a.good ? 0 : b.good ? 1 : -1) || a.label.localeCompare(b.label));

  const items = entries.map((f) => {
    const cls = f.good ? "effect-good" : "effect-bad";
    return `<div class="effect-item ${cls}">
      <span class="effect-label">${esc(f.label)}</span>
      <span class="effect-value">${esc(f.raw)}</span>
    </div>`;
  }).join("");

  return `<div class="combined-effects"><h3>Combined Building Effects</h3>${items}</div>`;
}

/* ═════════════════════════════════════════════════════════════════════════
   AWARDS HELPER
   ═════════════════════════════════════════════════════════════════════════ */

function renderNationAwards(n, catalog) {
  const awardIds = Array.isArray(n.achievements) ? n.achievements : [];
  if (!window.AwardSystem || awardIds.length === 0) {
    return '<div class="award-none">No awards unlocked yet.</div>';
  }

  const items = awardIds.map((aid) => {
    const award = window.AwardSystem.getAward(aid);
    if (!award) return '';
    const iconSrc = award.icon ? esc(award.icon) : '🏅';
    const isImg = iconSrc.match(/\.(png|jpg|jpeg|gif|webp)$/i);
    const iconHtml = isImg
      ? `<img src="${iconSrc}" class="award-icon-img" alt="${esc(award.name)}" title="${esc(award.name)} — ${esc(award.description)}" loading="lazy" decoding="async">`
      : `<span class="award-icon-emoji" title="${esc(award.name)} — ${esc(award.description)}">${iconSrc}</span>`;
    return `<div class="award-item">
      ${iconHtml}
    </div>`;
  }).join('');

  return `<div class="award-items-grid">${items || '<span class="award-none">No awards unlocked yet.</span>'}</div>`;
}

/* ═════════════════════════════════════════════════════════════════════════
   BUILT LIST HELPER
   ═════════════════════════════════════════════════════════════════════════ */

function renderBuiltList(n, catalog) {
  const sections = [];
  
  // Improvements
  const improvements = n.improvements || {};
  const impEntries = Object.entries(improvements).filter(([, v]) => v > 0);
  if (impEntries.length > 0) {
    sections.push(`
      <h4>Improvements</h4>
      <div class="built-grid">
        ${impEntries.map(([key, count]) => {
          const def = catalog?.buildings?.improvements?.[key] || {};
          return `<div class="built-item-row">
            <span class="built-name">${esc(def.name || human(key))}</span>
            <span class="built-count">×${number(count)}</span>
            ${def.effect ? `<span class="built-effect">${esc(def.effect)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    `);
  }

  // Projects
  const projects = n.projects || {};
  const projEntries = Object.entries(projects).filter(([, v]) => v > 0);
  if (projEntries.length > 0) {
    sections.push(`
      <h4>Projects</h4>
      <div class="built-grid">
        ${projEntries.map(([key, count]) => {
          const def = catalog?.buildings?.projects?.[key] || {};
          return `<div class="built-item-row">
            <span class="built-name">${esc(def.name || human(key))}</span>
            <span class="built-count">×${number(count)}</span>
            ${def.effect ? `<span class="built-effect">${esc(def.effect)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    `);
  }

  // Wonders
  const wonders = n.wonders || {};
  const wonEntries = Object.entries(wonders).filter(([, v]) => v > 0);
  if (wonEntries.length > 0) {
    sections.push(`
      <h4>Wonders</h4>
      <div class="built-grid">
        ${wonEntries.map(([key, count]) => {
          const def = catalog?.buildings?.wonders?.[key] || {};
          return `<div class="built-item-row">
            <span class="built-name">${esc(def.name || human(key))}</span>
            <span class="built-count">×${number(count)}</span>
            ${def.effect ? `<span class="built-effect">${esc(def.effect)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    `);
  }

  if (sections.length === 0) {
    return '<div class="built-none">No buildings constructed yet.</div>';
  }

  return sections.join('');
}

/* ═════════════════════════════════════════════════════════════════════════
   CITIZEN PREVIEW HELPER
   ═════════════════════════════════════════════════════════════════════════ */

function renderCitizenPreview(n, state) {
  const popSys = window.PopulationSystem;
  const citizens = popSys?.citizens
    ? Array.from(popSys.citizens.values()).filter(c => c.nationId === n.id || c.nationId === n.name).slice(0, 8)
    : [];
  if (citizens.length === 0) {
    return '<div class="citizen-none">No citizens available to view.</div>';
  }
  return `<div class="citizen-grid-preview">
    ${citizens.map(c => {
      const healthCls = c.health >= 70 ? 'good' : c.health >= 40 ? 'warn' : 'bad';
      const happyCls = c.happiness >= 70 ? 'good' : c.happiness >= 40 ? 'warn' : 'bad';
      const loyCls = c.loyalty >= 70 ? 'good' : c.loyalty >= 40 ? 'warn' : 'bad';
      return `<div class="citizen-preview-card" data-action="openCitizenDialog" data-citizen-id="${esc(c.id)}" style="cursor: pointer;">
        <div class="citizen-preview-info">
          <div class="citizen-preview-name">${esc(c.name)}</div>
          <div class="citizen-preview-meta">Age ${c.age} · ${esc(c.job?.title || c.occupation || 'No job')}</div>
          <div class="citizen-preview-stats">
            <span class="citizen-status ${healthCls}">❤${Math.round(c.health || 100)}</span>
            <span class="citizen-status ${happyCls}">☺${Math.round(c.happiness || 50)}</span>
            <span class="citizen-status ${loyCls}">🤝${Math.round(c.loyalty || 0)}</span>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderNationTab(state) {
  const n = state.nation,
    catalog = state.catalog,
    faction = catalog?.colors?.[n.factionKey];

  const nationStats = n.nationStats || {};
  const improvementEffects = n.improvementEffects || {};
  const projectEffects = n.projectEffects || {};
  const wonderEffects = n.wonderEffects || {};
  const policyEffects = n.policyEffects || {};
  const edictEffects = n.edictEffects || {};
  const diplomaticRelations = n.diplomaticRelations || {};
  const relationships = n.relationships || {};

  const happiness = nationStats.happiness || 50;
  const crime = nationStats.crime || 0;
  const diseaseRate = nationStats.disease || 0;
  const pollution = nationStats.pollution || 0;
  const environment = nationStats.environment || 50;
  const literacy = nationStats.literacy || 0;

  // Food / Water coverage
  const foodCoverage = improvementEffects.foodCoverage || 0;
  const foodStackBonus = improvementEffects.foodStackBonus || 0;
  const foodTotal = foodCoverage + foodStackBonus;
  const foodPct = n.population > 0 ? Math.min(100, Math.round((foodTotal / n.population) * 100)) : 0;

  const waterCoverage = improvementEffects.waterCoverage || 0;
  const waterStackBonus = improvementEffects.waterStackBonus || 0;
  const waterTotal = waterCoverage + waterStackBonus;
  const waterPct = n.population > 0 ? Math.min(100, Math.round((waterTotal / n.population) * 100)) : 0;

  // Government / Religion
  const govDef = catalog?.governments?.[n.government];
  const relDef = catalog?.religions?.[n.religion];
  const govLocked = !!n.projects?.governmentStatue && !n.wonders?.governmentMonument;
  const relLocked = !!n.projects?.religiousStatue && !n.wonders?.religiousMonument;
  const govCooldown = n.wonderEffects?.governmentCooldown || 0;
  const relCooldown = n.wonderEffects?.religionCooldown || 0;
  const govChangeable = (!govLocked || n.wonders?.governmentMonument) && govCooldown <= 0;
  const relChangeable = (!relLocked || n.wonders?.religiousMonument) && relCooldown <= 0;

  // Demand state (public wants a change)
  const govDemanding = n.demandTimer?.isDemandingGovernment || false;
  const relDemanding = n.demandTimer?.isDemandingReligion || false;
  const govDaysRemaining = n.demandTimer?.governmentDaysRemaining || 0;
  const relDaysRemaining = n.demandTimer?.religionDaysRemaining || 0;
  const govHint = n.demandTimer?.currentGovernmentHint || null;
  const relHint = n.demandTimer?.currentReligionHint || null;

  // Military units
  const militaryUnits = n.militaryUnits || {};
  const unitTypes = ["soldiers", "tanks", "aircraft", "ships", "spies", "missiles", "nukes"];
  const unitLabels = { soldiers: "Soldiers", tanks: "Tanks", aircraft: "Aircraft", ships: "Ships", spies: "Spies", missiles: "Missiles", nukes: "Nukes" };

  // Relations
  const friends = Object.entries(relationships).filter(([, v]) => v === "friend").map(([id]) => id);
  const foes = Object.entries(relationships).filter(([, v]) => v === "foe").map(([id]) => id);
  const bestFriend = Object.entries(relationships).find(([, v]) => v === "bestFriend")?.[0] || null;
  const nemesis = Object.entries(relationships).find(([, v]) => v === "nemesis")?.[0] || null;
  const maxFriends = diplomaticRelations.maxFriends || 0;
  const maxFoes = diplomaticRelations.maxFoes || 0;
  const canBestFriend = diplomaticRelations.canSelectBestFriend || false;
  const canNemesis = diplomaticRelations.canSelectNemesis || false;

  // Build count summary
  const improvementsCount = Object.values(n.improvements || {}).reduce((a, b) => a + b, 0);
  const projectsCount = Object.values(n.projects || {}).reduce((a, b) => a + b, 0);
  const wondersCount = Object.values(n.wonders || {}).reduce((a, b) => a + b, 0);

  // Treaty counts (treaties this nation is part of)
  const treaties = state.treaties || [];
  const treatyCounts = {};
  for (const t of treaties) treatyCounts[t.type] = (treatyCounts[t.type] || 0) + 1;
  const treatyTypes = catalog?.treatyTypes || {};

  // Edicts
  const edicts = n.edicts || {};
  const edictUnlocked = n.edictUnlocked || {};
  const edictLocked = Object.values(edictUnlocked).some((v) => v === false) || n.edicts === null;

  // Population
  const totalPop = Math.max(1, n.population || 0);
  const workforce = Math.floor(totalPop * 0.6);
  const dependents = totalPop - workforce;

  return `
    <section class="nation-section" id="nation-header-section">
      <div class="nation-header">
        <div class="nation-flag-display" data-action="openFlagDesigner" style="cursor: pointer;" title="Design your flag">
          ${n.flag && n.flag.type === "designed"
            ? designedFlagPreview(n.flag)
            : `<img src="${esc(flagImageSrc(n, faction))}" class="nation-flag-img" alt="Flag" onerror="this.style.display='none';this.previousElementSibling.style.display='grid'">
               <div class="nation-flag-fallback" style="background:${esc(faction?.hex || '#94a3b8')}">${esc(flagFallback(n, faction))}</div>`}
        </div>
        <div class="nation-identity">
          <div class="nation-name-row">
            <h1 class="nation-name-display" id="nation-name-display">${esc(n.name)}</h1>
            <button class="icon-btn" data-action="editNationName" title="Edit nation name">✎</button>
          </div>
          <div class="nation-ruler-row">
            <span class="nation-ruler-label">Ruler:</span>
            <span class="nation-ruler-value" id="nation-ruler-display">${esc(n.leader)}</span>
            <button class="icon-btn" data-action="editRulerName" title="Edit ruler name">✎</button>
          </div>
          <div class="nation-flag-actions">
            ${button("Change Flag", "openFlagModal", {})}
          </div>
        </div>
        <!-- Awards display -->
        <div class="nation-awards">
          <h3>Awards</h3>
          <div class="award-grid">
            ${renderNationAwards(n, catalog)}
          </div>
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-govrel-section">
      <div class="section-title">
        <h2>Government &amp; Religion</h2>
        ${button("Change", "openGovRelModal", {})}
      </div>
      <div class="govrel-grid">
        <div class="govrel-card ${govLocked ? 'locked' : ''} ${!govChangeable ? 'cooldown' : ''} ${govDemanding ? 'demanding' : ''}">
          <div class="govrel-icon">${esc(govDef?.icon || '🏛️')}</div>
          <div class="govrel-info">
            <div class="govrel-name">Government</div>
            <div class="govrel-value">${esc(govDef?.name || n.government)}</div>
            <div class="govrel-desc">${esc(govDef?.description || '')}</div>
            ${govDef?.hint ? `<div class="govrel-hint">Hint: ${esc(govDef.hint)}</div>` : ''}
            ${govDemanding ? `
              <div class="govrel-demand">
                <span class="govrel-badge demand-badge">Public Demand</span>
                <div class="govrel-demand-hint">${esc(govHint || '')}</div>
                <div class="govrel-demand-days">⏳ ${Math.ceil(govDaysRemaining)} days to respond</div>
              </div>
            ` : ''}
          </div>
          <div class="govrel-actions">
            ${govLocked && !n.wonders?.governmentMonument
              ? `<span class="govrel-badge locked-badge">Locked by Government Statue</span>`
              : govCooldown > 0
                ? `<span class="govrel-badge cooldown-badge">Cooldown: ${govCooldown}d</span>`
                : button("Change", "openGovModal", {}, govChangeable)}
          </div>
        </div>
        <div class="govrel-card ${relLocked ? 'locked' : ''} ${!relChangeable ? 'cooldown' : ''} ${relDemanding ? 'demanding' : ''}">
          <div class="govrel-icon">${esc(relDef?.icon || '🕌')}</div>
          <div class="govrel-info">
            <div class="govrel-name">Religion</div>
            <div class="govrel-value">${esc(relDef?.name || n.religion)}</div>
            <div class="govrel-desc">${esc(relDef?.description || '')}</div>
            ${relDef?.hint ? `<div class="govrel-hint">Hint: ${esc(relDef.hint)}</div>` : ''}
            ${relDemanding ? `
              <div class="govrel-demand">
                <span class="govrel-badge demand-badge">Public Demand</span>
                <div class="govrel-demand-hint">${esc(relHint || '')}</div>
                <div class="govrel-demand-days">⏳ ${Math.ceil(relDaysRemaining)} days to respond</div>
              </div>
            ` : ''}
          </div>
          <div class="govrel-actions">
            ${relLocked && !n.wonders?.religiousMonument
              ? `<span class="govrel-badge locked-badge">Locked by Religious Statue</span>`
              : relCooldown > 0
                ? `<span class="govrel-badge cooldown-badge">Cooldown: ${relCooldown}d</span>`
                : button("Change", "openRelModal", {}, relChangeable)}
          </div>
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-culture-section">
      <div class="section-title">
        <h2>Culture</h2>
        ${button("Change", "openCultureModal", {})}
      </div>
      <div class="culture-grid">
        <div class="culture-card">
          <div class="culture-icon">🍽️</div>
          <div class="culture-info">
            <div class="culture-name">National Food</div>
            <div class="culture-value">${esc(human(n.nationalFood || 'None'))}</div>
          </div>
          <button class="section" data-action="openCultureModal">Change</button>
        </div>
        <div class="culture-card">
          <div class="culture-icon">💧</div>
          <div class="culture-info">
            <div class="culture-name">National Water</div>
            <div class="culture-value">${esc(human(n.nationalWater || 'None'))}</div>
          </div>
          <button class="section" data-action="openCultureModal">Change</button>
        </div>
        <div class="culture-card">
          <div class="culture-icon">🐾</div>
          <div class="culture-info">
            <div class="culture-name">National Pet</div>
            <div class="culture-value">${esc(n.nationalPet || 'None')}</div>
          </div>
          <button class="section" data-action="openCultureModal">Change</button>
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-develop-section">
      <div class="section-title">
        <h2>Development</h2>
        ${button("Purchase Levels", "openDevelopModal", {})}
      </div>
      <div class="dev-grid">
        <div class="dev-card">
          <div class="dev-icon">🏞️</div>
          <div class="dev-info">
            <div class="dev-name">Land</div>
            <div class="dev-value">${number(n.land)} miles</div>
            <div class="dev-cost">Cost: ${money(state.development?.land || 0)} / mile</div>
          </div>
          <div class="dev-actions">
            <input name="devLandAmount" type="number" value="1" min="1" max="1000">
            ${button("Buy", "developLand", {}, true)}
          </div>
        </div>
        <div class="dev-card">
          <div class="dev-icon">🏗️</div>
          <div class="dev-info">
            <div class="dev-name">Infrastructure</div>
            <div class="dev-value">${number(n.infra)}</div>
            <div class="dev-cost">Cost: ${money(state.development?.infra || 0)} / unit</div>
          </div>
          <div class="dev-actions">
            <input name="devInfraAmount" type="number" value="1" min="1" max="1000">
            ${button("Buy", "developInfra", {}, true)}
          </div>
        </div>
        <div class="dev-card">
          <div class="dev-icon">🔬</div>
          <div class="dev-info">
            <div class="dev-name">Technology</div>
            <div class="dev-value">${number(n.tech)}</div>
            <div class="dev-cost">Cost: ${money(state.development?.tech || 0)} / level</div>
          </div>
          <div class="dev-actions">
            <input name="devTechAmount" type="number" value="1" min="1" max="1000">
            ${button("Buy", "developTech", {}, true)}
          </div>
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-build-section">
      <div class="section-title toggle-section">
        <h2>Buildings</h2>
        <div class="build-tabs">
          <button class="build-tab active" data-build-cat="improvements">Improvements (${improvementsCount})</button>
          <button class="build-tab" data-build-cat="projects">Projects (${projectsCount})</button>
          <button class="build-tab" data-build-cat="wonders">Wonders (${wondersCount})</button>
        </div>
        <button class="section-toggle" data-toggle="buildings" title="Toggle buildings view">⌄</button>
      </div>
      <div class="section-content toggleable" id="toggle-buildings">
        <div class="build-summary">
          <div class="build-item"><span>Improvements</span><span>${improvementsCount}</span></div>
          <div class="build-item"><span>Projects</span><span>${projectsCount}</span></div>
          <div class="build-item"><span>Wonders</span><span>${wondersCount}</span></div>
        </div>
        <div class="build-effects">
          ${renderCombinedEffects(n)}
        </div>
        <div class="built-list">
          ${renderBuiltList(n, catalog)}
        </div>
        <div class="section-actions">
          ${button("Manage Buildings", "openBuildModal", { buildCat: "improvements" })}
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-stats-section">
      <div class="section-title">
        <h2>Nation Stats</h2>
        ${button("Detailed Breakdown", "openStatsModal", {})}
      </div>
      <div class="stats-grid">
        <div class="stat-card happiness">
          <div class="stat-icon">${happinessEmoji(happiness)}</div>
          <div class="stat-info">
            <div class="stat-name">Happiness</div>
            <div class="stat-value">${Math.round(happiness)}</div>
            <div class="stat-bar"><div class="stat-bar-fill happiness-fill" style="width:${happiness}%"></div></div>
          </div>
        </div>
        <div class="stat-card crime">
          <div class="stat-icon">🚔</div>
          <div class="stat-info">
            <div class="stat-name">Crime</div>
            <div class="stat-value">${Math.round(crime)}%</div>
            <div class="stat-bar"><div class="stat-bar-fill crime-fill" style="width:${Math.min(100, crime)}%"></div></div>
          </div>
        </div>
        <div class="stat-card disease">
          <div class="stat-icon">🦠</div>
          <div class="stat-info">
            <div class="stat-name">Disease</div>
            <div class="stat-value">${Math.round(diseaseRate)}%</div>
            <div class="stat-bar"><div class="stat-bar-fill disease-fill" style="width:${Math.min(100, diseaseRate)}%"></div></div>
          </div>
        </div>
        <div class="stat-card pollution">
          <div class="stat-icon">🏭</div>
          <div class="stat-info">
            <div class="stat-name">Pollution</div>
            <div class="stat-value">${Math.round(pollution)}</div>
            <div class="stat-bar"><div class="stat-bar-fill pollution-fill" style="width:${Math.min(100, pollution)}%"></div></div>
          </div>
        </div>
        <div class="stat-card environment">
          <div class="stat-icon">🌳</div>
          <div class="stat-info">
            <div class="stat-name">Environment</div>
            <div class="stat-value">${Math.round(environment)}</div>
            <div class="stat-bar"><div class="stat-bar-fill environment-fill" style="width:${environment}%"></div></div>
          </div>
        </div>
        <div class="stat-card literacy">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <div class="stat-name">Literacy</div>
            <div class="stat-value">${Math.round(literacy)}%</div>
            <div class="stat-bar"><div class="stat-bar-fill literacy-fill" style="width:${Math.min(100, literacy)}%"></div></div>
          </div>
        </div>
      </div>

      <div class="coverage-section">
        <div class="coverage-card">
          <div class="coverage-header"><span class="coverage-icon">🍽️</span><span class="coverage-name">Food Coverage</span></div>
          <div class="coverage-value">${foodPct}%</div>
          <div class="coverage-bar"><div class="coverage-bar-fill ${foodPct >= 100 ? 'full' : ''}" style="width:${foodPct}%"></div></div>
          <div class="coverage-detail">${number(foodTotal)} / ${number(n.population)} population covered</div>
        </div>
        <div class="coverage-card">
          <div class="coverage-header"><span class="coverage-icon">💧</span><span class="coverage-name">Water Coverage</span></div>
          <div class="coverage-value">${waterPct}%</div>
          <div class="coverage-bar"><div class="coverage-bar-fill ${waterPct >= 100 ? 'full' : ''}" style="width:${waterPct}%"></div></div>
          <div class="coverage-detail">${number(waterTotal)} / ${number(n.population)} population covered</div>
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-disease-section">
      <div class="section-title">
        <h2>National Disease</h2>
        ${button("Manage", "openDiseaseModal", {})}
      </div>
      <div class="disease-summary">
        <span class="disease-rate">${Math.round(diseaseRate)}%</span>
        <span class="disease-label">current disease rate</span>
        <span class="disease-spawn">Spawn chance: ${Math.min(50, Math.max(0, diseaseRate * 0.5 + (pollution * 0.3))).toFixed(1)}%</span>
        ${diseaseRate > 0
          ? `<button class="section danger" data-action="openDiseaseModal">Treat Disease</button>`
          : `<span class="disease-none">No active disease</span>`}
      </div>
    </section>

    <section class="nation-section" id="nation-units-section">
      <div class="section-title toggle-section">
        <h2>Military Units</h2>
        ${button("Manage Units", "openUnitsModal", {})}
        <button class="section-toggle" data-toggle="units" title="Toggle units view">⌄</button>
      </div>
      <div class="section-content toggleable" id="toggle-units">
        <div class="units-grid">
          ${unitTypes.map(type => {
            const count = militaryUnits[type] || 0;
            const q = state.units?.[type] || {};
            const capacity = q?.capacity || 0;
            const eff = Math.round(((q?.efficiency || 1) * 100));
            const canBuy = q?.canBuy || false;
            const canSell = q?.canSell || false;
            const cost = q?.cost || {};
            return `<div class="unit-card">
              <div class="unit-info">
                <span class="unit-icon">${esc(unitLabels[type])}</span>
                <span class="unit-count">${number(count)} / ${number(capacity)}</span>
                <span class="unit-eff">Eff: ${eff}%</span>
              </div>
              <div class="unit-cost">${Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => `${number(v)} ${human(k)}`).join(' • ') || 'Free'}</div>
              <div class="unit-actions">
                <input name="unitAmount-${type}" type="number" value="1" min="1" max="1000000">
                ${button("Buy", "buyUnit", { type, amount: 1 }, canBuy)}
                ${button("Sell", "sellUnit", { type, amount: 1 }, canSell && count > 0, "danger")}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-edicts-section">
      <div class="section-title">
        <h2>Nation Edicts</h2>
        ${button(edictLocked ? "Locked" : "Manage Edicts", "openEdictsModal", {}, !edictLocked)}
      </div>
      <div class="edicts-summary">
        ${edicts && Object.entries(edicts).length
          ? Object.entries(edicts).map(([cat, stance]) => `<span class="edict-chip">${esc(cat)}: ${esc(stance)}</span>`).join('')
          : '<span class="edict-none">No edicts selected</span>'}
        ${n.edictFreePassUsed === false ? '<span class="edict-free">✨ Free change available</span>' : ''}
        ${edictLocked ? '<span class="edict-locked">Edicts locked — unlock requirements not met</span>' : ''}
      </div>
    </section>

    <section class="nation-section" id="nation-diplomacy-section">
      <div class="section-title">
        <h2>Diplomatic Relations</h2>
        ${button("Manage", "openDiplomacyModal", {})}
      </div>
      <div class="diplomacy-summary">
        <div class="diplo-chip friends"><span class="diplo-icon">🤝</span><span>${friends.length} / ${maxFriends} Friends</span></div>
        <div class="diplo-chip foes"><span class="diplo-icon">👊</span><span>${foes.length} / ${maxFoes} Foes</span></div>
        <div class="diplo-chip bestfriend"><span class="diplo-icon">❤️</span><span>Best Friend: ${bestFriend ? (state.nations?.find(x => x.id === bestFriend)?.name || 'Unknown') : 'None'}</span></div>
        <div class="diplo-chip nemesis"><span class="diplo-icon">💀</span><span>Nemesis: ${nemesis ? (state.nations?.find(x => x.id === nemesis)?.name || 'Unknown') : 'None'}</span></div>
      </div>
      <div class="treaty-section">
        <h3>Treaties</h3>
        <div class="treaty-grid">
          ${Object.entries(treatyTypes).map(([key, def]) => {
            const count = treatyCounts[key] || 0;
            return `<div class="treaty-chip"><span class="treaty-name">${esc(def?.name || human(key))}</span><span class="treaty-count">${count}</span></div>`;
          }).join('') || '<span class="treaty-none">No treaty types available</span>'}
        </div>
      </div>
    </section>

    <section class="nation-section" id="nation-population-section">
      <div class="section-title toggle-section">
        <h2>Population</h2>
        ${button("Full Breakdown", "openPopDetailedModal", {})}
        <button class="section-toggle" data-toggle="population" title="Toggle population view">⌄</button>
      </div>
      <div class="section-content toggleable" id="toggle-population">
        <div class="population-header">
          <div class="pop-total">
            <span class="pop-total-label">Total Population</span>
            <span class="pop-total-value">${number(totalPop)}</span>
          </div>
          <div class="pop-pie" id="population-pie">
            <svg width="140" height="140" viewBox="0 0 42 42">
              <circle class="pie-bg" cx="21" cy="21" r="19" fill="none" stroke="#334155" stroke-width="3"/>
              <circle class="pie-progress" cx="21" cy="21" r="19" fill="none" stroke="${esc(happiness >= 75 ? '#22c55e' : happiness >= 50 ? '#fbbf24' : '#ef4444')}" stroke-width="3" stroke-dasharray="119" stroke-dashoffset="${esc(119 - (happiness / 100) * 119)}" transform="rotate(-90 21 21)"/>
              <text x="21" y="24" text-anchor="middle" font-size="10" fill="#f0f4ff">${Math.round(happiness)}%</text>
            </svg>
          </div>
        </div>
        <div class="population-tabs">
          <button class="pop-tab active" data-pop-tab="demographics">Demographics</button>
          <button class="pop-tab" data-pop-tab="jobs">Jobs</button>
          <button class="pop-tab" data-pop-tab="citizens">Citizens</button>
        </div>
        <div class="pop-tab-panel active" id="pop-tab-demographics">
          <div class="pop-summary">
            <div class="pop-stat"><span class="pop-stat-label">Workforce</span><span class="pop-stat-value">${number(workforce)}</span></div>
            <div class="pop-stat"><span class="pop-stat-label">Dependents</span><span class="pop-stat-value">${number(dependents)}</span></div>
            <div class="pop-stat"><span class="pop-stat-label">Literacy</span><span class="pop-stat-value">${Math.round(literacy)}%</span></div>
          </div>
          <button class="section" data-action="openPopDetailedModal">Full Breakdown</button>
        </div>
        <div class="pop-tab-panel hidden" id="pop-tab-jobs">
          <div class="jobs-preview" id="pop-jobs-preview">
            <p class="muted">Jobs assigned based on your buildings, projects, and wonders.</p>
            <button class="section" data-action="openPopDetailedModal">View All Jobs</button>
          </div>
        </div>
        <div class="pop-tab-panel hidden" id="pop-tab-citizens">
          <div class="citizens-preview" id="pop-citizens-preview">
            <p class="muted">View individual citizens.</p>
            <button class="section" data-action="openPopDetailedModal">View All Citizens</button>
            <div class="citizen-dialog-section" id="citizen-dialog-preview">
              <h3>Citizen Dialog</h3>
              <p class="muted">Click a citizen below to open their conversation dialog.</p>
              <div id="citizen-dialog-content"></div>
              <div class="citizen-list-preview">
                ${renderCitizenPreview(n, state)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
}

window.renderNationTab = renderNationTab;
