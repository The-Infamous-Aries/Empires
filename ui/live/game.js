"use strict";
(() => {
  const UI = window.EmpiresUI;
  const Assets = window.EmpiresAssets;
  const app = document.getElementById("app");
  let catalog,
    state,
    stream,
    pending = false,
    confirming = false,
    online = false,
    currentTab = "nation",
    authMode = "login",
    category = "improvements",
    researchCategory = "economy",
    forumScope = "color",
    articleId = null,
    messageChannel = "world",
    worldView = "global",
    tradeView = "economy",
    clockOffset = 0,
    privateRecipient = "",
    teamSport = "soccer",
    selectedTile = [0, 0],
    mapToggleType = null,    // 'nation' | 'alliance' | 'currency' | null
    mapToggleTarget = null,  // nationId or allianceId or currencyKey
    mapZoom = 24,
    rankingMetric = "strength",
    rankingPeriod = "week",
    rankingMode = "current",
    popDropdownOpen = false,
    accountMenuOpen = false,
    notificationsOpen = false;
  let modalMode = null;
  let modalFortuneGame = null;
  let teamDraftSport = null;
  let teamPlayerSport = null;
  let teamPlayerId = null;
  let teamPlayerTab = "profile";
  let teamStadiumSport = null;
  let newsReactionDraft = null;
  let newsModalArticleId = null;
  let newsModalArticle = null;
  let newsModalCommentId = null;
  let newsModalTargetType = "article";
  let currencyInvestCurrency = null;
  let proposeMotionScope = "color";
  let modalSituation = null;
  const SKILL_COST_TABLE = [1,1,2,2,2,3,3,3,4,4,5,5,5,5,5,5,5,5,5,5];
  const draftsByRoute = new Map();
  const pageTools = {};
  let helpQuery = "";
  const quoteCache = new Map();
  const quoteTimers = new Map();
  let quoteRevision;
  let preferences;
  try {
    preferences = JSON.parse(localStorage.getItem("dominion-ui") || "{}");
  } catch {
    preferences = {};
  }
  if (
    !preferences ||
    typeof preferences !== "object" ||
    Array.isArray(preferences)
  )
    preferences = {};
    const routeKey = () =>
    [
      currentTab,
      {
        build: category,
        research: researchCategory,
        world: forumScope + ":" + worldView,
        news: articleId,
        messages: messageChannel + ":" + privateRecipient,
        team: teamSport,
      }[currentTab] || "",
    ].join(":");
  const saveDraft = () => {
    if (state) draftsByRoute.set(routeKey(), capture());
  };  const VALID_THEMES = new Set([
    "dark", "light", "sea", "fire", "forest",
    "royal", "neon", "cyberpunk", "sunset", "arctic",
  ]);
  function applyPreferences() {
    const theme = VALID_THEMES.has(preferences.theme)
      ? preferences.theme
      : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle(
      "comfortable",
      preferences.textSize === "large",
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      !!preferences.reduceMotion,
    );
  }
  applyPreferences();
  applyTabOrder();
  initTabDragDrop();
  const tabs = [
    ["nation", "🏛", "Nation"],
    ["alliance", "🤝", "Alliance"],
    ["news", "📰", "News"],
    ["world", "🌍", "World"],
    ["wars", "⚔", "Wars"],
    ["team", "🏆", "Team"],
    ["user", "👤", "User"],
    ["fortune", "🎰", "Fortune"],
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
  const imageIcon = (src, style = "", alt = "") =>
    src
      ? `<img class="game-icon ${style}" src="${esc(src)}" alt="${esc(alt)}" width="40" height="40" loading="lazy" decoding="async">`
      : "";
  const icon = (group, key, style = "") =>
    imageIcon(Assets.icon(group, key), style);
  const music = new window.EmpiresMusic.Music({
    tracks: Assets.music,
    createAudio: () => document.getElementById("background-music"),
    onChange: updateMusicStatus,
  });
  function syncMusic() {
    const ui = state ? state.player.settings.ui : null;
    music.sync(state, {
      enabled: ui ? !!ui.musicEnabled : !!preferences.musicEnabled,
      volume: ui ? ui.musicVolume : (preferences.musicVolume ?? 0.35),
    });
  }
  function applyPlayerSettings(st) {
    const ui = st?.player?.settings?.ui;
    if (!ui) return;
    const root = document.documentElement;
    if (ui.theme) root.dataset.theme = ui.theme;
    if (ui.textSize) {
      const scale = { small: 0.875, normal: 1, large: 1.125, larger: 1.25 }[ui.textSize] || 1;
      root.style.setProperty("--text-size-base", (14 * scale) + "px");
    }
    if (ui.nameFont) {
      const font = SETTINGS_NAME_FONTS.find(f => f.key === ui.nameFont) || SETTINGS_NAME_FONTS[0];
      root.style.setProperty("--name-font", font.css);
    }
    if (ui.nameColor) root.style.setProperty("--name-color", ui.nameColor);
    if (ui.nameColorAccent) root.style.setProperty("--name-color-accent", ui.nameColorAccent);
  }
  function updateMusicStatus() {
    const info = music.info(),
      status = document.getElementById("music-status");
    const labels = {
      off: "Music is off.",
      loading: "Loading soundtrack�",
      playing: `Playing the ${info.mode} playlist.`,
      blocked:
        "Your browser needs a click to start music. Select Resume music.",
      unavailable:
        "The soundtrack could not load. Select Resume music to retry.",
    };
    if (status) status.textContent = labels[info.status];
    const resume = document.getElementById("music-resume");
    if (resume)
      resume.hidden = !["blocked", "unavailable"].includes(info.status);
    const track = document.getElementById("music-track");
    if (track)
      track.textContent = info.track
        ? info.track.split("/").pop().replace(".mp3", "")
        : "No track playing";
  }
  function saveMusicPreferences() {
    const f = document.getElementById("music-form");
    preferences.musicEnabled = f.elements.musicEnabled.checked;
    preferences.musicVolume = Number(f.elements.musicVolume.value) / 100;
    try {
      localStorage.setItem("dominion-ui", JSON.stringify(preferences));
    } catch {
      notice(
        "Music updated for this session; browser storage is unavailable.",
        true,
      );
    }
    syncMusic();
    const volume = document.getElementById("music-volume-value");
    if (volume)
      volume.textContent = Math.round(preferences.musicVolume * 100) + "%";
  }
  // Rotating team-icon support: cycles through unlocked sport icons every 2 s.
  let _teamIconIndex = 0;
  let _teamIconTimer = null;
  function _startTeamIconRotation() {
    if (_teamIconTimer) return;
    _teamIconTimer = setInterval(() => {
      if (!state || !catalog) return;
      const unlockedSports = (catalog.sports?.types || []).filter(
        (s) => !!state.nation.wonders[`${s}Stadium`],
      );
      if (unlockedSports.length > 1) {
        _teamIconIndex = (_teamIconIndex + 1) % unlockedSports.length;
        // Only repaint the team nav icon, not the whole page.
        const teamBtn = document.querySelector('.nav-button[data-tab="team"] .nav-icon');
        if (teamBtn) {
          const sport = unlockedSports[_teamIconIndex];
          const src = Assets.icon("Sports", sport);
          teamBtn.innerHTML = src ? imageIcon(src, "nav-image") : "?";
        }
      }
    }, 2000);
  }
  const navIcon = (key, fallback) => {
    // Nation tab: player's faction color icon.
    if (key === "nation") {
      const src = Assets.icon("Colors", state?.nation.factionKey);
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // Alliance tab: handshake icon.
    if (key === "alliance") {
      const src = Assets.icon("Menu", "alliance");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // News tab: newspaper icon.
    if (key === "news") {
      const src = Assets.icon("Menu", "news");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // World tab: globe icon.
    if (key === "world") {
      const src = Assets.icon("Menu", "map");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // Wars tab: swords icon.
    if (key === "wars") {
      const src = Assets.icon("Military", "war");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // World Bank tab: coins icon.
    if (key === "worldbank") {
      const src = Assets.icon("Military", "coins") || Assets.icon("Menu", "trade");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // Team tab: cycle through the Sports icons for each unlocked sport stadium.
    if (key === "team") {
      const unlockedSports = state && catalog
        ? (catalog.sports?.types || []).filter(
            (s) => !!state.nation.wonders[`${s}Stadium`],
          )
        : [];
      if (unlockedSports.length > 1) _startTeamIconRotation();
      const sport = unlockedSports.length
        ? unlockedSports[_teamIconIndex % unlockedSports.length]
        : teamSport;
      const src = Assets.icon("Sports", sport);
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // Fortune tab: chip icon.
    if (key === "fortune") {
      const src = Assets.icon("Casino", "chip") || Assets.icon("Menu", "trade");
      return src ? imageIcon(src, "nav-image") : esc(fallback);
    }
    // Fallback: look up in the Menu group.
    const menuSrc = Assets.icon("Menu", key);
    if (menuSrc) return imageIcon(menuSrc, "nav-image");
    return esc(fallback);
  };
  const compact = (value) =>
    Math.abs(value) >= 1e9
      ? Number(value).toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 1,
        })
      : number(value);
  const date = (value) => new Date(value).toLocaleString();
  const attr = (value) => esc(JSON.stringify(value));
  const nationName = (id) =>
    state?.nations.find((n) => n.id === id)?.name || "Unknown nation";
  const empty = (message) => `<div class="empty">${esc(message)}</div>`;
  const badge = (value, style = "") =>
    `<span class="badge ${style}">${esc(value)}</span>`;
  const heading = (title, subtitle, kicker = "Nation command") =>
    `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${currentTab !== "help" ? `<button data-help-topic="${currentTab}">Help with this page</button>` : badge("Player guide", "good")}</header>`;
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

  // Expose shared UI helpers so component files (tabs/modals) can use them.
  window.UIHelpers = {
    esc,
    human,
    number,
    money,
    button,
    select,
    input,
    textarea,
    icon,
    imageIcon,
  };
  const form = (
    id,
    action,
    fields,
    label = "Save",
    enabled = true,
    extra = "",
  ) =>
    `<form id="${id}" data-command="${action}" data-allowed="${!!enabled}" ${extra}><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled && !pending && online ? "" : "disabled"}>${esc(label)}</button></div></form>`;
  const subnav = (name, items, active) =>
    `<div class="subnav" role="group" aria-label="${esc(name)}">${Object.entries(
      items,
    )
      .map(
        ([value, label]) =>
          `<button aria-pressed="${value === active}" data-view="${name}" data-value="${value}" class="${value === active ? "active" : ""}">${esc(label)}</button>`,
      )
      .join("")}</div>`;
  const messages = {
    build: "Construction complete.",
    demolish: "Building demolished. Your capacity and effects are updated.",
    buyUnit: "Units recruited.",
    sellUnit: "Units sold. Your treasury is updated.",
    article: "Your article is published.",
    editArticle: "Article updated.",
    comment: "Comment posted.",
    newsComment: "Comment posted.",
    newsArticle: "Article published.",
    message: "Message sent.",
    settings: "Preference saved.",
    claim: "Territory claimed.",
    startResearch: "Research started.",
    cancelResearch: "Research cancelled.",
    vote: "Your vote is recorded.",
    identity: "National identity updated.",
    government: "Government changed.",
    religion: "Religion changed.",
    skill: "Skill upgraded.",
    legendarySkill: "Legendary point allocated.",
    policy: "Policy updated.",
    changeFaction: "Color faction changed.",
    allianceCreate: "Alliance founded.",
    allianceEditSettings: "Alliance settings updated.",
    allianceUpgradeSkill: "Alliance skill upgraded.",
    allianceKick: "Member removed.",
    allianceLeave: "Left alliance.",
  };
  function confirmAction(title, body, label = "Confirm", danger = false) {
    return new Promise((resolve) => {
      const dialog = document.getElementById("action-dialog");
      dialog.innerHTML = `<form method="dialog"><div class="eyebrow">Review action</div><h2 id="action-title">${esc(title)}</h2><div class="dialog-body">${body}</div><div class="row dialog-actions"><button value="cancel" autofocus>Cancel</button><button value="confirm" class="${danger ? "danger" : "primary"}">${esc(label)}</button></div></form>`;
      dialog.returnValue = "";
      dialog.onclose = () => resolve(dialog.returnValue === "confirm");
      dialog.showModal();
    });
  }
  async function confirmCommand(action, data) {
    if (action === "warRespond" && data.accept === false) {
      const call = state.diplomacy.calls.find((c) => c.id === data.obligation);
      if (call?.mandatory) {
        const penalty = catalog.treatyTypes[call.type].failurePenalty;
        return confirmAction(
          "Decline mandatory assistance?",
          `<p>This applies ${Math.abs(penalty.happiness)} lost happiness for 7 game days${penalty.compensation ? ` and ${money(call.compensation)} compensation` : ""}. Unpaid compensation remains a debt.</p>`,
          "Decline call",
          true,
        );
      }
    }
    const destructive = {
      demolish: [
        "Demolish building?",
        "The building�s effects and capacity will be removed. Any salvage follows your current recovery rate.",
      ],
      deleteArticle: [
        "Delete this article?",
        "The article and its discussion will be removed.",
      ],
      newsArticleDelete: [
        "Delete this article?",
        "The article and its discussion will be removed.",
      ],
      newsCommentDelete: [
        "Delete this comment?",
        "The comment will be removed.",
      ],
      allianceLeave: [
        "Leave your alliance?",
        "You will lose access to the alliance channel and member controls.",
      ],
      allianceKick: [
        "Remove this member?",
        "The nation will lose alliance membership and access.",
      ],
      allianceTransfer: [
        "Transfer alliance leadership?",
        "You will hand leadership to the selected nation.",
      ],
      legendary: [
        "Begin legendary progression?",
        "Your normal leader skills reset in exchange for permanent progression.",
      ],
      teamRelease: [
        "Release this player?",
        "The player becomes a free agent and can sign with another club.",
      ],
      declareWar: [
        "Declare war?",
        "A 15-minute preparation period begins, followed by four-hour rounds. The world keeps running.",
      ],
      cancelResearch: [
        "Cancel this research?",
        "Progress will be lost and 50% of the amount paid will return to your treasury.",
      ],
      allianceKick: [
        "Remove this member from the alliance?",
        "They will lose access to the alliance channel and shared benefits.",
      ],
      allianceLeave: [
        "Leave your alliance?",
        "You will lose access to the alliance channel and member controls.",
      ],
    };
    if (!destructive[action]) return true;
    const [title, body] = destructive[action];
    return confirmAction(
      title,
      `<p>${esc(body)}</p>`,
      action === "declareWar" ? "Declare war" : "Confirm",
      true,
    );
  }
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
    if (response.status === 401 && state) {
      stream?.close();
      state = null;
      syncMusic();
      draftsByRoute.clear();
      online = true;
      render(false);
    }
    if (!response.ok) throw new Error(value.error || "Request failed");
    return value;
  }
  async function fortuneApi(game, action, data = {}) {
    if (pending || !online) return;
    pending = true;
    render();
    try {
      const result = await api("/api/fortune", { game, action, data });
      if (modalMode === "fortune") renderModal();
      return result;
    } catch (err) {
      notice(err.message || "Fortune action failed", true);
    } finally {
      pending = false;
      render();
    }
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
        preferences.diplomacy &&
        (next.diplomacy?.calls || []).some(
          (call) =>
            call.nation === next.nation.id &&
            call.status === "pending" &&
            !(state.diplomacy?.calls || []).some((old) => old.id === call.id),
        )
      )
        notice(
          "A treaty partner has called for military assistance. Respond in Diplomacy before preparation ends.",
        );
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
    // Load persisted citizens into the PopulationSystem so names, ties, and jobs survive restarts
    if (state.citizens) {
      if (typeof window.PopulationSystem === 'function') {
        window.PopulationSystem = new window.PopulationSystem();
      }
      if (window.PopulationSystem && window.PopulationSystem.setState) {
        try {
          window.PopulationSystem.setState({ citizens: state.citizens });
        } catch (e) {
          console.error('Failed to load citizens into PopulationSystem:', e.message);
        }
      }
    }
    // Apply the player's faction color as the UI trim (--faction-color).
    const fKey = state?.nation?.factionKey;
    if (catalog?.colors?.[fKey]?.hex) {
        document.documentElement.style.setProperty('--faction-color', catalog.colors[fKey].hex);
    }
    // Apply saved player settings (theme, text size, name font/color, music) live.
    applyPlayerSettings(state);
    syncMusic();
    clockOffset = next.serverTime - Date.now();
    render();
  }

  /**
   * Push the client's citizen population to the server so names, family
   * ties, jobs, and relationships survive server restarts and page refreshes.
   */
  async function syncCitizens() {
    if (!state || !window.PopulationSystem) return;
    const citizens = Array.from(window.PopulationSystem.citizens.values());
    if (!citizens.length) return;
    try {
      await fetch("/api/citizens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ citizens }),
      });
    } catch (e) {
      // Silently fail — server may be temporarily unavailable
    }
  }
  function connect() {
    stream?.close();
    stream = new EventSource("/api/events");
    stream.addEventListener("state", (event) => {
      online = true;
      receive(JSON.parse(event.data));
    });
    stream.addEventListener("clock", (event) => {
      const reconnecting = !online;
      online = true;
      clockOffset = JSON.parse(event.data).serverTime - Date.now();
      if (reconnecting) render();
      updateClock();
    });
    stream.onerror = () => {
      online = false;
      render();
    };
  }
  async function command(action, data, formId) {
    if (pending || confirming || !online) return;
    confirming = true;
    let confirmed;
    try {
      confirmed = await confirmCommand(action, data);
    } finally {
      confirming = false;
    }
    if (!confirmed || pending || !online) return;
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
      if (
        formId &&
        ["message", "comment", "article", "proposeMotion", "newsComment"].includes(action)
      ) {
        const f = document.getElementById(formId);
        if (f)
          for (const el of f.elements)
            if (["title", "body"].includes(el.name)) el.value = "";
      }
      if (
        formId &&
        ["message", "comment", "article", "proposeMotion", "newsComment", "newsArticle"].includes(action)
      )
        saveDraft();
      if (action === "deleteArticle" || action === "newsArticleDelete") articleId = null;
      if (action === "article" || action === "newsArticle")
        articleId =
          state.articles.find(
            (a) => a.author === state.nation.id && a.title === data.title,
          )?.id || null;
      if (action === "message")
        requestAnimationFrame(() => {
          const log = document.querySelector(".chat-log");
          if (log) log.scrollTop = log.scrollHeight;
        });
      notice(messages[action] || "Changes saved.");
      // Persist citizen changes to server so they survive restarts
      if (window.PopulationSystem && window.PopulationSystem.citizens.size) {
        syncCitizens();
      }
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
    // Delegates to the unified AccountCreation system (login / register / OAuth /
    // nation setup). AccountCreation renders directly into `app`.
    if (window.AccountCreation) {
      window.AccountCreation.render(app);
    } else {
      app.innerHTML = `<main class="loading"><div class="crest">DW</div><h1>Auth system loading</h1><p>Please refresh the page.</p></main>`;
    }
  }

  /**
   * Called by AccountCreation once a session cookie + game state are ready
   * (email login / email register / nation creation). Enters the game.
   */
  window.receiveGameState = (statePayload) => {
    receive(statePayload);
    connect();
  };

  /**
   * Admin action handler — fetches data from admin API endpoints and
   * updates the admin tab UI in place. Does not modify game state.
   */
  async function handleAdminAction(action, data) {
    if (!state) return;
    try {
      if (action === "adminRefreshBugs") {
        const res = await fetch("/api/admin/bug-reports", { credentials: "same-origin" });
        const json = await res.json();
        renderAdminBugsList(json.reports || []);
      } else if (action === "adminRefreshErrors") {
        const res = await fetch("/api/admin/debug-errors", { credentials: "same-origin" });
        const json = await res.json();
        renderAdminErrorsList(json.errors || []);
      } else if (action === "adminRefreshQueryLog") {
        const res = await fetch("/api/query/audit?limit=100", { credentials: "same-origin" });
        const json = await res.json();
        renderAdminQueryLog(json.data || []);
      } else if (action === "adminModerate") {
        const res = await fetch("/api/admin/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          alert("Moderation action applied.");
          renderAdminModHistory(json.history || []);
        } else {
          alert(json.error || "Moderation action failed.");
        }
      } else if (action === "adminExportBugs") {
        const res = await fetch("/api/admin/bug-reports?export=1", { credentials: "same-origin" });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bug-reports.json";
        a.click();
        URL.revokeObjectURL(url);
      } else if (action === "adminExportQueryLog") {
        const res = await fetch("/api/query/audit?limit=1000&export=1", { credentials: "same-origin" });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "query-log.json";
        a.click();
        URL.revokeObjectURL(url);
      } else if (action === "adminClearResolved") {
        const res = await fetch("/api/admin/bug-reports?clear=resolved", {
          method: "DELETE",
          credentials: "same-origin",
        });
        const json = await res.json();
        if (json.success) {
          renderAdminBugsList(json.reports || []);
          alert("Resolved reports cleared.");
        } else {
          alert(json.error || "Failed to clear reports.");
        }
      }
    } catch (err) {
      alert("Admin action failed — check your connection.");
      console.error("Admin action error:", err);
    }
  }

  function renderAdminBugsList(reports) {
    const wrap = document.getElementById("admin-bugs-list");
    if (!wrap) return;
    if (!reports || reports.length === 0) {
      wrap.innerHTML = '<div class="empty">No bug reports.</div>';
      return;
    }
    wrap.innerHTML = reports
      .map(
        (r) => `
        <div class="admin-report-row">
          <div class="admin-report-info">
            <strong>#${esc(r.id?.slice(-6))}</strong> ${esc(r.title)}
            <span class="admin-badge admin-type-${esc(r.reportType)}">${esc(human(r.reportType))}</span>
            <span class="admin-badge admin-status-${esc(r.status || "open")}">${esc(r.status || "open")}</span>
          </div>
          <div class="admin-report-meta">
            <div>${esc(r.player?.username || "—")} · ${date(r.timestamp)}</div>
            <div class="bug-url">${esc(r.pageUrl || "")}</div>
            <div>${esc(r.description?.slice(0, 120))}${r.description?.length > 120 ? "…" : ""}</div>
          </div>
        </div>
      `,
      )
      .join("");
  }

  function renderAdminErrorsList(errors) {
    const wrap = document.getElementById("admin-errors-list");
    if (!wrap) return;
    if (!errors || errors.length === 0) {
      wrap.innerHTML = '<div class="empty">No debug errors.</div>';
      return;
    }
    wrap.innerHTML = errors
      .map(
        (e) => `
        <div class="admin-error-row">
          <div class="admin-error-message">${esc(e.message || "Unknown error")}</div>
          <div class="admin-error-meta">
            <span>${esc(e.source || "client")}</span>
            <span>${esc(e.file || "")}:${esc(e.line || "")}</span>
            <span>${date(e.timestamp)}</span>
          </div>
        </div>
      `,
      )
      .join("");
  }

  function renderAdminQueryLog(records) {
    const wrap = document.getElementById("admin-query-log-list");
    if (!wrap) return;
    if (!records || records.length === 0) {
      wrap.innerHTML = '<div class="empty">No query history.</div>';
      return;
    }
    wrap.innerHTML = records
      .map(
        (r) => `
        <div class="admin-query-row">
          <div class="admin-query-meta">
            <span>${esc(r.nationId || "—")}</span>
            <span>${date(r.timestamp)}</span>
          </div>
          <div class="admin-query-text">${esc(r.query || "").slice(0, 200)}</div>
        </div>
      `,
      )
      .join("");
  }

  function renderAdminModHistory(history) {
    const wrap = document.getElementById("admin-mod-history");
    if (!wrap) return;
    if (!history || history.length === 0) {
      wrap.innerHTML = '<div class="empty">No moderation history.</div>';
      return;
    }
    wrap.innerHTML = history
      .map(
        (h) => `
        <div class="admin-mod-row">
          <div class="admin-mod-info">
            <strong>${esc(h.targetUsername || h.targetId)}</strong>
            <span class="admin-badge admin-mod-${esc(h.action)}">${esc(h.action)}</span>
          </div>
          <div class="admin-mod-meta">
            <div>${esc(h.reason || "—")}</div>
            <div>${esc(h.moderator || "—")} · ${date(h.timestamp)}</div>
          </div>
        </div>
      `,
      )
      .join("");
  }

  function capture() {
    const scope = activePanel() || app;
    const drafts = [];
    for (const element of scope.querySelectorAll("input,select,textarea"))
      if (element.form?.getAttribute("id") && element.name)
        drafts.push([
          element.form.getAttribute("id"),
          element.name,
          element.multiple
            ? [...element.selectedOptions].map((o) => o.value)
            : element.value,
          element.checked,
        ]);
    const focused = document.activeElement;
    const controlFocus =
      focused && scope.contains(focused)
        ? {
            tag: focused.tagName,
            attrs: [...focused.attributes]
              .filter((a) => a.name.startsWith("data-") || a.name === "id")
              .map((a) => [a.name, a.value]),
          }
        : null;
    return {
      drafts,
      controlFocus,
      focus: focused?.form?.getAttribute("id")
        ? [
            focused.form.getAttribute("id"),
            focused.name,
            focused.selectionStart,
            focused.selectionEnd,
          ]
        : null,
      details: [...scope.querySelectorAll("details[open][id]")].map((d) => d.id),
      scroll: document.querySelector(".chat-log")?.scrollTop,
      mapScroll: (() => {
        const e = document.querySelector(".map-shell");
        return e ? [e.scrollLeft, e.scrollTop] : null;
      })(),
      pageScroll: window.scrollY,
      navScroll: document.querySelector(".sidebar")?.scrollLeft,
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
    const map = document.querySelector(".map-shell");
    if (map && saved.mapScroll) {
      map.scrollLeft = saved.mapScroll[0];
      map.scrollTop = saved.mapScroll[1];
    }
    const nav = document.querySelector(".sidebar");
    if (nav && saved.navScroll !== undefined) nav.scrollLeft = saved.navScroll;
  }
  function render(preserve = true) {
    if (!state) {
      app.style.display = "grid";
      auth();
      return;
    }
    app.style.display = "none";

    const saved = preserve ? capture() : draftsByRoute.get(routeKey()),
      n = state.nation;

    // Visibility rules for the 7 bottom tabs.
    const hasTeam = catalog?.sports?.types?.some((s) => !!n.wonders[`${s}Stadium`]);
    const canFound = state.canFoundAlliance === true;

    const visibleTabs = {
      nation: true,
      alliance: !!n.allianceId || canFound,
      news: true,
      world: true,
      wars: true,
    team: hasTeam,
    user: true,
    fortune: true,
  };

    if (!visibleTabs[currentTab]) currentTab = "nation";

    // Wire user bar stats from server state.
    updateUserBar();

    // Render current tab content into its panel.
    const panel = document.getElementById(`panel-${currentTab}`);
    if (panel) {
      const pageFn = pages[currentTab];
      panel.innerHTML = pageFn ? pageFn(state) : '<div class="empty">This tab is being built next.</div>';
    }

    // Update bottom tab buttons.
    updateTabButtons(visibleTabs);

    if (saved) restore(saved);
    motionFields();
    if (saved) restore(saved);
    updateClock();
    updateUnitButtons();
    enhancePage();
    filterHelp();
    updateMusicStatus();
    updateDynamicForms();
    if (saved?.controlFocus?.attrs.length) {
      const { tag, attrs } = saved.controlFocus;
      const scope = activePanel() || app;
      [...scope.querySelectorAll(tag)]
        .find((e) => attrs.every(([k, v]) => e.getAttribute(k) === v))
        ?.focus({ preventScroll: true });
    }
    renderModal();
    updateTitle();
  }

  /* ════════════════════════════════════════════════════════════════════
     USER BAR — population, currency, account (wired to server state)
     ═══════════════════════════════════════════════════════════════════ */

  function updateUserBar() {
    const n = state.nation;
    const p = state.player;

    // ── Population ──
    const popEl = document.getElementById("pop-value");
    if (popEl) popEl.textContent = number(n.population);

    const popList = document.getElementById("pop-demographics");
    if (popList) {
      const total = Math.max(1, n.population);
      const workforce = Math.floor(total * 0.6);
      const dependents = total - workforce;
      const rows = [
        { label: "Total Population", count: total, pct: "100%" },
        { label: "Workforce (est.)", count: workforce, pct: `${Math.round((workforce / total) * 100)}%` },
        { label: "Dependents (est.)", count: dependents, pct: `${Math.round((dependents / total) * 100)}%` },
      ];
      popList.innerHTML = rows
        .map(
          (r) => `<div class="dropdown-row"><span class="label">${esc(r.label)}</span><span class="count">${number(r.count)}</span><span class="pct">${r.pct}</span></div>`,
        )
        .join("");
    }

    // ── Currency ──
    const curIcon = document.getElementById("currency-icon");
    const curVal = document.getElementById("currency-value");
    const faction = catalog?.colors?.[n.factionKey];
    if (curIcon) {
      curIcon.src = faction?.image || Assets.icon("Menu", "trade") || "";
      curIcon.alt = faction?.name || "Currency";
      curIcon.style.display = curIcon.src ? "block" : "none";
    }
    if (curVal) curVal.textContent = money(n.money);

    // ── Account ──
    const lvlBadge = document.getElementById("account-level-badge");
    const menuName = document.getElementById("account-menu-name");
    const menuLvl = document.getElementById("account-menu-level");
    if (lvlBadge) lvlBadge.textContent = `Lv ${p.level}`;
    if (menuName) menuName.textContent = p.username;
    if (menuLvl) menuLvl.textContent = `Level ${p.level} · ${p.legendaryLevel >= 2 ? "Legendary " + p.legendaryLevel : ""}`;

    // ── Admin tab visibility ──
    const isAdminMod =
      n?.isAdmin === true ||
      n?.role === "admin" ||
      n?.role === "moderator" ||
      p?.isAdmin === true ||
      p?.role === "admin" ||
      p?.role === "moderator";
    const adminBtn = document.querySelector('.tab-btn[data-tab="admin"]');
    if (adminBtn) {
      adminBtn.style.display = isAdminMod ? "flex" : "none";
      // Rebalance tab flex widths
      const visibleCount = [...document.querySelectorAll(".tab-btn")].filter(
        (b) => b.style.display !== "none",
      ).length;
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.style.flex = b.style.display === "none" ? "0 0 auto" : `1 1 ${100 / visibleCount}%`;
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
     TAB DRAG & DROP REORDERING
     ══════════════════════════════════════════════════════════════════════════════════════════ */

  /**
   * Apply saved tab order from preferences to the DOM.
   * Reorders .tab-btn elements inside #bottom-tabs to match preferences.tabOrder.
   * Tabs not in the saved order (e.g. newly added) go to the end.
   */
  function applyTabOrder() {
    const order = preferences.tabOrder;
    if (!order || !Array.isArray(order)) return;
    const nav = document.getElementById("bottom-tabs");
    if (!nav) return;
    const buttons = Array.from(nav.querySelectorAll(".tab-btn:not([data-tab='admin'])"));
    buttons.sort((a, b) => {
      const aIdx = order.indexOf(a.dataset.tab);
      const bIdx = order.indexOf(b.dataset.tab);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
    buttons.forEach((btn) => nav.appendChild(btn));
  }

  /**
   * Save current DOM tab order to preferences + localStorage.
   * Excludes the admin tab (hidden, not user-reorderable).
   */
  function saveTabOrder() {
    const nav = document.getElementById("bottom-tabs");
    if (!nav) return;
    const order = Array.from(nav.querySelectorAll(".tab-btn:not([data-tab='admin'])"))
      .map((btn) => btn.dataset.tab);
    preferences.tabOrder = order;
    try {
      localStorage.setItem("dominion-ui", JSON.stringify(preferences));
    } catch {
      // storage unavailable, in-memory only
    }
  }

  /**
   * Find which tab the dragged item should be inserted before,
   * based on vertical mouse position.
   */
  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".tab-btn:not(.dragging):not([data-tab='admin'])"),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  /**
   * Wire HTML5 drag & drop listeners on the bottom tab bar.
   * Dragging reorders tabs live; dropping persists to preferences.
   */
  function initTabDragDrop() {
    const nav = document.getElementById("bottom-tabs");
    if (!nav) return;

    nav.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("tab-btn") && e.target.dataset.tab !== "admin") {
        e.target.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", e.target.dataset.tab);
      }
    });

    nav.addEventListener("dragend", (e) => {
      if (e.target.classList.contains("tab-btn")) {
        e.target.classList.remove("dragging");
      }
      document
        .querySelectorAll(".tab-btn.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
      saveTabOrder();
    });

    nav.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const after = getDragAfterElement(nav, e.clientY);
      const dragging = document.querySelector(".dragging");
      if (!dragging) return;
      if (after == null) {
        nav.appendChild(dragging);
      } else {
        nav.insertBefore(dragging, after);
      }
    });

    nav.addEventListener("dragenter", (e) => {
      if (e.target.classList.contains("tab-btn") && e.target.dataset.tab !== "admin") {
        e.target.classList.add("drag-over");
      }
    });

    nav.addEventListener("dragleave", (e) => {
      if (e.target.classList.contains("tab-btn")) {
        e.target.classList.remove("drag-over");
      }
    });
  }

  function updateTabButtons(visible) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      const t = btn.dataset.tab;
      const show = visible[t] !== false;
      btn.style.display = show ? "flex" : "none";
      btn.classList.toggle("active", t === currentTab);
      btn.setAttribute("aria-current", t === currentTab ? "true" : "false");
    });
    // Rebalance flex: hide tabs should not take space
    const visibleCount = Object.values(visible).filter(Boolean).length;
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.style.flex = btn.style.display === "none" ? "0 0 auto" : `1 1 ${100 / visibleCount}%`;
    });
  }

  function switchTab(tabKey) {
    if (!state) return;
    const panel = document.getElementById(`panel-${tabKey}`);
    const currentPanel = document.getElementById(`panel-${currentTab}`);
    if (panel) panel.classList.remove("hidden");
    if (panel) panel.classList.add("active");
    if (currentPanel) currentPanel.classList.remove("active");
    if (currentPanel) currentPanel.classList.add("hidden");
    currentTab = tabKey;
    updateUserBar();
    render(false);
    const btn = document.querySelector(`.tab-btn[data-tab="${tabKey}"]`);
    btn?.focus({ preventScroll: true });
    document.getElementById("workspace")?.focus({ preventScroll: true });
  }

  function activePanel() {
    return document.getElementById(`panel-${currentTab}`);
  }

  /* ════════════════════════════════════════════════════════════════════
     WARS PAGE — placeholder (built next, one tab at a time)
     ═══════════════════════════════════════════════════════════════════ */

  function warsPage() {
    const n = state.nation;
    const activeWars = (state.wars || []).filter((w) => w.status !== "ended");
    const allies = activeWars.filter((w) => {
      const rels = n.relationships || {};
      const participants = w.participants || [w.attacker, w.defender];
      return participants.some(
        (pid) =>
          pid !== n.id &&
          (rels[pid] === "friend" || rels[pid] === "bestFriend"),
      );
    });
    const opposition = activeWars.filter((w) => {
      const rels = n.relationships || {};
      const participants = w.participants || [w.attacker, w.defender];
      return participants.some(
        (pid) =>
          pid !== n.id &&
          (rels[pid] === "foe" || rels[pid] === "nemesis"),
      );
    });
    const nonTies = activeWars.filter(
      (w) => !allies.includes(w) && !opposition.includes(w),
    );
    const section = (title, rows) => `<section class="card section"><h3>${title}</h3>${rows.length ? rows.map(w => `<article class="section"><div class="row spread"><h4>${esc(nationName(w.attacker))} vs ${esc(nationName(w.defender))}</h4>${badge(w.status)}</div><p>${esc(w.reason)}</p><p>Round ${w.round} · ${w.status === "ended" ? "Result: " + esc(nationName(w.result)) : `<span data-deadline="${w.endsAt}"></span>`}</p></article>`).join("") : '<p class="muted">No wars in this category.</p>'}</section>`;
    return `${heading("Active Wars", "All wars in the living world, grouped by your relationships.", "Global conflict")}${section("Allies", allies)}${section("Opposition", opposition)}${section("Non-Ties", nonTies)}`;
  }

  /* ════════════════════════════════════════════════════════════════════
  /* ═══════════════════════════════════════════════════════════════════════════════════
     USER PAGE
     ══════════════════════════════════════════════════════════════════════════════════ */

  function userPage() {
    const p = state.player;
    const n = state.nation;
    const xpSys = _global.XPGoalsSystem;
    const sub = state.userSubTab || "nation";
    const subTabs = [
      ["nation", "🏛", "Nation"],
      ["alliance", "🤝", "Alliance"],
      ["war", "⚔", "War"],
      ["global", "🌍", "Global"],
      ["team", "🏆", "Team"],
      ["inventory", "📦", "Inventory"],
      ["goals", "🎯", "Goals"],
    ];

    const subnavHtml = subTabs.map(([key, icon, label]) => {
      const active = sub === key ? "active" : "";
      return `<button class="sub-tab-btn ${active}" data-sub-tab="${key}">${icon} ${label}</button>`;
    }).join("");

    // ── Nation sub-tab ──
    const nationContent = `
      <section class="card section">
        <h2>Player Profile</h2>
        <div class="row spread">
          <div>
            <h3>${esc(p.username || "Unknown")}</h3>
            <p><strong>Level:</strong> ${p.level} ${p.legendaryLevel >= 2 ? `· Legendary ${p.legendaryLevel}` : ""}</h3>
            <p><strong>XP:</strong> ${number(p.experience)} / ${number(p.experienceToNext)}</h3>
            <p><strong>Total XP:</strong> ${number(p.totalExperience)}</h3>
            <p><strong>Skill Points:</strong> ${p.unallocatedSkillPoints} ${p.unallocatedLegendarySkillPoints > 0 ? `· ${p.unallocatedLegendarySkillPoints} Legendary` : ""}</h3>
            <p><strong>Faction:</strong> ${esc(p.factionKey || "None")} (${p.factionRank || "Member"})</h3>
            <p><strong>Joined:</strong> ${p.joinDate ? date(p.joinDate) : "Unknown"}</h3>
            <p><strong>Last Active:</strong> ${p.lastActive ? date(p.lastActive) : "Unknown"}</h3>
          </div>
          <div>
            <h3>Statistics</h3>
            <p><strong>Nations Created:</strong> ${p.statistics?.nationsCreated || 0}</h3>
            <p><strong>Battles Won:</strong> ${p.statistics?.battlesWon || 0}</h3>
            <p><strong>Battles Lost:</strong> ${p.statistics?.battlesLost || 0}</h3>
            <p><strong>Alliances Formed:</strong> ${p.statistics?.alliancesFormed || 0}</h3>
            <p><strong>Territories Claimed:</strong> ${p.statistics?.territoriesClaimed || 0}</h3>
            <p><strong>Buildings Constructed:</strong> ${p.statistics?.buildingsConstructed || 0}</h3>
            <p><strong>Research Completed:</strong> ${p.statistics?.researchCompleted || 0}</h3>
            <p><strong>Treaties Signed:</strong> ${p.statistics?.treatiesSigned || 0}</h3>
            <p><strong>Spy Missions:</strong> ${p.statistics?.spyMissions || 0}</h3>
          </div>
        </div>
        ${p.canGoLegendary ? `<p class="help">You are eligible to <strong>Go Legendary</strong>! Use the Legendary button to prestige.</p>` : ""}
      </section>
    `;

    // ── Alliance sub-tab ──
    const allianceContent = `
      <section class="card section">
        <h2>Alliance</h2>
        ${n.allianceId ? `
          <p><strong>Alliance ID:</strong> ${n.allianceId}</h3>
          <p><strong>Role:</strong> ${n.allianceRole || "Member"}</h3>
          <p><strong>Contribution:</strong> ${money(n.allianceContribution || 0)}</h3>
        ` : '<p class="muted">You are not in an alliance.</p>'}
      </section>
    `;

    // ── War sub-tab ──
    const warContent = `
      <section class="card section">
        <h2>War Statistics</h2>
        <p><strong>Wars Won:</strong> ${n.statistics?.warsWon || 0}</h3>
        <p><strong>Wars Lost:</strong> ${n.statistics?.warsLost || 0}</h3>
        <p><strong>Wars Draw:</strong> ${n.statistics?.warsDraw || 0}</h3>
        <p><strong>Total Damage Dealt:</strong> ${number(n.statistics?.totalDamageDealt || 0)}</h3>
        <p><strong>Total Damage Received:</strong> ${number(n.statistics?.totalDamageReceived || 0)}</h3>
        <p><strong>Total Units Killed:</strong> ${number(n.statistics?.totalUnitsKilled || 0)}</h3>
        <p><strong>Total Units Lost:</strong> ${number(n.statistics?.totalUnitsLost || 0)}</h3>
        <p><strong>Total Infra Destroyed:</strong> ${number(n.statistics?.totalInfraDestroyed || 0)}</h3>
        <p><strong>Total Loot Gained:</strong> ${money(n.statistics?.totalLootGained || 0)}</h3>
      </section>
    `;

    // ── Global sub-tab ──
    const globalContent = `
      <section class="card section">
        <h2>Global Statistics</h2>
        <p><strong>Total Nations:</strong> ${state.nations?.length || 0}</h3>
        <p><strong>Active Wars:</strong> ${(state.wars || []).filter(w => w.status !== "ended").length}</h3>
        <p><strong>Total Alliances:</strong> ${state.alliances?.length || 0}</h3>
        <p><strong>World Day:</strong> ${state.day || 0}</h3>
        <p><strong>World Month:</strong> ${state.month || 0}</h3>
        <p><strong>World Year:</strong> ${state.year || 0}</h3>
      </section>
    `;

    // ── Team sub-tab ──
    const teamContent = `
      <section class="card section">
        <h2>Sports Teams</h2>
        ${n.teams ? Object.entries(n.teams).map(([sport, team]) => `
          <div class="card section">
            <h3>${esc(sport)} Team</h3>
            <p><strong>Coach:</strong> ${esc(team.coach?.name || "None")}</h3>
            <p><strong>Stadium:</strong> Level ${team.stadium?.level || 0}</h3>
            <p><strong>Championships:</strong> ${team.stats?.championships || 0}</h3>
            <p><strong>Players:</strong> ${team.players?.length || 0}</h3>
          </div>
        `).join("") : '<p class="muted">No sports teams.</p>'}
      </section>
    `;

    // ── Inventory sub-tab ──
    const inventoryContent = `
      <section class="card section">
        <h2>Inventory</h2>

        <!-- Key & Chest stash -->
        <section class="card section">
          <h3>🔑 Keys &amp; Chests</h3>
          <div class="row spread">
            ${["key1","key2","key3"].map(k => {
              const cnt = n.equipment?.keys?.[k] || 0;
              const kname = k === "key1" ? "Common Key" : k === "key2" ? "Uncommon Key" : "Rare Key";
              return `<div class="stat-block"><span class="stat-label">${kname}</span><span class="stat-value">${number(cnt)}</span></div>`;
            }).join("")}
            ${["chest1","chest2","chest3","chest4"].map(c => {
              const cnt = n.equipment?.chests?.[c] || 0;
              const cname = c === "chest1" ? "Common Chest" : c === "chest2" ? "Uncommon Chest" : c === "chest3" ? "Rare Chest" : "Sovereign Chest";
              const hasKey = c === "chest1" ? (n.equipment?.keys?.key1 || 0) > 0 :
                             c === "chest2" ? (n.equipment?.keys?.key2 || 0) > 0 :
                             c === "chest3" ? (n.equipment?.keys?.key3 || 0) > 0 :
                             (n.equipment?.keys?.key1 || 0) > 0 && (n.equipment?.keys?.key2 || 0) > 0 && (n.equipment?.keys?.key3 || 0) > 0;
              return `<div class="stat-block">
                <span class="stat-label">${cname}</span>
                <span class="stat-value">${cnt}</span>
                ${cnt > 0 && hasKey
                  ? `<button class="btn btn-sm" data-action="openChest" data-payload='{"chestKey":"${c}"}'>Open</button>`
                  : `<button class="btn btn-sm disabled" disabled>Need Key</button>`
                }
              </div>`;
            }).join("")}
          </div>
        </section>

        <!-- Equipped slots grid -->
        <section class="card section">
          <h3>⚔️ Equipped Slots</h3>
          <div class="grid grid-cols-7 gap-1">
            ${["weapon","head","body","arms","legs","feet","tool"].map(slot => {
              const itemId = n.equipment?.equipped?.[slot] || null;
              const item = itemId ? (n.equipment?.inventory || []).find(i => i.id === itemId) : null;
              const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
              if (!item) {
                return `<div class="equip-slot empty"><div class="slot-label">${slotLabel}</div><div class="slot-empty">Empty</div></div>`;
              }
              const tierFrame = item.tier ? `border: 2px solid ${window.EQUIPMENT_RARITY_TIERS?.[item.tier]?.frame || "#999"}` : "";
              return `<div class="equip-slot" style="${tierFrame}">
                <div class="slot-label">${slotLabel}</div>
                ${imageIcon(item.icon, "", item.name)}
                <div class="slot-name">${esc(item.name)}</div>
                <div class="durability-bar"><div class="durability-fill" style="width: ${Math.max(0, Math.min(100, (item.durability / item.maxDurability) * 100))}%"></div></div>
                <div class="slot-dur">${Math.floor(item.durability)}/${item.maxDurability}</div>
                <button class="btn btn-sm" data-action="unequipItem" data-payload='{"itemId":"${item.id}"}'>Unequip</button>
              </div>`;
            }).join("")}
          </div>
        </section>

        <!-- Inventory list -->
        <section class="card section">
          <h3>🎒 Inventory Items</h3>
          ${(n.equipment?.inventory || []).length === 0
            ? '<p class="muted">No items in inventory.</p>'
            : `<div class="table-wrap section">
              <table>
                <thead><tr><th>Icon</th><th>Name</th><th>Tier</th><th>Stats</th><th>Durability</th><th>Action</th></tr></thead>
                <tbody>
                  ${(n.equipment.inventory || []).map(item => {
                    const tier = window.EQUIPMENT_RARITY_TIERS?.[item.tier];
                    const tierName = tier ? tier.name : item.tier;
                    const tierColor = tier ? tier.frame : "#999";
                    const statsStr = Object.entries(item.stats || {}).map(([k,v]) => {
                      const label = k.replace(/([A-Z])/g, " $1").toUpperCase();
                      const unit = k === "attack" || k === "defense" || k === "block" || k === "luck" ? "" : "%";
                      return `${label} +${v}${unit}`;
                    }).join(", ");
                    const isRepair = item.repairTarget ? ` (repairs ${item.repairTarget})` : "";
                    return `<tr>
                      <td>${imageIcon(item.icon, "", item.name)}</td>
                      <td><strong style="color:${tierColor}">${esc(item.name)}${isRepair}</strong></td>
                      <td>${tierName}</td>
                      <td>${statsStr || "—"}</td>
                      <td>${Math.floor(item.durability)}/${item.maxDurability}</td>
                      <td>
                        ${item.category === "tool" && item.repairTarget
                          ? `<button class="btn btn-sm" data-action="useRepairItem" data-payload='{"itemId":"${item.id}"}'>Use</button>`
                          : `<button class="btn btn-sm" data-action="equipItem" data-payload='{"itemId":"${item.id}"}'>Equip</button>`
                        }
                      </td>
                    </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>`
          }
        </section>

        <!-- Active set bonuses -->
        <section class="card section">
          <h3>🏆 Active Set Bonuses</h3>
          ${(() => {
            try {
              const { activeBonuses } = window.EquipmentSystem?.computeSetBonuses?.(n) || { activeBonuses: [] };
              if (activeBonuses.length === 0) return '<p class="muted">No active set bonuses.</p>';
              return `<ul class="bonus-list">
                ${activeBonuses.map(b => {
                  const slotStats = Object.entries(b.slots || {}).map(([slot, stat]) => `${slot}: ${stat}`).join(", ");
                  return `<li><strong>${b.set}</strong> (${b.pieceCount}pc) — +${Math.round(b.bonusPct*100)}% ${slotStats}${b.perk ? ` • Perk: ${b.perk}` : ""}</li>`;
                }).join("")}
              </ul>`;
            } catch (e) { return '<p class="muted">Set bonuses loading...</p>'; }
          })()}
        </section>
      </section>
    `;

    // ── Goals sub-tab ──
    const goalsContent = `
      <section class="card section">
        <h2>Goals & Missions</h2>
        <p class="muted">Complete goals to earn XP. Goals reset daily, weekly, and monthly.</h3>

        <div class="row spread">
          <div class="goal-period">
            <h3>Daily Goals</h3>
            ${renderGoals("daily", xpSys)}
          </div>
          <div class="goal-period">
            <h3>Weekly Goals</h3>
            ${renderGoals("weekly", xpSys)}
          </div>
          <div class="goal-period">
            <h3>Monthly Goals</h3>
            ${renderGoals("monthly", xpSys)}
          </div>
        </div>
      </section>
    `;

    const contents = {
      nation: nationContent,
      alliance: allianceContent,
      war: warContent,
      global: globalContent,
      team: teamContent,
      inventory: inventoryContent,
      goals: goalsContent,
    };

    return `${heading("User Profile", "Your player profile, inventory, and goals.", "Account")}`
      + `<div class="sub-tabs">${subnavHtml}</div>`
      + `<div class="sub-tab-content">${contents[sub] || contents.nation}</div>`;
  }

  function renderGoals(period, xpSys) {
    if (!xpSys) return '<p class="muted">XP system not available.</p>';
    const goals = xpSys.getGoals(period) || [];
    const player = _global.Player;
    const playerLevel = player ? player.level : 1;

    if (goals.length === 0) return '<p class="muted">No goals available.</p>';

    return goals.map(goal => {
      const pct = xpSys.getGoalProgress(goal) * 100;
      const locked = goal.levelRequirement > playerLevel;
      const completed = goal.completed;
      return `
        <div class="goal-card ${locked ? "locked" : ""} ${completed ? "completed" : ""}">
          <div class="goal-header">
            <span class="goal-title">${esc(goal.title)}</span>
            <span class="goal-xp">+${number(goal.xpReward)} XP</span>
          </div>
          <p class="goal-desc">${esc(goal.description)}</p>
          <div class="goal-progress">
            <div class="goal-progress-bar" style="width: ${pct}%"></div>
          </div>
          <span class="goal-count">${goal.current} / ${goal.target}</span>
          ${locked ? `<span class="goal-lock">Requires Level ${goal.levelRequirement}</span>` : ""}
          ${completed ? `<span class="goal-done">Completed</span>` : ""}
        </div>
      `;
    }).join("");
  }

  /* ═══════════════════════════════════════════════════════════════════════════════════
     WORLD BANK PAGE
     ═══════════════════════════════════════════════════════════════════ */

  function updateTitle() {
    const tabName = tabs.find(([k]) => k === currentTab)?.[2] || "Nation";
    let datePart = "";
    if (window.TimeSystem) {
      const t = window.TimeSystem.getTime();
      const monthName = window.TimeSystem.getMonthName(t.month);
      datePart = ` · ${monthName} ${t.day}, Year ${t.year}`;
    }
    document.title = `Sovereignty Epochs · ${tabName}${datePart}`;
  }

  function updateClock() {
    updateTitle();
    if (!state) return;
    const remaining = Math.max(0, state.nextTurnAt - Date.now() - clockOffset),
      seconds = Math.floor(remaining / 1000);
    const el = document.getElementById("next-turn");
    if (el)
      el.textContent = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    for (const progress of document.querySelectorAll("progress[data-work]")) {
      const elapsed = Math.max(
        0,
        Date.now() + clockOffset - Number(progress.dataset.updated),
      );
      progress.value = Math.min(
        Number(progress.max),
        Number(progress.dataset.work) + elapsed * Number(progress.dataset.rate),
      );
    }
    for (const progress of document.querySelectorAll("progress[data-started]"))
      progress.value = Math.min(
        Number(progress.max),
        Math.max(
          0,
          Date.now() + clockOffset - Number(progress.dataset.started),
        ),
      );
    updateDeadlineButtons();
    for (const e of document.querySelectorAll("[data-deadline]")) {
      const left = Math.max(
        0,
        Number(e.dataset.deadline) - Date.now() - clockOffset,
      );
      e.textContent = `${Math.floor(left / 3600000)}h ${Math.floor(left / 60000) % 60}m remaining`;
    }
  }
  function cumulativeCostToLevel(level) {
    let total = 0;
    for (let i = 0; i < level && i < SKILL_COST_TABLE.length; i++)
      total += SKILL_COST_TABLE[i];
    return total;
  }
  function boostAtLevel(def, level) {
    const raw = level * def.perLevel;
    return def.unit === "%" ? `+${raw}%` : `+${raw}`;
  }
  function skillModalContent() {
    const p = state.player;
    const categories = {};
    for (const [key, def] of Object.entries(catalog.skills)) {
      const cat = def.category || "combat";
      (categories[cat] ||= []).push([key, def]);
    }
    const skillCards = Object.entries(categories)
      .map(
        ([cat, skills]) =>
          `<div class="skill-modal-group"><h3>${human(cat)} skills</h3>${skills
            .map(([key, def]) => {
              const skill = p.skills[key];
              const totalLevels = skill.level + skill.legendaryBonusPts;
              const slots = Array.from(
                { length: def.maxLevels },
                (_, i) => {
                  const lvl = i + 1;
                  const filled = i < skill.level;
                  const legendary =
                    i >= skill.level && i < totalLevels;
                  const tooltip = `Level ${lvl} · ${cumulativeCostToLevel(
                    lvl,
                  )} SP total · Boost: ${boostAtLevel(def, lvl)}`;
                  return `<span class="skill-slot${
                    filled ? " filled" : ""
                  }${legendary ? " legendary" : ""}" title="${esc(
                    tooltip,
                  )}"></span>`;
                },
              ).join("");
              const canUpgrade =
                state.skills[key].cost !== null &&
                p.unallocatedSkillPoints >= state.skills[key].cost;
              const canLegendary = p.unallocatedLegendarySkillPoints > 0;
              return `<article class="card skill-modal-card"><div class="skill-modal-header"><span class="skill-icon-lg">${esc(
                def.icon || "",
              )}</span><div><h4>${esc(def.name)}</h4><small>${esc(
                def.description,
              )}</small></div><span class="skill-level-badge">Lv ${totalLevels}/${
                def.maxLevels
              }</span></div><div class="skill-slots-row">${slots}</div><div class="skill-modal-footer"><div class="skill-boost-line"><span>Current boost:</span><strong>${esc(
                state.skills[key].value,
              )}</strong>${
                skill.legendaryBonusPts
                  ? `<small class="legendary-pip">★${skill.legendaryBonusPts} legendary</small>`
                  : ""
              }</div><div class="row">${
                canUpgrade
                  ? button(
                      `Upgrade · ${state.skills[key].cost} SP`,
                      "skill",
                      { key },
                      true,
                      "primary",
                    )
                  : state.skills[key].cost !== null
                    ? `<button disabled title="Not enough skill points">Upgrade · ${state.skills[key].cost} SP</button>`
                    : `<span class="badge good">Max level</span>`
              }${
                canLegendary
                  ? button("Legendary +1", "legendarySkill", { key }, true, "")
                  : ""
              }</div></div></article>`;
            })
            .join("")}</div>`,
      )
      .join("");
    return `<form method="dialog" id="skill-modal-form"><div class="modal-eyebrow">Leader progression</div><h2 id="nation-dialog-title">Leader skills</h2><div class="modal-stats-row"><div class="modal-stat"><small>Skill points</small><strong>${number(
      p.unallocatedSkillPoints,
    )}</strong></div><div class="modal-stat"><small>Legendary points</small><strong>${number(
      p.unallocatedLegendarySkillPoints,
    )}</strong></div><div class="modal-stat"><small>Level</small><strong>${number(
      p.level,
    )}</strong></div><div class="modal-stat"><small>Legendary cycle</small><strong>${number(
      p.legendaryLevel,
    )}</strong></div></div><div class="modal-body">${skillCards}</div>${
      p.level === 100
        ? `<div class="modal-legendary-action">${button(
            "Go legendary · reset normal skills, gain permanent progression",
            "legendary",
            {},
            true,
            "danger",
          )}</div>`
        : ""
    }<div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  function editNationModalContent() {
    const n = state.nation;
    const foodOptions = {
      pizza: 'Pizza',
      steak: 'Steak',
      cake: 'Cake',
      cookie: 'Cookie',
      burger: 'Burger',
      donut: 'Donut',
      hotdog: 'Hotdog',
      ramen: 'Ramen',
      salad: 'Salad',
      sushi: 'Sushi',
      taco: 'Taco',
    };
    const waterOptions = {
      juice: 'Juices',
      milk: 'Milk',
      'energy-drink': 'Energy Drink',
      smoothie: 'Smoothie',
      beer: 'Beer',
      coffee: 'Coffee',
      liquor: 'Liquor',
      milkshake: 'Milkshake',
      soda: 'Soda',
      water: 'Water',
      wine: 'Wine',
    };
    const govDefs = catalog.governments;
    const relDefs = catalog.religions;
    const govStatue = !!n.projects.governmentStatue;
    const govMonument = !!n.wonders.governmentMonument;
    const govLocked = govStatue && !govMonument;
    const govCooldownLeft =
      govMonument && n.governmentChangedDay !== undefined && state.day - n.governmentChangedDay < 14
        ? 14 - (state.day - n.governmentChangedDay)
        : 0;
    const govDisabled = govLocked || govCooldownLeft > 0;
    const relStatue = !!n.projects.religiousStatue;
    const relMonument = !!n.wonders.religiousMonument;
    const relLocked = relStatue && !relMonument;
    const relCooldownLeft =
      relMonument && n.religionChangedDay !== undefined && state.day - n.religionChangedDay < 14
        ? 14 - (state.day - n.religionChangedDay)
        : 0;
    const relDisabled = relLocked || relCooldownLeft > 0;
    const factionLastChanged = n.factionChangedDay;
    const factionCooldownLeft =
      factionLastChanged !== undefined && state.day - factionLastChanged < 28
        ? 28 - (state.day - factionLastChanged)
        : 0;
    const factionDisabled = factionCooldownLeft > 0;
    return `<form method="dialog" id="edit-nation-form"><div class="modal-eyebrow">National identity</div><h2 id="nation-dialog-title">Edit nation</h2><div class="modal-body"><div class="form-stack">${input("Capital city", "capital", n.capitalCity, "text", 'required maxlength="60"')}${input("National motto", "motto", n.motto, "text", 'maxlength="160"')}</div><div class="modal-section"><h3>Color faction</h3><div class="choice-image-sm">${icon("Colors", n.factionKey, "portrait-icon")}</div>${select("Faction color", "factionKey", catalog.colors, n.factionKey, factionDisabled)}${
      factionCooldownLeft > 0
        ? `<p class="locked">Cooldown active: ${factionCooldownLeft} turns until you can change faction again.</p>`
        : `<p class="help">You may change your color faction once every 28 game turns. This updates your icon, forum membership, and congress seat.</p>`
    }</div><div class="modal-section"><h3>Government</h3><div class="choice-image-sm">${icon("Government", n.government, "portrait-icon")}</div>${select("Government", "government", govDefs, n.government, govDisabled)}${
      govLocked
        ? `<p class="locked">Locked by Government Statue. Build the Government Monument wonder to unlock changes.</p>`
        : govCooldownLeft > 0
          ? `<p class="locked">Cooldown active: ${govCooldownLeft} turns until you can change again.</p>`
          : govMonument
            ? `<p class="help">Free to change. A 14-turn cooldown applies after each change.</p>`
            : `<p class="help">Free to change.</p>`
    }</div><div class="modal-section"><h3>Religion</h3><div class="choice-image-sm">${icon("Religion", n.religion, "portrait-icon")}</div>${select("Religion", "religion", relDefs, n.religion, relDisabled)}${
      relLocked
        ? `<p class="locked">Locked by Religion Statue. Build the Religious Monument wonder to unlock changes.</p>`
        : relCooldownLeft > 0
          ? `<p class="locked">Cooldown active: ${relCooldownLeft} turns until you can change again.</p>`
          : relMonument
            ? `<p class="help">Free to change. A 14-turn cooldown applies after each change.</p>`
            : `<p class="help">Free to change.</p>`
    }</div><div class="modal-section"><h3>National Food</h3><div class="choice-image-sm">${icon("Food", n.nationalFood)}</div>${select(
      "National Food",
      "nationalFood",
      foodOptions,
      n.nationalFood,
    )}<p class="help">Cosmetic only — shown on your nation profile. No gameplay effect.</p></div><div class="modal-section"><h3>National Water</h3><div class="choice-image-sm">${icon("Water", n.nationalWater)}</div>${select(
      "National Water",
      "nationalWater",
      waterOptions,
      n.nationalWater,
    )}<p class="help">Cosmetic only — shown on your nation profile. No gameplay effect.</p></div></div><div class="row dialog-actions"><button value="cancel">Cancel</button><button value="save" class="primary" data-save-edit-nation>Save changes</button></div></form>`;
  }
  function openModal(mode, situation) {
    modalMode = mode;
    modalSituation = situation || null;
    renderModal();
  }
  function closeModal() {
    modalMode = null;
    modalFortuneGame = null;
    modalSituation = null;
    if (typeof window.WheelModalReset === "function") window.WheelModalReset();
    newsReactionDraft = null;
    newsModalArticleId = null;
    newsModalArticle = null;
    newsModalCommentId = null;
    newsModalTargetType = "article";
    currencyInvestCurrency = null;
    proposeMotionScope = "color";
    const dialog = document.getElementById("nation-dialog");
    if (dialog.open) dialog.close();
  }
  function renderModal() {
    const dialog = document.getElementById("nation-dialog");
    if (!state || !modalMode) {
      if (dialog.open) dialog.close();
      return;
    }
    if (dialog.open && modalMode === "editNation") return;
    if (modalMode === "skills") {
      dialog.innerHTML = skillModalContent();
    } else if (modalMode === "playerSkill") {
      dialog.innerHTML = window.PlayerSkillModal
        ? window.PlayerSkillModal.render(state)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "editNation") {
      dialog.innerHTML = editNationModalContent();
    }     else if (modalMode === "newsReaction") {
      dialog.innerHTML = newsReactionModalContent(state, newsModalArticleId, {
        targetType: newsModalTargetType,
        commentId: newsModalCommentId,
      });
    } else if (modalMode === "newsEditor") {
      dialog.innerHTML = newsEditorModalContent(state, newsModalArticle);
    } else if (modalMode === "newsComment") {
      const comment = newsModalCommentId
        ? state.articles
            .flatMap((a) => a.comments)
            .find((c) => c.id === newsModalCommentId)
        : null;
      dialog.innerHTML = newsCommentEditorContent(
        state,
        newsModalArticleId,
        comment || null,
      );
    } else if (modalMode === "fundDiseaseCure") {
      dialog.innerHTML = window.fundDiseaseCureModalContent
        ? window.fundDiseaseCureModalContent(state)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "loan") {
      dialog.innerHTML = window.loanModalContent
        ? window.loanModalContent(state)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "currencyInvest") {
      dialog.innerHTML = window.currencyInvestModalContent
        ? window.currencyInvestModalContent(state, currencyInvestCurrency)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "lotteryPicker") {
      dialog.innerHTML = window.lotteryPickerModalContent
        ? window.lotteryPickerModalContent(state)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "proposeMotion") {
      dialog.innerHTML = window.proposeMotionModalContent
        ? window.proposeMotionModalContent(state, catalog, proposeMotionScope)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "teamDraft") {
      dialog.innerHTML = window.TeamModals
        ? window.TeamModals.teamDraftModalContent(state, teamDraftSport)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "teamPlayer") {
      dialog.innerHTML = window.TeamModals
        ? window.TeamModals.teamPlayerModalContent(state, teamPlayerSport, teamPlayerId)
        : '<div class="empty">Modal loading.</div>';
    } else     if (modalMode === "teamStadium") {
      dialog.innerHTML = window.TeamModals
        ? window.TeamModals.teamStadiumModalContent(state, teamStadiumSport)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "bugReport") {
      dialog.innerHTML = window.BugReportModal
        ? window.BugReportModal.render(state)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "situation") {
      dialog.innerHTML = window.SituationsModal
        ? window.SituationsModal.render(modalSituation, state.catalog)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "declareWar") {
      dialog.innerHTML = window.MapModals
        ? window.MapModals.declareWarModalContent(state, mapToggleTarget)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "proposeTreaty") {
      dialog.innerHTML = window.MapModals
        ? window.MapModals.proposeTreatyModalContent(state, mapToggleTarget)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "launchAttack") {
      dialog.innerHTML = window.MapModals
        ? window.MapModals.launchAttackModalContent(state, mapToggleTarget)
        : '<div class="empty">Modal loading.</div>';
    } else if (modalMode === "settings") {
      dialog.innerHTML = window.SettingsModal
        ? window.SettingsModal.render(state)
        : '<div class="empty">Settings loading.</div>';
      wireSettingsModal(dialog, state);
    } else if (modalMode === "fortune") {
      dialog.innerHTML = window.FortuneModals
        ? window.FortuneModals.renderModal(state, catalog, modalFortuneGame)
        : '<div class="empty">Fortune modal loading.</div>';
      wireFortuneModal(dialog, state);
    }
    if (!dialog.open) dialog.showModal();
    if (modalMode === "newsEditor") initNewsEditor();
  }
  /* ═════════════════════════════════════════════════════════════════════════
     SETTINGS MODAL WIRING
     ═════════════════════════════════════════════════════════════════════════ */
  function wireSettingsModal(dialog, state) {
    const sm = window.SettingsModal;
    if (!sm) return;

    /* Close / discard */
    const close = () => closeModal();
    dialog.querySelector("#settings-close")?.addEventListener("click", close, { once: true });
    dialog.querySelector("#settings-overlay")?.addEventListener("click", close, { once: true });
    dialog.querySelector("#settings-discard")?.addEventListener("click", close, { once: true });

    /* Section tabs */
    dialog.querySelectorAll(".settings-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        dialog.querySelectorAll(".settings-tab").forEach(t => t.classList.remove("active"));
        dialog.querySelectorAll(".settings-tab-pane").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        const pane = dialog.getElementById("settings-pane-" + tab.dataset.section);
        if (pane) pane.classList.add("active");
      });
    });

    /* Theme radio */
    dialog.querySelectorAll('input[name="settings-theme"]').forEach(r => {
      r.addEventListener("change", () => { sm.pending.theme = r.value; });
    });

    /* Text size radio */
    dialog.querySelectorAll('input[name="settings-text-size"]').forEach(r => {
      r.addEventListener("change", () => { sm.pending.textSize = r.value; });
    });

    /* Name font */
    const fontSel = dialog.getElementById("settings-name-font");
    if (fontSel) fontSel.addEventListener("change", () => { sm.pending.nameFont = fontSel.value; updateNamePreview(sm); });

    /* Name color swatches */
    dialog.querySelectorAll(".color-swatch").forEach(sw => {
      sw.addEventListener("click", () => {
        const field = sw.dataset.field;
        const color = sw.dataset.color;
        sm.pending[field] = color;
        dialog.querySelectorAll(`.color-swatch[data-field="${esc(field)}"]`).forEach(s => s.classList.remove("selected"));
        sw.classList.add("selected");
        updateNamePreview(sm);
      });
    });

    /* Music toggle + volume */
    const musicEnabled = dialog.getElementById("settings-music-enabled");
    const musicVol = dialog.getElementById("settings-music-volume");
    const musicVolOut = dialog.getElementById("settings-music-volume-value");
    if (musicEnabled) musicEnabled.addEventListener("change", () => { sm.pending.musicEnabled = musicEnabled.checked; });
    if (musicVol) {
      musicVol.addEventListener("input", () => {
        sm.pending.musicVolume = Number(musicVol.value) / 100;
        if (musicVolOut) musicVolOut.textContent = Math.round(sm.pending.musicVolume * 100) + "%";
      });
    }

    /* Dice style toggle */
    const diceDigits = dialog.getElementById("settings-dice-digits");
    if (diceDigits) diceDigits.addEventListener("change", () => { sm.pending.diceStyle = diceDigits.checked ? "digits" : "dots"; });

    /* Card set selector */
    const cardSetSel = dialog.getElementById("settings-card-set");
    if (cardSetSel) cardSetSel.addEventListener("change", () => { sm.pending.cardSet = cardSetSel.value; });

    /* File upload readers */
    const readFile = (input, setter) => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setter(dataUrl, file);
        input.value = "";
      };
      reader.readAsDataURL(file);
    };

    dialog.querySelectorAll("input[type='file']").forEach(input => {
      input.addEventListener("change", () => {
        const key = input.dataset.key;
        const unit = input.dataset.unit;
        const culture = input.dataset.culture;
        if (key) {
          readFile(input, (dataUrl, file) => {
            sm.pending.flagImage = dataUrl;
            sm.files.flagImage = file;
            const prev = dialog.getElementById("settings-flag-preview");
            if (prev) prev.innerHTML = `<img src="${esc(dataUrl)}" alt="Flag">`;
          });
        } else if (unit) {
          readFile(input, (dataUrl, file) => {
            if (!sm.pending.militaryUnits) sm.pending.militaryUnits = {};
            sm.pending.militaryUnits[unit] = { image: dataUrl };
            sm.files["mu-" + unit] = file;
            const prev = dialog.getElementById("settings-mu-preview-" + esc(unit));
            if (prev) prev.innerHTML = `<img src="${esc(dataUrl)}" alt="${unit} unit icon">`;
          });
        } else if (culture) {
          readFile(input, (dataUrl, file) => {
            const cur = sm.pending[culture] || { type: "", text: "" };
            sm.pending[culture] = { ...cur, image: dataUrl };
            sm.files[culture + "-image"] = file;
          });
        }
      });
    });

    /* Culture text inputs */
    ["nationalFood", "nationalWater", "nationalPet"].forEach(k => {
      const ti = dialog.getElementById("settings-" + k + "-text");
      if (ti) {
        ti.value = (sm.pending[k] && sm.pending[k].text) || "";
        ti.addEventListener("input", () => {
          if (!sm.pending[k]) sm.pending[k] = { type: "", text: "" };
          sm.pending[k].text = ti.value;
        });
      }
      /* Culture type radios */
      dialog.querySelectorAll(`input[name="settings-${k}-type"]`).forEach(r => {
        r.addEventListener("change", () => {
          if (!sm.pending[k]) sm.pending[k] = { type: "", text: "" };
          sm.pending[k].type = r.value;
        });
      });
    });

    /* Clear buttons */
    dialog.querySelectorAll('[data-action="clear-flag"]').forEach(b => b.addEventListener("click", () => {
      sm.pending.flagImage = null;
      delete sm.files.flagImage;
      const prev = dialog.getElementById("settings-flag-preview");
      if (prev) prev.innerHTML = '<div class="settings-muted">No flag</div>';
    }));
    dialog.querySelectorAll('[data-action="clear-mu"]').forEach(b => b.addEventListener("click", () => {
      const unit = b.dataset.unit;
      if (!sm.pending.militaryUnits) sm.pending.militaryUnits = {};
      sm.pending.militaryUnits[unit] = null;
      delete sm.files["mu-" + unit];
      const prev = dialog.getElementById("settings-mu-preview-" + esc(unit));
      if (prev) prev.innerHTML = '<div class="settings-muted" style="font-size:0.62rem;">None</div>';
    }));
    dialog.querySelectorAll('[data-action="clear-culture"]').forEach(b => b.addEventListener("click", () => {
      const key = b.dataset.key;
      if (!sm.pending[key]) sm.pending[key] = { type: "", text: "" };
      sm.pending[key].image = null;
      delete sm.files[key + "-image"];
    }));

    /* Keep Changes */
    dialog.getElementById("settings-keep")?.addEventListener("click", async () => {
      sm.applyLive();
      const cmds = sm.changes();
      for (const c of cmds) {
        try { await command("settings", c); } catch (err) { /* server may not persist all keys; live apply already happened */ }
      }
      /* Push music to music.js live */
      if (window.EmpiresMusic && window.EmpiresMusic.Music && state) {
        const ui = state.player.settings.ui || {};
        music.sync(state, { enabled: sm.pending.musicEnabled, volume: sm.pending.musicVolume });
      }
      notice("Settings kept.");
      closeModal();
    });
  }

  const SETTINGS_NAME_FONTS = [
    { key: "system", css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { key: "serif", css: 'Georgia, "Times New Roman", Times, serif' },
    { key: "monospace", css: '"Courier New", Courier, monospace' },
    { key: "cursive", css: '"Comic Sans MS", "Chalkboard SE", cursive' },
    { key: "fantasy", css: 'Impact, Charcoal, sans-serif' },
    { key: "times", css: '"Times New Roman", Times, serif' },
    { key: "arial", css: 'Arial, Helvetica, sans-serif' },
    { key: "verdana", css: 'Verdana, Geneva, sans-serif' },
    { key: "trebuchet", css: '"Trebuchet MS", sans-serif' },
    { key: "gotham", css: '"Segoe UI", "Helvetica Neue", sans-serif' },
    { key: "palatino", css: 'Palatino, "Book Antiqua", serif' },
    { key: "garamond", css: 'Garamond, "Times New Roman", serif' },
  ];

  function updateNamePreview(sm) {
    const dlg = document.getElementById("nation-dialog");
    if (!dlg) return;
    const preview = dlg.querySelector("#settings-name-preview");
    const root = document.documentElement;
    const font = SETTINGS_NAME_FONTS.find(f => f.key === sm.pending.nameFont) || SETTINGS_NAME_FONTS[0];
    if (preview) {
      preview.style.fontFamily = font.css;
      preview.style.color = sm.pending.nameColor;
    }
    root.style.setProperty("--name-font", font.css);
    root.style.setProperty("--name-color", sm.pending.nameColor);
    root.style.setProperty("--name-color-accent", sm.pending.nameColorAccent);
  }
  function initNewsEditor() {
    const dlg = document.getElementById("nation-dialog");
    if (!dlg || !dlg.open) return;
    const editor = dlg.querySelector("#news-editor");
    if (editor)
      editor.innerHTML = newsModalArticle ? newsModalArticle.body : "";
    const titleField = dlg.querySelector('input[name="title-field"]');
    if (titleField)
      titleField.value = newsModalArticle ? newsModalArticle.title : "";
    const categoryField = dlg.querySelector('select[name="category-field"]');
    if (categoryField && newsModalArticle)
      categoryField.value = newsModalArticle.category;
  }
  async function saveEditNation() {
    const f = document.getElementById("edit-nation-form");
    if (!f || pending || !online) return;
    const fd = new FormData(f);
    const capital = fd.get("capital");
    const motto = fd.get("motto");
    const government = fd.get("government");
    const religion = fd.get("religion");
    const factionKey = fd.get("factionKey");
    const nationalFood = fd.get("nationalFood");
    const nationalWater = fd.get("nationalWater");
    const n = state.nation;
    modalMode = null;
    const dialog = document.getElementById("nation-dialog");
    if (dialog.open) dialog.close();
    let changed = false;
    const identityChanged =
      (capital && capital !== n.capitalCity) ||
      (motto !== undefined && motto !== n.motto);
    if (identityChanged) {
      await command("identity", {
        capital: capital || n.capitalCity,
        motto: motto ?? n.motto,
      });
      changed = true;
    }
    const govNow = state.nation.government;
    if (government && government !== govNow) {
      await command("government", { value: government });
      changed = true;
    }
    const relNow = state.nation.religion;
    if (religion && religion !== relNow) {
      await command("religion", { value: religion });
      changed = true;
    }
    if (factionKey && factionKey !== state.nation.factionKey) {
      await command("changeFaction", { factionKey });
      changed = true;
    }
    const foodNow = state.nation.nationalFood;
    if (nationalFood !== undefined && nationalFood !== foodNow) {
      await command("nationalFood", { value: nationalFood || null });
      changed = true;
    }
    const waterNow = state.nation.nationalWater;
    if (nationalWater !== undefined && nationalWater !== waterNow) {
      await command("nationalWater", { value: nationalWater || null });
      changed = true;
    }
    if (!changed) notice("No changes to save.");
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
        return `<article class="card building-card" data-list-item data-status="${q.canBuild ? "available" : q.owned ? "owned" : "locked"}" data-owned="${q.owned}" data-money-cost="${q.cost.money || 0}" data-search="${esc(def.name + " " + def.description + " " + def.effect)}"><div class="card-title"><div><div class="eyebrow">${esc(def.category)}</div><h3>${esc(def.name)}</h3></div>${badge(`${q.owned} / ${def.maxCount} owned`, q.owned ? "good" : "")}</div><p class="description">${esc(def.description)}</p><div class="effect">${esc(def.effect)}</div><div><h4>Construction cost</h4><div style="margin-top:9px">${cost(q.cost)}</div></div><div class="requirements"><strong>Requirements:</strong> ${esc([def.techRequired ? `Technology ${def.techRequired}` : "", def.requires ? `Requires ${catalog.buildings.projects[def.requires]?.name || catalog.buildings.wonders[def.requires]?.name || human(def.requires)}` : "", def.bonusRequirement ? `${human(def.bonusRequirement)} bonus` : ""].filter(Boolean).join(" � ") || "No technology or building prerequisites")}<br>${def.permanent ? "Permanent � cannot be demolished." : "Can be demolished. Salvage Yard enables cost recovery."}${def.special ? `<br>${esc(def.special)}` : ""}</div><footer><div class="reasons">${esc(q.reasons.join(" � ") || "Ready to build")}</div><div class="actions">${button("Build", "build", { category, key }, q.canBuild)}${button("Demolish", "demolish", { category, key }, q.canDestroy, "")}</div>${!q.canDestroy && q.owned ? `<div class="reasons">${esc(q.destroyReasons.join(" � "))}</div>` : ""}</footer></article>`;
      })
      .join("")}</div>`;
  }
  function battleIcon(entry) {
    if (entry.type === "missiles" && !entry.damage) {
      const colors = Object.keys(Assets.paths.Misses);
      const index = Math.abs(Math.floor(entry.at)) % colors.length;
      return icon("Military", "blocked-bombs") + icon("Misses", colors[index]);
    }
    return entry.type === "nukes"
      ? icon("Military", "hit-nuke")
      : entry.type === "missiles"
        ? icon("Military", "missiles")
        : "";
  }
  function militaryPage() {
    const n = state.nation;
    const percent = (v) => number((v || 0) * 100) + "%";
    const effects = list({
      "Soldier effectiveness from improvements": percent(
        n.improvementEffects.soldierEffectiveness,
      ),
      "Tank effectiveness from improvements": percent(
        n.improvementEffects.tankEffectiveness,
      ),
      "Aircraft effectiveness from improvements": percent(
        n.improvementEffects.aircraftEffectiveness,
      ),
      "Ship effectiveness from improvements": percent(
        n.improvementEffects.shipEffectiveness,
      ),
      "National attack multiplier (government, policy, Arms Pile & research)":
        number(n.combatMultiplier) + "�",
      "World attack multiplier": number(n.motionModifiers.military) + "�",
      "World defense multiplier": number(n.motionModifiers.defense) + "�",
      "World damage received multiplier":
        number(n.motionModifiers.damageTaken ?? 1) + "�",
      "Research defense bonus": number(n.researchModifiers.defense) + "%",
      "Research critical damage addition":
        number(n.researchModifiers.criticalDamage) + " damage",
      "Research casualty reduction": number(n.researchModifiers.recovery) + "%",
      "Research morale bonus": number(n.researchModifiers.morale) + "%",
      "Wonder soldier loss reduction": percent(
        n.wonderEffects.soldierLossReduction,
      ),
      "Vehicle resource salvage": percent(
        n.wonderEffects.enhancedSalvageRate ||
          n.projectEffects.militarySalvageRate,
      ),
      "Effective upkeep multiplier (world & research)":
        number(n.motionModifiers.upkeep) + "�",
      "Energy per operation": number(
        Math.ceil(10 * n.motionModifiers.energyCost),
      ),
      "Energy recovery multiplier": number(n.motionModifiers.energyRegen) + "�",
      "Unit money discount (skills & Arms Pile)": percent(
        1 - state.units.soldiers.moneyMultiplier,
      ),
      "World unit capacity multiplier":
        number(n.motionModifiers.militaryLimit ?? 1) + "�",
      "World nuclear ban": n.motionModifiers.nuclearBan ? "Active" : "Inactive",
      "World peace enforcement": n.motionModifiers.peace
        ? "Active"
        : "Inactive",
      "Offensive / defensive war capacity":
        number(2 + (n.projects.commandCenter || 0)) + " each",
      "Missile interception chance": percent(
        Math.min(0.45, (n.projects.ironCurtain || 0) * 0.15),
      ),
    });
    return `${heading("Armed forces", "Recruit, maintain, and command your military. All costs and capacity limits are enforced at purchase.", "National defense")}<div class="metrics">${[
      ["Strength", number(n.militaryStrength)],
      ["Conventional attack", number(n.conventionalAttack)],
      ["Morale", number(n.nationStats.militaryMorale) + "�"],
      ["Energy", number(state.player.currentEnergy)],
      ["Upkeep / turn", money(state.upkeep.money)],
    ]
      .map(
        ([k, v]) =>
          `<div class="metric"><small>${k}</small><strong>${v}</strong></div>`,
      )
      .join(
        "",
      )}</div>${n.militaryMaintenanceDeficit ? '<div class="locked">Maintenance could not be paid last turn. Military strength is reduced by 50% until upkeep is paid on a later turn.</div>' : ""}<div class="two-column section"><section class="card"><h3>${icon("Military", window.EmpiresMusic.modeFor(state))}Upkeep & readiness</h3>${cost({ money: state.upkeep.money, ...state.upkeep.resources })}<p class="help">Conventional attack includes morale, buildings, research and national modifiers. Target defense, critical hits and relationship bonuses are resolved per attack. Upkeep is charged every game day (one real hour). Soldier upkeep rounds up per 100 units; tank upkeep rounds up per 10.</p>${list({ Intuition: number(state.player.currentIntuition), "Maintenance penalty": n.militaryMaintenanceDeficit ? "-50%" : "None", "Population efficiency": number(n.nationStats.populationEfficiency) + "�", "Temporary workforce reduction": number((n.temporaryEffects || []).filter((e) => e.type === "populationReduction").reduce((s, e) => s + e.amount, 0)) })}</section><section class="card"><h3>Active boosts & deductions</h3>${effects || '<p class="muted">No military building effects yet.</p>'}<details id="military-leader-skills" class="section"><summary>Leader combat skills</summary>${list(Object.fromEntries(["attack", "defense", "aim", "luck", "criticalChance", "criticalDamage", "block", "evade", "energy", "intuition", "taxation", "intelligence", "diplomacy", "production", "stewardship", "discipline"].map((key) => [human(key), state.skills[key].value])))}</details></section></div><div class="grid section">${Object.entries(
      state.units,
    )
      .map(
        ([type, q]) =>
          `<article class="card building-card"><div class="card-title"><h3>${icon("Military", type)}${human(type)}</h3>${badge(`${number(q.owned)} / ${number(q.capacity)}`)}</div><p class="muted">${esc(q.description)}</p><div><h4>Cost per unit</h4>${cost(q.cost)}</div><div><h4>Effective upkeep per ${catalog.unitUpkeep[type].group} / turn</h4>${cost(
            Object.fromEntries(
              Object.entries(catalog.unitUpkeep[type])
                .filter(([key]) => key !== "group")
                .map(([key, value]) => [key, value * n.motionModifiers.upkeep]),
            ),
          )}</div><div class="requirements">${q.techRequired ? `Technology ${q.techRequired}` : "No technology requirement"}${q.prerequisite ? ` � Requires ${human(q.prerequisite)}` : ""}<br>${q.populationImpact ? `${q.populationImpact} workforce reduction per unit / one turn` : type === "soldiers" ? "1 workforce reduction per 10 soldiers / one turn" : ""}</div><footer><form class="unit-form" id="unit-${type}" data-command="buyUnit"><input type="hidden" name="type" value="${type}">${input("Quantity", "amount", 1, "number", 'min="1" max="1000000" step="1" required')}<button class="primary" data-buy-unit="${type}">Buy</button><button type="button" data-sell-unit="${type}">Sell</button></form><div id="unit-total-${type}" class="transaction-quote"></div><p class="reasons" id="unit-reason-${type}">${esc(q.reasons.join(" � ") || "Ready to recruit")}</p><small>Sell for 50% of paid money. No resource refund. Automatic production has no sale value.</small></footer></article>`,
      )
      .join(
        "",
      )}</div><section class="card section"><h2>Intelligence reports</h2>${
      Object.entries(n.intelligence || {})
        .map(
          ([id, report]) =>
            `<article class="section"><h3>${esc(nationName(id))}</h3><small>Observed ${date(report.at)}${report.sharedBy ? ` � Shared by ${esc(nationName(report.sharedBy))}` : ""} � Information reflects the time of the mission.</small>${list({ Treasury: money(report.money), ...Object.fromEntries(Object.entries(report.units).map(([key, value]) => [human(key), number(value)])) })}</article>`,
        )
        .join("") ||
      '<p class="muted">Successful spy missions reveal military inventories and treasury balances here.</p>'
    }</section>${treatyCalls()}<section class="section"><div class="section-title"><h2>Active wars</h2><small>15-minute preparation � 4-hour rounds � best of 3</small></div>${
      state.wars.length
        ? state.wars
            .map(
              (w) =>
                `<article class="card section"><div class="row spread"><h3>${esc(nationName(w.attacker))} vs ${esc(nationName(w.defender))}</h3>${badge(w.status)}</div><p>${esc(w.reason)}</p><p>Round ${w.round} � ${w.status === "ended" ? `Result: ${esc(nationName(w.result) === "Unknown nation" ? w.result : nationName(w.result))}` : `<span data-deadline="${w.endsAt}"></span>`}</p><div class="row section">${warControls(w)}</div><details id="war-${w.id}" class="section"><summary>Battle reports</summary>${w.log.map((e) => `<p>${battleIcon(e)}${esc(nationName(e.actor))} � ${human(e.type)} � ${e.type === "spies" ? "Intelligence report obtained" : number(e.damage) + (e.type === "conventional" ? " combat" : " infrastructure") + " damage"} � Target: ${esc(nationName(e.target))} � ${date(e.at)}</p>`).join("") || "No engagements yet."}${
                  w.casualties
                    ? `<h4 class="section">${icon("Military", "casualties")}Units lost</h4>${Object.entries(
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
        quote = UI.unitTotals(state.nation, q, amount);
      f.querySelector("[data-buy-unit]").disabled =
        pending || !online || !quote.canBuy;
      f.querySelector("[data-sell-unit]").disabled =
        pending || !online || !quote.canSell;
      document.getElementById(`unit-reason-${type}`).textContent =
        quote.reasons.join(" � ") || "Ready to recruit";
      document.getElementById(`unit-total-${type}`).innerHTML =
        `<small>Purchase total</small>${cost({ money: quote.money, ...quote.resources })}<small>Temporary workforce reduction: ${number(quote.populationImpact)} � Happiness reduction: ${number(quote.happinessImpact)} (one turn)</small><small>Sale return: ${money(quote.refund)}${quote.canSell ? "" : " � Not enough units to sell"}</small>`;
    }
  }
  function researchSummary() {
    return `<details class="card section" id="research-summary"><summary>Active research bonuses</summary><p>Advanced bonuses use diminishing returns. Further contributions still help, but each adds less as the bonus approaches its limit. Existing direct bonuses add separately. Research speed changes preserve completed work.</p>${list(
      Object.fromEntries(
        Object.entries(state.nation.researchModifiers || {})
          .filter(([, v]) => v)
          .map(([key, v]) => [
            catalog.researchStats[key][0],
            "+" + number(v) + catalog.researchStats[key][1],
          ]),
      ),
    )}</details>`;
  }
  function treatyCalls() {
    const calls = state.diplomacy?.calls || [];
    return `<section class="card section"><h2>Treaty war calls</h2><p class="help">Respond during the 15-minute preparation window. Mandatory refusals apply the listed treaty penalty for 7 game days and agreed compensation; optional calls can be declined freely.</p>${calls.map((o) => `<article class="section"><h3>${esc(catalog.treatyTypes[o.type].name)} � ${esc(nationName(o.beneficiary))}</h3><p>Requested from ${esc(nationName(o.nation))}${o.mandatory ? ` � Refusal: -${Math.abs(catalog.treatyTypes[o.type].failurePenalty.happiness)} happiness${catalog.treatyTypes[o.type].failurePenalty.compensation ? ` and ${money(o.compensation)}` : ""}` : " � No refusal penalty"}</p><p>${esc(human(o.side))} side � ${o.mandatory ? "Mandatory" : "Optional"} � ${esc(human(o.status))}${o.status === "pending" ? ` � <span data-deadline="${o.endsAt}"></span>` : ""}</p>${o.nation === state.nation.id && o.status === "pending" ? `<div class="row">${button("Join war", "warRespond", { id: o.warId, obligation: o.id, accept: true }, o.canJoin)}${button("Decline call", "warRespond", { id: o.warId, obligation: o.id, accept: false }, true, "")}</div><p class="reasons">${esc(o.reasons.join(" � "))}</p>` : ""}${o.debt || o.paid ? `<p>Compensation paid: ${money(o.paid || 0)} � Outstanding: ${money(o.debt || 0)}</p>` : ""}</article>`).join("") || '<p class="muted">No treaty war calls.</p>'}${(state.nation.diplomaticPenalties || []).map((p) => `<p>-${number(p.happiness)} happiness � <span data-deadline="${p.endsAt}"></span></p>`).join("")}</section>`;
  }
  function warControls(w) {
    const n = state.nation,
      side = (w.sides?.attacker || [w.attacker]).includes(n.id)
        ? "attacker"
        : "defender";
    const enemies = w.sides?.[
      side === "attacker" ? "defender" : "attacker"
    ] || [side === "attacker" ? w.defender : w.attacker];
    return `<p>Attackers: ${esc((w.sides?.attacker || [w.attacker]).map(nationName).join(", "))}<br>Defenders: ${esc((w.sides?.defender || [w.defender]).map(nationName).join(", "))}<br>Your relationship combat bonus: +${number((state.diplomacy.combatBonuses[w.id] || 0) * 100)}%</p>${form(`war-attack-${w.id}`, "attack", `<input type="hidden" name="id" value="${w.id}">${select("Target", "target", Object.fromEntries(enemies.map((id) => [id, nationName(id)])), enemies[0])}${select("Operation", "type", { conventional: "Conventional", missiles: "Missile", nukes: "Nuclear", spies: "Intelligence" }, "conventional")}`, "Launch operation", w.status === "active")}${button("Offer white peace", "peace", { id: w.id }, w.status !== "ended" && !w.peace.includes(n.id) && [w.attacker, w.defender].includes(n.id), "")}`;
  }
  function researchPage() {
    const n = state.nation;
    return `${heading("Research bureau", "Advance through the technology tree. Research continues while you are away.", "Knowledge is power")}${researchSummary()}<section class="card"><div class="row spread"><h2>Research queue</h2>${badge(`${n.activeResearch.length} / ${n.wonders.great_library ? 2 : 1} slots`)}</div>${n.activeResearch.length ? n.activeResearch.map((task) => `<div class="section"><div class="row spread"><strong>${esc(catalog.research[task.key].name)}</strong><span data-deadline="${task.endsAt}"></span>${button("Cancel � 50% refund", "cancelResearch", { key: task.key }, true, "")}</div><progress data-work="${task.totalWork - task.remainingWork}" data-updated="${task.updatedAt}" data-rate="${task.rate}" value="${task.totalWork - task.remainingWork}" max="${task.totalWork}" aria-label="Research progress"></progress></div>`).join("") : '<p class="muted">Your researchers are ready for their next project.</p>'}</section><div class="section">${subnav("research", { economy: "Economy", healthcare: "Healthcare", production: "Production", war: "War" }, researchCategory)}</div><div class="grid">${Object.entries(
      catalog.research,
    )
      .filter(([, d]) => d.category === researchCategory)
      .map(([key, d]) => {
        const q = state.research[key];
        return `<article class="card building-card" data-list-item data-status="${n.completedResearch.includes(key) ? "completed" : n.activeResearch.some((a) => a.key === key) ? "active" : q.canStart ? "available" : "locked"}" data-search="${esc(d.name + " " + d.description)}"><div class="row spread"><div class="eyebrow">Tier ${d.tier}</div>${badge(n.completedResearch.includes(key) ? "Completed" : `${number(q.duration / 3600000)} hours`, n.completedResearch.includes(key) ? "good" : "")}</div><h3>${esc(d.name)}</h3><p class="description">${esc(d.description)}</p>${cost({ money: d.cost })}<div class="requirements">Technology ${d.requirements.tech_level}${d.requirements.prerequisites?.length ? " � " + esc(d.requirements.prerequisites.map((id) => catalog.research[id]?.name || id).join(", ")) : ""}</div><details id="research-effects-${key}"><summary>Research effects</summary>${(d.appliedEffects || []).map((e) => `<p><strong>${esc(human(e.key))}</strong>: +${number(e.contribution)} ${esc(e.label.toLowerCase())} ${esc(e.unit)}${e.bounded ? ` contribution (diminishing returns, approaches +${e.cap}${esc(e.unit)})` : ""}</p>`).join("")}</details><footer><p class="reasons">${esc(q.reasons.join(" � ") || "Available to research")}</p>${button("Start research", "startResearch", { key }, q.canStart)}</footer></article>`;
      })
      .join("")}</div>`;
  }
  function teamPage() {
    const n = state.nation,
      s = state.sports;
    const teamName = (id) =>
      s.teams.find((t) => t.id === id)?.name || "Unknown team";
    const sportCards = catalog.sports.types
      .filter((sport) => sport === teamSport)
      .map((sport) => {
        const team = s.own[sport],
          unlocked = !!n.wonders[`${sport}Stadium`];
        if (!team)
          return `<section class="card"><h2>${icon("Sports", sport)}${human(sport)}</h2><p class="muted">Requires the ${human(sport)} Stadium wonder. Create a club with a starting roster, coach, and ${money(catalog.sports.creationCost)} club budget.</p>${form(`team-create-${sport}`, "teamCreate", `<input type="hidden" name="sport" value="${sport}">${input("Club name", "name", "", "text", 'required minlength="3" maxlength="60"')}`, `Create club � ${money(catalog.sports.creationCost)}`, unlocked && n.money >= catalog.sports.creationCost)}</section>`;
        return `<section class="card section"><div class="row spread"><h2>${icon("Sports", sport)}${esc(team.name)}</h2>${badge(human(sport))}</div><div class="metrics section">${[
          ["Club budget", money(team.budget)],
          ["Revenue / turn", money(team.revenue)],
          ["Expenses / turn", money(team.expenses)],
          [
            "Record",
            `${team.stats.wins} W � ${team.stats.losses} L � ${team.stats.draws} D`,
          ],
        ]
          .map(
            ([k, v]) =>
              `<div class="metric"><small>${k}</small><strong>${v}</strong></div>`,
          )
          .join(
            "",
          )}</div><p>Coach: ${esc(team.coach.name)} � Stadium capacity: ${number(team.stadium.capacity)} � Championships: ${team.stats.championships}</p><details id="facilities-${sport}" class="section"><summary>Stadium facilities</summary><div class="grid section">${catalog.sports.upgrades.map((key) => `<article class="card"><h3>${esc(key)}</h3><p>Level ${team.stadium.upgrades[key]} / 10</p>${button("Upgrade � " + money(team.upgradeCosts[key]), "teamUpgrade", { sport, upgradeType: key }, team.stadium.upgrades[key] < 10 && n.money >= team.upgradeCosts[key])}</article>`).join("")}</div></details><details id="lineup-${sport}" class="section"><summary>Starting lineup & roster</summary><div class="grid section">${catalog.sports.positions[sport].map((position, slot) => form(`starter-${sport}-${slot}`, "teamStarter", `<input type="hidden" name="sport" value="${sport}"><input type="number" name="slot" value="${slot}" hidden>${select(position, "playerId", Object.fromEntries(team.players.filter((p) => p.position === position && !p.isInjured && !p.isRetired).map((p) => [p.id, p.name + " � " + number(p.rating)])), team.roster.find(([key]) => String(key) === String(slot))?.[1])}`, "Set starter")).join("")}</div><div class="table-wrap section"><table><thead><tr><th>Player</th><th>Position</th><th>Rating</th><th>Age</th><th>Salary / year</th><th>Status</th><th></th></tr></thead><tbody>${team.players.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.position)}</td><td>${number(p.rating)}</td><td>${p.age}</td><td>${money(p.salary)}</td><td>${p.isInjured ? icon("Sports", "injured") + p.injuryDaysLeft + " turns injured" : team.roster.some(([, key]) => key === p.id) ? "Starting" : "Bench"}</td><td>${button("Release", "teamRelease", { sport, playerId: p.id }, team.players.length > catalog.sports.positions[sport].length, "")}</td></tr>`).join("")}</tbody></table></div></details><details id="agents-${sport}" class="section"><summary>Free agents</summary>${
          s.freeAgents
            .filter((p) => p.sport === sport)
            .map(
              (p) =>
                `<div class="row spread section"><span>${esc(p.name)} � ${esc(p.position)}</span>${button("Sign � " + money(p.salary), "teamSign", { sport, playerId: p.id }, team.budget >= p.salary && team.players.length < 40)}</div>`,
            )
            .join("") ||
          '<p class="muted">Released players will appear here.</p>'
        }</details><details id="competition-create-${sport}" class="section"><summary>Organize a competition</summary><p class="help">Fund a $10M prize from your nation. Registration closes in 3 real days; play begins in 7. The prize returns if fewer than two teams register. Matches are scheduled one hour apart; knockout draws advance the stronger team.</p>${form(`tournament-create-${sport}`, "teamTournament", `<input type="hidden" name="sport" value="${sport}">${select("Format", "type", { league: "League (home and away)", cup: "Knockout cup", championship: "Championship" }, "league")}`, "Organize � $10M", n.money >= catalog.sports.tournamentPrize && !s.tournaments.some((t) => t.sport === sport && ["registration", "active"].includes(t.status)))}</details></section>`;
      })
      .join("");
    return `${heading("National sports clubs", "Manage your squads, improve facilities, and compete with other nations.", "Team management")}${subnav("sport", Object.fromEntries(catalog.sports.types.map((key) => [key, human(key)])), teamSport)}${sportCards}<section class="section"><h2>Competitions</h2>${s.tournaments.map((t) => `<article class="card section"><div class="row spread"><h3>${icon("Sports", t.sport + "-trophy")}${esc(t.name)}</h3>${badge(t.status)}</div><p>${t.participants.length} teams � Prize ${money(t.prize.money)}${t.winner ? " � Winner: " + esc(teamName(t.winner)) : ""}</p>${t.status === "registration" ? `<p>Registration closes ${date(t.registrationDeadline)} � Starts ${date(t.startDate)}</p>${button("Register team", "teamRegister", { sport: t.sport, tournamentId: t.id }, !!s.own[t.sport] && !t.participants.some((p) => p.nationId === n.id) && t.registrationDeadline > state.serverTime)}` : ""}<details id="standings-${t.id}" class="section"><summary>Standings</summary>${t.standings.map(([id, v]) => `<p>${esc(teamName(id))} � ${v.points} points � ${v.wins} W / ${v.draws} D / ${v.losses} L</p>`).join("")}</details></article>`).join("") || empty("No competitions yet. Club owners can organize one above.")}</section><section class="section"><h2>Fixtures & results</h2><div class="grid section">${
      s.matches
        .slice()
        .reverse()
        .map(
          (m) =>
            `<article class="card"><div class="row spread"><strong>${esc(teamName(m.team1))} vs ${esc(teamName(m.team2))}</strong>${badge(m.status)}</div><p>${date(m.date)} � ${human(m.sport)}</p>${m.status === "completed" ? `<h3>${m.score1} � ${m.score2}</h3><details id="match-events-${m.id}" class="section"><summary>Match report</summary>${m.events.map((e) => `<p>${e.minute}' ${esc(teamName(e.team))} � ${esc(e.type)}</p>`).join("") || "No scoring events."}</details>` : form(`bet-${m.id}`, "teamBet", `<input type="hidden" name="matchId" value="${m.id}">${select("Predicted winner", "prediction", { [m.team1]: teamName(m.team1), [m.team2]: teamName(m.team2), draw: "Draw" }, m.team1)}${input("Stake ($)", "amount", 100, "number", 'min="1" max="1000000" required')}`, "Place bet", !!n.projects.sportsBetting && !s.bets.some((b) => b.matchId === m.id) && ![m.team1, m.team2].some((id) => s.teams.find((t) => t.id === id)?.nationId === n.id))}</article>`,
        )
        .join("") ||
      empty("Registered competitions schedule matches when play begins.")
    }</div><p class="help">Sports Betting unlocks one winner bet per fixture. Club owners cannot bet on their own fixtures. Stakes are deducted immediately and winning returns settle when the match completes.</p></section><section class="card section"><h3>Your bets</h3>${s.bets.map((b) => `<p>${money(b.amount)} at ${number(b.odds)}� � ${esc(b.status)}${b.winnings ? " � Return " + money(b.winnings) : ""}</p>`).join("") || '<p class="muted">No bets placed.</p>'}</section>`;
  }
  function tradePage() {
    const n = state.nation,
      loans = state.loans || [],
      worldBank = state.worldBank || {},
      prices = worldBank.prices || {},
      inventory = worldBank.inventory || {};
    return `${heading("World Bank", "Borrow from the World Bank, buy and sell resources at dynamic prices.", "Commerce & production")}<div class="tabs">${subnav("tradeView", { worldBank: "World Bank" }, tradeView)}<div class="two-column">${tradeView === "worldBank" ? worldBankPanel(n, loans, worldBank, prices, inventory) : listedTradesPanel(n)}</div></div>`;
  }
  function worldBankPanel(n, loans, worldBank, prices, inventory) {
    const activeLoans = loans.filter((l) => l.status === "active");
    const totalOwed = loans.reduce((s, l) => s + l.owed, 0);
    const activePrincipal = activeLoans.reduce((s, l) => s + l.principal, 0);
    const limit = Math.floor((n.taxRevenue || 0) * 52);
    const canBorrow = n.loans.filter((l) => l.status === "active").length < 3;
    const stockRows = catalog.resources
      .map(
        (resource) => {
          const price = prices[resource] !== undefined ? prices[resource] : 100;
          const stock = inventory[resource] || 0;
          return `<tr><td>${human(resource)}</td><td>${number(stock)}</td><td>${money(price)}</td><td>${button(
            "Buy",
            "worldBankBuy",
            { resource, amount: 1 },
            stock > 0 && n.money >= price,
            stock > 0 && n.money >= price ? "" : "danger",
          )}${button("Sell", "worldBankSell", { resource, amount: 1 }, (n.resources[resource] || 0) > 0, "")}</td></tr>`;
        },
      )
      .join("");
    return `<section class="card section"><div class="metrics"><div class="metric"><small>Active loans</small><strong>${activeLoans.length} / 3</strong></div><div class="metric"><small>Principal owed</small><strong>${money(activePrincipal)}</strong></div><div class="metric"><small>Total owed (incl. interest)</small><strong>${money(totalOwed)}</strong></div><div class="metric"><small>Loan limit (1yr revenue)</small><strong>${money(limit)}</strong></div></div>${activeLoans.length ? `<div class="table-wrap section"><table><thead><tr><th>Principal</th><th>Owed</th><th>Rate</th><th>Action</th></tr></thead><tbody>${loans.map((l) => l.status === "active" ? `<tr><td>${money(l.principal)}</td><td>${money(l.owed)}</td><td>${(l.rate * 100).toFixed(0)}%</td><td>${form(`repay-${l.id}`, "worldBankRepay", `<input type="hidden" name="loanId" value="${l.id}">${input("Repay ($)", "amount", Math.min(l.owed, n.money), "number", 'required min="1" max="999999999999"')}`, "Repay loan", n.money > 0)}</td></tr>` : "").join("")}</tbody></table></div>` : '<p class="muted">No active World Bank loans.</p>'}<div class="section">${form("loan-form", "worldBankLoan", input("Amount ($)", "amount", Math.min(limit, Math.max(1, n.money)), "number", 'required min="1"'), "Take loan", canBorrow && limit > 0 && n.money > 0)}<p class="help">Borrow up to one year of tax revenue. Repay with interest over time. Loans do not accrue interest between turns.</p></div></section><section class="card section"><h3>World Bank market</h3><p class="muted">Prices move with stock levels: low stock raises prices, high stock lowers them. The World Bank buys and sells at the same listed price.</p><div class="table-wrap"><table><thead><tr><th>Resource</th><th>Stock</th><th>Price / unit</th><th>Action</th></tr></thead><tbody>${stockRows || '<tr><td colspan="4" class="muted">No market data.</td></tr>'}</tbody></table></div><p class="help">Buying adds stock to your nation; selling removes stock and credits money. Both update World Bank inventory and shift future prices.</p></section>`;
  }
  function diplomacyPage() {
    const n = state.nation,
      nations = state.nations.filter((other) => other.id !== n.id),
      enabled = !!n.improvements.foreignAffairsOffice;
    return `${heading("Diplomatic service", "Build relationships, negotiate treaties, send aid, and manage conflicts.", "Foreign affairs")}${treatyCalls()}<section class="card section"><h2>Relationships & intelligence</h2>${list({ "Friend slots": `${n.diplomaticRelations.friends.length} / ${n.diplomaticRelations.maxFriends}`, "Foe slots": `${n.diplomaticRelations.foes.length} / ${n.diplomaticRelations.maxFoes}`, "Best friend": n.diplomaticRelations.bestFriend ? nationName(n.diplomaticRelations.bestFriend) : "None", Nemesis: n.diplomaticRelations.nemesis ? nationName(n.diplomaticRelations.nemesis) : "None", "Owned technology": number(n.tech), "Shared technology": number(n.sharedTechnology), "Effective technology": number(n.effectiveTech) })}<p class="help">Friends in a war add 5% each; best friend adds 15%. Foe designations add 5% to both parties, nemesis 15%; total relationship bonus is capped at 125%. Intelligence partners share reports. With Financial Assistance, borrow 20% of the strongest partner�s owned technology while the pact is active.</p></section>${!enabled ? '<div class="locked">Build a Foreign Affairs Office to unlock diplomatic relationships, treaties, and aid.</div>' : ""}<section class="section"><h2>Foreign aid</h2>${state.aid.length ? state.aid.map((a) => `<article class="card section"><div class="row spread"><strong>${esc(nationName(a.from))} ? ${esc(nationName(a.to))}</strong>${badge(a.status)}</div><p>${number(a.amount)} ${human(a.type)} � ${["pending", "accepted", "returning"].includes(a.status) ? `<span data-deadline="${a.endsAt}"></span>` : "Settled"}</p>${a.status === "pending" && a.to === n.id ? `<div class="row section">${button("Accept aid", "aidRespond", { id: a.id, accept: true })}${button("Decline", "aidRespond", { id: a.id, accept: false }, true, "")}</div>` : ""}</article>`).join("") : empty("No pending aid. Proposals occupy one of three slots and expire after 7 real days.")}</section><section class="section"><h2>Treaties & proposals</h2>${state.treaties.length ? state.treaties.map((t) => `<article class="card section"><div class="row spread"><h3>${esc(catalog.treatyTypes[t.type].name)}</h3>${badge(t.status)}</div><p>${esc(nationName(t.from))} ? ${esc(nationName(t.to))}</p><p class="muted">${esc(catalog.treatyTypes[t.type].description)}</p><p class="reasons">${esc((state.diplomacy.treatyAcceptance[t.id] || []).join(" � "))}</p><small>Agreed compensation: ${money(t.compensation)}${t.endsAt && t.status === "active" ? ` � Expires ${date(t.endsAt)}` : ""}</small><div class="row section">${t.status === "pending" && t.to === n.id ? button("Accept", "treatyRespond", { id: t.id, accept: true }, enabled && !state.diplomacy.treatyAcceptance[t.id]?.length) + button("Decline", "treatyRespond", { id: t.id, accept: false }, enabled, "") : ""}${["active", "pending"].includes(t.status) ? button("Cancel treaty", "treatyCancel", { id: t.id }, enabled && !(t.status === "active" && catalog.treatyTypes[t.type].cannotBreakEarly), "") : ""}</div></article>`).join("") : empty("No treaties or proposals yet.")}</section><section class="section"><h2>Nations of the world</h2><div class="grid section">${nations.length ? nations.map((other) => `<article class="card" data-list-item data-status="${other.allianceId === n.allianceId && n.allianceId ? "allies" : n.relationships[other.id] || "neutral"}" data-search="${esc(other.name + " " + other.leader + " " + catalog.colors[other.factionKey].name)}"><div class="eyebrow">${esc(catalog.colors[other.factionKey].name)}</div><h3>${icon("Colors", other.factionKey)}${esc(other.name)}</h3>${list({ Leader: other.leader, Population: other.population === null ? "Private" : number(other.population), "Last activity": other.lastActive ? date(other.lastActive) : "Private", "Military strength": other.militaryStrength === null ? "Private" : number(other.militaryStrength), Relationship: human(n.relationships[other.id] || "neutral") })}<details id="diplomacy-${other.id}" class="section"><summary>Diplomatic actions</summary><div class="stack">${form(`relationship-${other.id}`, "relationship", `<input type="hidden" name="target" value="${other.id}">${select("Relationship", "relationship", { friend: "Friend", bestFriend: "Best friend", foe: "Foe", nemesis: "Nemesis", neutral: "Neutral" }, n.relationships[other.id] || "neutral")}`, "Set relationship", enabled)}${form(`treaty-${other.id}`, "treatyPropose", `<input type="hidden" name="target" value="${other.id}">${select("Treaty", "type", catalog.treatyTypes, "peace")}${input("Compensation ($)", "compensation", 0, "number", 'min="0" max="1000000000"')}${input("Peace duration (real days)", "duration", 30, "number", 'min="1" max="30"')}`, "Propose treaty", enabled)}${form(`aid-${other.id}`, "aid", `<input type="hidden" name="target" value="${other.id}">${select("Aid type", "type", { money: "Money", tech: "Technology (20% of current level)" }, "money")}${input("Financial aid ($)", "amount", 1000, "number", 'min="1" max="1000000000" required')}`, "Propose aid", enabled && !!n.projects.financialAssistanceOffice)}</div></details><details id="war-declare-${other.id}" class="section"><summary>Military actions</summary>${form(`war-${other.id}`, "declareWar", `<input type="hidden" name="target" value="${other.id}">${input("Reason for war", "reason", "Territorial dispute", "text", 'required maxlength="300"')}`, "Declare war", !n.motionModifiers.peace)}</details></article>`).join("") : empty("No other nations have joined yet. New nations appear here in real time.")}</div></section>`;
  }
  function alliancePage() {
    const n = state.nation,
      a = state.alliances.find((a) => a.id === n.allianceId);
    if (!a)
      return `${heading("Alliance hall", "Find your people. Coordinate diplomacy, pool resources, and build lasting partnerships.", "Stronger together")}<div class="two-column"><section class="stack">${state.alliances.length ? state.alliances.map((a) => `<article class="card"><div class="row spread"><h2>${esc(a.name)}</h2>${badge(a.open ? "Recruiting" : "Closed")}</div><p>${esc(a.description)}</p><p class="muted">${esc(catalog.allianceTemplates[a.government].name)} � ${Object.keys(a.members).length} / 6 members</p><div class="section">${button(a.applications.includes(n.id) ? "Application pending" : "Apply to join", "allianceApply", { id: a.id }, a.open && !a.applications.includes(n.id))}</div></article>`).join("") : empty("No alliances have formed yet.")}</section><section class="card"><h2>Found an alliance</h2><p class="help">Requires the Alliance Headquarters wonder, or a best friend and five friends with the qualifying mutual treaties.</p>${form("alliance-create", "allianceCreate", input("Alliance name", "name", "", "text", 'required minlength="3" maxlength="60"') + select("Government", "government", Object.fromEntries(Object.entries(catalog.allianceTemplates).filter(([key]) => key !== "custom")), "democratic") + textarea("Charter & description", "description", "", 'maxlength="2000"'), "Found alliance", state.canFoundAlliance)}</section></div>`;
    const can = (permission) =>
        a.permissions.includes("all") || a.permissions.includes(permission),
      roles = catalog.allianceTemplates[a.government].roles;
    return `${heading(a.name, a.description || "Your alliance headquarters.", catalog.allianceTemplates[a.government].name)}<div class="metrics"><div class="metric"><small>Members</small><strong>${Object.keys(a.members).length} / 6</strong></div><div class="metric"><small>Treasury</small><strong>${money(a.treasury)}</strong></div><div class="metric"><small>Your role</small><strong style="font-size:18px">${esc(roles.find((r) => r.id === a.members[n.id])?.name)}</strong></div><div class="metric"><small>Recruitment</small><strong>${a.open ? "Open" : "Closed"}</strong></div></div><div class="two-column"><section class="card"><h2>Member roster</h2><div class="table-wrap"><table><thead><tr><th>Nation</th><th>Role</th><th>Management</th></tr></thead><tbody>${Object.entries(
      a.members,
    )
      .map(
        ([id, role]) =>
          `<tr><td>${esc(nationName(id))}${id === a.founder ? " � Founder" : ""}</td><td>${esc(roles.find((r) => r.id === role)?.name || role)}</td><td>${can("all") && id !== a.founder ? form(`role-${id}`, "allianceRole", `<input type="hidden" name="target" value="${id}">${select("Assign role", "role", Object.fromEntries(roles.filter((r) => r.id === role || Object.values(a.members).filter((value) => value === r.id).length < (r.unique ? 1 : r.maxCount || 999)).map((r) => [r.id, r.name])), role)}`, "Assign") : ""}${n.id === a.founder && id !== n.id ? button("Transfer leadership", "allianceTransfer", { target: id }, true, "") : ""}${can("members") && id !== a.founder && id !== n.id && !roles.find((r) => r.id === role)?.permissions.includes("all") ? button("Remove", "allianceKick", { target: id }, true, "danger") : ""}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><div class="section"><h3>Your permissions</h3><div class="pill-row">${a.permissions.map((p) => badge(human(p))).join("")}</div></div>${can("members") ? `<div class="section"><h3>Membership applications</h3>${a.applications.length ? a.applications.map((id) => `<div class="row spread section"><strong>${esc(nationName(id))}</strong><div>${button("Accept", "allianceReview", { target: id, accept: true }, Object.keys(a.members).length < 6 && !state.nations.find((n) => n.id === id)?.allianceId)}${button("Decline", "allianceReview", { target: id, accept: false }, true, "")}</div></div>`).join("") : '<p class="muted">No pending applications.</p>'}</div>` : ""}</section><div class="stack"><section class="card"><h3>Alliance treasury</h3>${form("alliance-deposit", "allianceDeposit", input("Contribution ($)", "amount", 1000, "number", 'required min="1" max="1000000000"'), "Contribute")}${can("resources") ? `<div class="section">${form("alliance-withdraw", "allianceWithdraw", input("Withdrawal ($)", "amount", 1000, "number", 'required min="1" max="1000000000"'), "Withdraw")}</div>` : '<p class="help">Your role does not grant withdrawal permissions.</p>'}</section>${can("domestic") ? `<section class="card"><h3>Alliance settings</h3>${form("alliance-settings", "allianceSettings", textarea("Charter & description", "description", a.description, 'maxlength="2000"') + `<label class="checkbox"><input name="open" type="checkbox" ${a.open ? "checked" : ""}>Accept membership applications</label>`, "Save settings")}</section>` : ""}<section class="card"><h3>Membership</h3><p class="muted">Founders must transfer leadership before leaving an alliance with other members.</p><div class="section">${button("Leave alliance", "allianceLeave", {}, a.founder !== n.id || Object.keys(a.members).length === 1, "danger")}</div></section></div></div><section class="card section"><h3>Alliance activity</h3>${
      a.log
        .slice()
        .reverse()
        .map(
          (log) =>
            `<p><small>${date(log.at)}</small> � ${esc(nationName(log.actor))} � ${esc(human(log.action.replace("alliance", "")))}</p>`,
        )
        .join("") || '<p class="muted">Your alliance story starts here.</p>'
    }</section>`;
  }
  function worldTabPage(state) {
    state.worldView = worldView;
    return window.renderWorldTab ? window.renderWorldTab(state, catalog) : '<div class="empty">The world tab is loading.</div>';
  }
  function renderFortuneTab(state) {
    return window.renderFortuneTab ? window.renderFortuneTab(state, catalog) : '<div class="empty">The fortune tab is loading.</div>';
  }
  function newsPage() {
    return window.renderNewsTab ? window.renderNewsTab(state) : '<div class="empty">The news tab is loading.</div>';
  }
  function messagesPage() {
    const n = state.nation,
      others = state.nations.filter((other) => other.id !== n.id);
    if (!others.some((other) => other.id === privateRecipient))
      privateRecipient = others[0]?.id || "";
    const messages = state.messages.filter(
      (m) =>
        m.channel === messageChannel &&
        (messageChannel !== "private" ||
          [m.author, m.target].includes(privateRecipient)),
    );
    return `${heading("Communications", "Talk with the world, coordinate with your alliance, or send a private message.", "Dispatches")}${subnav("messages", { world: "World", alliance: "Alliance", private: "Private" }, messageChannel)}<div class="communications-layout">${messageChannel === "private" ? `<aside class="card conversation-list"><h2>Direct messages</h2><p class="muted">Choose a nation to view your conversation.</p>${others.map((other) => `<button class="conversation ${privateRecipient === other.id ? "active" : ""}" data-recipient="${other.id}" aria-pressed="${privateRecipient === other.id}"><strong>${esc(other.name)}</strong><small>${esc(other.leader)}</small></button>`).join("") || empty("Other nations will appear here when they join.")}</aside>` : ""}<section class="card chat-panel"><div class="row spread"><h2>${messageChannel === "private" ? (privateRecipient ? esc(nationName(privateRecipient)) : "Direct messages") : messageChannel === "alliance" ? "Alliance dispatches" : "World channel"}</h2>${badge(messageChannel === "private" ? "Private conversation" : messageChannel === "alliance" ? "Members only" : "Public")}</div>${messageChannel === "alliance" && !n.allianceId ? empty("Join an alliance to use its private channel.") : `<div class="chat-log" role="log" aria-label="${esc(human(messageChannel))} messages" tabindex="0">${messages.map((m) => `<div class="chat-bubble ${m.author === n.id ? "mine" : ""}"><small>${esc(nationName(m.author))} � ${date(m.createdAt)}</small><p>${esc(m.body)}</p></div>`).join("") || empty("No messages yet. Start the conversation below.")}</div><div class="section">${form("message-form", "message", `<input type="hidden" name="channel" value="${messageChannel}">${messageChannel === "private" ? `<input type="hidden" name="target" value="${esc(privateRecipient)}">` : ""}${textarea("Message", "body", "", 'required maxlength="2000" placeholder="Write your dispatch�"')}`, "Send message", messageChannel !== "private" || !!others.find((n) => n.id === privateRecipient)?.acceptsMessages)}<small>Up to 2,000 characters. ${messageChannel === "world" ? "Visible to every nation." : "Only participants can read this channel. Recipients can disable private messages in Settings."}</small></div>`}</section></div>`;
  }
  function mapPage() {
    const n = state.nation,
      [sx, sy] = selectedTile,
      owner = state.territories[`${sx},${sy}`],
      nation = state.nations.find((other) => other.id === owner);

    // Map toggle views
    if (mapToggleType === "nation" && mapToggleTarget) {
      const t = state.nations.find((x) => x.id === mapToggleTarget);
      if (t) {
        return `<header class="page-heading"><div><div class="eyebrow">Nation Profile</div><h1>${esc(t.name)}</h1><p>Map interaction for ${esc(t.name)}</p></div><button data-map-toggle-close class="section">Back to Map</button></header>${window.MapModals ? window.MapModals.nationToggleContent(state, t) : '<div class="empty">Map modals loading.</div>'}`;
      }
    }
    if (mapToggleType === "alliance" && mapToggleTarget) {
      const a = state.alliances?.find((x) => x.id === mapToggleTarget);
      if (a) {
        return `<header class="page-heading"><div><div class="eyebrow">Alliance Profile</div><h1>${esc(a.name)}</h1><p>Map interaction for ${esc(a.name)}</p></div><button data-map-toggle-close class="section">Back to Map</button></header>${window.MapModals ? window.MapModals.allianceToggleContent(state, a) : '<div class="empty">Map modals loading.</div>'}`;
      }
    }
    if (mapToggleType === "currency") {
      worldView = "bank";
      mapToggleType = null;
      mapToggleTarget = null;
      return worldTabPage(state);
    }

    return `${heading("World atlas", "Inspect territories, find your borders, and place your available land blocks.", "Territory & influence")}<div class="map-layout"><section class="card"><div class="map-toolbar"><h2>World territories</h2><div class="row"><button data-map-zoom="-4" aria-label="Zoom out" ${mapZoom <= 16 ? "disabled" : ""}>-</button><span>${Math.round((mapZoom / 24) * 100)}%</span><button data-map-zoom="4" aria-label="Zoom in" ${mapZoom >= 40 ? "disabled" : ""}>+</button><button data-map-home>My nation</button></div></div><p class="help">Select a square to inspect it. Use arrow keys to explore the grid; Enter selects. New claims must share an edge with your nation.</p><div class="map-shell" tabindex="0" aria-label="Scrollable world map"><div class="world-grid" role="group" aria-label="Territory grid" style="--tile-size:${mapZoom}px">${Array.from(
      { length: 51 * 51 },
      (_, index) => {
        const x = (index % 51) - 25,
          y = Math.floor(index / 51) - 25,
          key = `${x},${y}`,
          id = state.territories[key],
          other = state.nations.find((v) => v.id === id),
          selected = x === sx && y === sy;
        return `<button class="map-tile ${id ? "owned" : ""} ${id === n.id ? "my-territory" : ""} ${selected ? "selected" : ""}" style="${other ? `--tile-color:${catalog.colors[other.factionKey].hex}` : ""}" data-map-tile="${x},${y}" data-map-toggle-nation="${id || ""}" tabindex="${selected ? 0 : -1}" aria-pressed="${selected}" aria-label="${x}, ${y}: ${esc(other?.name || "Unclaimed")}" title="${x}, ${y} � ${esc(other?.name || "Unclaimed")}">${id === n.id ? "?" : other ? esc(other.name.slice(0, 1)) : ""}</button>`;
      },
    ).join("")}</div></div><div class="pill-row section">${Object.values(
      catalog.colors,
    )
      .map(
        (c) =>
          `<span class="map-legend"><i style="--faction:${c.hex}"></i>${esc(c.name)}</span>`,
      )
      .join(
        "",
      )}</div></section><aside class="stack"><section class="card"><div class="eyebrow">Selected territory</div><h2 class="section">${sx}, ${sy}</h2>${list({ Owner: nation?.name || "Unclaimed", Faction: nation ? catalog.colors[nation.factionKey].name : "None", Area: "100 square miles" })}<p class="help">${esc(UI.claimReason(state, sx, sy))}</p>${owner && owner !== n.id ? `<div class="map-actions">${button("View Nation", "openNationToggle", { target: owner })}${button("Message", "openMessage", { target: owner })}${!n.motionModifiers?.peace && !nation?.motionModifiers?.peace ? button("Declare War", "declareWar", { target: owner }, true, "danger") : ""}${button("Treaty", "proposeTreaty", { target: owner })}${!n.motionModifiers?.peace && !nation?.motionModifiers?.peace ? button("Launch Attack", "launchAttack", { target: owner }, true, "danger") : ""}</div>` : `${button("Claim territory", "claim", { x: sx, y: sy }, UI.canClaim(state, sx, sy))}`}</section><section class="card"><h3>Your borders</h3>${list({ "Placed land blocks": number(n.territories.length), "Unplaced land blocks": number(n.mapBlocks - n.territories.length), "World nations": state.nations.length })}<button class="section" data-jump-tab="nation">Buy more land ?</button></section><section class="card"><h3>Find a square</h3><form id="map-coordinate" data-local="map"><div class="form-grid">${input("X coordinate", "x", sx, "number", 'min="-25" max="25" required')}${input("Y coordinate", "y", sy, "number", 'min="-25" max="25" required')}</div><button class="section">Locate</button></form></section></aside></div>`;
  }
  function leaderboardPage() {
    const definitions = catalog.rankings.metrics;
    const metric = definitions[rankingMetric];
    const score = (record) =>
      rankingPeriod === "total"
        ? record.total[rankingMetric]
        : record.periods[rankingPeriod][rankingMode]?.[rankingMetric];
    const rows = state.rankings.nations
      .map((r) => ({ ...r, score: score(r) }))
      .filter((r) => Number.isFinite(r.score))
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id),
      );
    let position = 0;
    rows.forEach((r, i) => {
      if (!i || r.score !== rows[i - 1].score) position = i + 1;
      r.rank = position;
    });
    const mine = rows.find((r) => r.id === state.nation.id);
    const scoreText = (value) =>
      metric.unit === "money" ? money(value) : number(value);
    const periodLabel =
      rankingPeriod === "total"
        ? "Total"
        : catalog.rankings.periods[rankingPeriod] + " � " + human(rankingMode);
    const bounds = rows[0]?.periods[rankingPeriod];
    return `${heading("World leaderboard", "National achievements, measured by the living world. Equal scores share a rank.", "Hall of distinction")}
    <section class="card"><div class="form-grid">${select("Ranking", "rankingMetric", Object.fromEntries(Object.entries(definitions).map(([key, d]) => [key, d.name])), rankingMetric)}${select("Period", "rankingPeriod", { ...catalog.rankings.periods, total: "Total" }, rankingPeriod)}${rankingPeriod !== "total" ? select("Result", "rankingMode", { current: "Current", average: "Average", best: "Best" }, rankingMode) : ""}</div>
    <p class="help">Real UTC calendar periods: weeks start Monday. Current shows ${metric.kind === "peak" ? "the highest recorded value in this period" : "achievements earned this period"}. Average and Best use completed periods since tracking began; a first partial period counts when it closes. Total shows ${metric.kind === "peak" ? "the all-time recorded peak" : "the lifetime achievement count"}.</p>
    ${bounds ? `<small>Current period: ${date(bounds.start)} � ${date(bounds.end)} (displayed in your local time).</small>` : ""}</section>
    <div class="metrics leaderboard-metrics section"><div class="metric"><small>${esc(periodLabel)}</small><strong>${esc(metric.name)}</strong><span>${rows.length} public nations with results</span></div><div class="metric"><small>Your rank</small><strong>${mine ? "#" + mine.rank : "�"}</strong><span>${mine ? scoreText(mine.score) + " " + (metric.unit === "money" ? "" : metric.unit) : state.rankings.ownStatisticsPublic ? "No completed period yet" : "Enable public statistics in Settings to join"}</span></div><div class="metric"><small>Award collection</small><strong>${imageIcon(Assets.award(1, metric.set), "award-icon")}${imageIcon(Assets.award(2, metric.set), "award-icon")}${imageIcon(Assets.award(3, metric.set), "award-icon")}</strong><span>${metric.set === 1 ? "Prestige awards � strength & war wins" : "Distinction set " + metric.set}</span></div></div>
    <section class="card section"><h2>${esc(metric.name)} � ${esc(periodLabel)}</h2>${rows.length ? `<div class="table-wrap section"><table><thead><tr><th>Rank</th><th>Nation</th><th>${metric.kind === "peak" ? "Recorded peak" : "Achievements"}${rankingMode === "average" && rankingPeriod !== "total" ? " / completed period" : ""}</th><th>History</th></tr></thead><tbody>${rows.map((r) => `<tr class="${r.id === state.nation.id ? "own-ranking" : ""}"><td><span class="rank-cell">${r.rank <= 3 && r.score > 0 ? imageIcon(Assets.award(r.rank, metric.set), "award-icon", `${r.rank === 1 ? "First" : r.rank === 2 ? "Second" : "Third"} place award`) : ""}<strong>#${r.rank}</strong></span></td><td>${icon("Colors", r.factionKey)}${esc(r.name)}${r.id === state.nation.id ? badge("You", "good") : ""}</td><td>${scoreText(r.score)}${metric.unit === "money" ? "" : " " + esc(metric.unit)}</td><td>Since ${date(r.since)}${rankingPeriod !== "total" ? `<br>${r.periods[rankingPeriod].samples} completed ${rankingPeriod}${r.periods[rankingPeriod].samples === 1 ? "" : "s"}` : ""}</td></tr>`).join("")}</tbody></table></div>` : empty("No completed periods to rank yet. Choose Current or Total to see recorded results.")}<p class="help">Historical period results begin when tracking is introduced to a save. Existing lifetime counts appear in Total. Nations with private statistics are excluded. Awards recognize current standings; zero scores receive no medal.</p></section>`;
  }
  function settingsPage() {
    const labels = {
      battles: ["Battle updates", "New engagements and changes to your wars."],
      trade: ["Trade updates", "Changes to the world exchange."],
      diplomacy: ["Diplomatic proposals", "New treaties from other nations."],
      research: [
        "Research completion",
        "When your researchers complete a project.",
      ],
      general: [
        "Messages & general updates",
        "New messages and activity in the world.",
      ],
      showOnline: [
        "Show recent activity",
        "Let other nations see your last active time.",
      ],
      allowMessages: [
        "Accept private messages",
        "Allow other nations to send direct messages.",
      ],
      showStatistics: [
        "Publish national statistics",
        "Publish national statistics and participate in public leaderboards.",
      ],
    };
    return `${heading("Preferences", "Make your command center work for you. Preferences never pause the world.", "Your account")}<div class="grid settings-grid"><section class="card"><h2>Background music</h2><p class="muted">Peace songs play outside war. War songs play during preparation and active wars. This preference is saved in this browser.</p><form id="music-form" data-local="music"><label class="checkbox"><input name="musicEnabled" type="checkbox" ${preferences.musicEnabled ? "checked" : ""}>Enable background music</label><label class="section">Volume <output id="music-volume-value">${Math.round((preferences.musicVolume ?? 0.35) * 100)}%</output><input type="range" name="musicVolume" min="0" max="100" step="1" value="${Math.round((preferences.musicVolume ?? 0.35) * 100)}"></label></form><p id="music-status" class="help" role="status"></p><small id="music-track"></small><button id="music-resume" class="section" hidden>Resume music</button></section><section class="card"><h2>Display & accessibility</h2><p class="muted">These display choices are saved in this browser.</p><form id="appearance-form" data-local="appearance"><div class="form-stack">${select("Color theme", "theme", { dark: "Dark (default)", light: "Light", sea: "Ocean", fire: "Fire", forest: "Forest", royal: "Royal", neon: "Neon", cyberpunk: "Cyberpunk", sunset: "Sunset", arctic: "Arctic" }, preferences.theme || "dark")}${select("Text size", "textSize", { normal: "Standard", large: "Larger text" }, preferences.textSize || "normal")}<label class="checkbox"><input type="checkbox" name="reduceMotion" ${preferences.reduceMotion ? "checked" : ""}>Reduce animations</label></div><button class="primary section">Save display preferences</button></form></section>${[
      "notifications",
      "privacy",
    ]
      .map(
        (group) =>
          `<section class="card"><h2>${human(group)}</h2><p class="muted">${group === "notifications" ? "Choose which live notices appear while you play." : "Control what other nations can see and send."}</p><div class="stack section">${Object.entries(
            state.player.settings[group],
          )
            .map(
              ([key, value]) =>
                `<div class="setting-row">${form(`setting-${key}`, "settings", `<input type="hidden" name="group" value="${group}"><input type="hidden" name="key" value="${key}"><label class="checkbox"><input name="value" type="checkbox" ${value ? "checked" : ""}>${esc(labels[key]?.[0] || human(key))}</label><small>${esc(labels[key]?.[1] || "")}</small>`, "Save preference")}</div>`,
            )
            .join("")}</div></section>`,
      )
      .join(
        "",
      )}<section class="card"><h2>Your session</h2>${list({ Player: state.player.username, Nation: state.nation.name, Connection: online ? "Connected" : "Reconnecting", World: state.worldName })}<p class="help">Successful actions save automatically. Your nation continues running after you leave.</p><button id="logout" class="danger">Sign out</button></section></div>`;
  }
  function helpPage() {
    return `${heading("Field guide", "Learn the mechanics, find practical tips, and return to your nation ready to act.", "Help & tips")}
    <section class="card"><h2>Tips for your nation</h2><div class="grid section">${window.EmpiresHelp.tips(
      state,
    )
      .map(
        (t) =>
          `<div><p>${esc(t.text)}</p><button data-jump-tab="${t.page}">Open ${esc(human(t.page))}</button></div>`,
      )
      .join("")}</div></section>
    <section class="section"><label>Search the player guide<input type="search" id="help-search" value="${esc(helpQuery)}" placeholder="Try upkeep, technology, votes�"></label><p class="muted" id="help-count" role="status"></p>
    <div class="stack">${window.EmpiresHelp.topics.map((t) => `<details class="card help-topic" id="help-${t.id}" data-help-search="${esc(t.title + " " + t.tips.join(" "))}"><summary>${esc(t.title)}</summary><ul class="help-tips">${t.tips.map((text) => `<li>${esc(text)}</li>`).join("")}</ul><button data-jump-tab="${t.id}">Open ${esc(human(t.id))}</button></details>`).join("")}</div><p id="help-empty" class="empty" hidden>No matching topics. Try a broader term or clear your search.</p></section>`;
  }
  function filterHelp() {
    const search = document.getElementById("help-search");
    if (!search) return;
    helpQuery = search.value;
    let visible = 0;
    for (const topic of document.querySelectorAll(".help-topic")) {
      topic.hidden = !UI.matches(topic.dataset.helpSearch, helpQuery);
      if (!topic.hidden) visible++;
    }
    document.getElementById("help-count").textContent =
      `${visible} topics found`;
    document.getElementById("help-empty").hidden = visible > 0;
  }
  const pages = {
    nation: renderNationTab,
    alliance: renderAllianceTab,
    news: newsPage,
    world: worldTabPage,
    wars: window.renderWarsTab ? window.renderWarsTab : warsPage,
    team: (state) => window.TeamTab?.render?.(state, teamSport) || '<div class="empty">Team tab is loading.</div>',
    user: userPage,
    fortune: renderFortuneTab,
    build: buildPage,
    military: militaryPage,
    research: researchPage,
    diplomacy: diplomacyPage,
    messages: messagesPage,
    map: mapPage,
    settings: settingsPage,
    leaderboard: leaderboardPage,
    help: helpPage,
    admin: (state) => window.AdminTab?.render?.(state) || '<div class="empty">Admin tab is loading.</div>',
  };
  function motionFields() {
    const f = document.getElementById("motion-form"),
      container = document.getElementById("motion-parameters");
    if (!f || !container) return;
    const def = catalog.motionTypes[f.elements.type.value];
    const defaults = {
      duration: 7,
      resourceType: "all",
      newWorldName: "Epochus",
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
  function enhancePage() {
    const workspace = activePanel();
    if (!workspace) return;
    // Every table can scroll within its card, without pushing the entire page sideways.
    for (const table of workspace.querySelectorAll(".table-wrap")) {
      table.tabIndex = 0;
      table.setAttribute("role", "region");
      table.setAttribute("aria-label", "Scrollable data table");
    }
    for (const text of workspace.querySelectorAll("textarea[maxlength]")) {
      const hint = document.createElement("small");
      hint.className = "character-count";
      hint.dataset.countFor = text.name;
      text.after(hint);
    }
    updateCharacterCounts();
    const entries = [...workspace.querySelectorAll("[data-list-item]")];
    if (
      entries.length ||
      (["build", "research", "news", "diplomacy"].includes(currentTab) &&
        (currentTab !== "news" || !articleId))
    ) {
      const key =
        currentTab +
        ":" +
        (currentTab === "build"
          ? category
          : currentTab === "research"
            ? researchCategory
            : currentTab === "world"
              ? forumScope
              : "");
      const value = pageTools[key] || {
        query: "",
        status: "all",
        sort: "default",
      };
      const statuses = {
        all: "All entries",
        ...(currentTab === "build"
          ? {
              available: "Ready to build",
              owned: "Owned",
              locked: "Unavailable",
            }
          : currentTab === "research"
            ? {
                available: "Available",
                active: "In progress",
                completed: "Completed",
                locked: "Locked",
              }
            : currentTab === "news"
              ? {
                  mine: "My articles",
                  ...Object.fromEntries(
                    [...new Set(state.articles.map((a) => a.category))].map(
                      (c) => ["section:" + c, c],
                    ),
                  ),
                }
              : currentTab === "world"
                ? {
                    active: "Voting now",
                    passed: "Passed",
                    failed: "Failed",
                    expired: "Expired",
                  }
                : {
                    allies: "Alliance members",
                    bestFriend: "Best friends",
                    friend: "Friends",
                    neutral: "Neutral",
                    enemy: "Enemies",
                  }),
      };
      const bar = document.createElement("section");
      bar.className = "catalog-tools";
      bar.dataset.toolKey = key;
      bar.innerHTML = `<label class="search-field">Search ${esc(currentTab === "build" ? category : currentTab === "news" ? "the newsroom" : currentTab)}<input type="search" data-catalog-search value="${esc(value.query)}" placeholder="Search by name or description�" autocomplete="off"></label><label>Show<select data-catalog-status>${options(statuses, value.status)}</select></label><label>Sort<select data-catalog-sort>${options({ default: "Recommended order", name: "Name A�Z", ...(currentTab === "build" ? { cost: "Lowest money cost" } : {}) }, value.sort)}</select></label><div class="filter-count" role="status" aria-live="polite"></div>`;
      const parent = entries[0]?.parentElement;
      if (parent) parent.before(bar);
      else workspace.querySelector(".page-heading,.news-masthead")?.after(bar);
      const noResults = document.createElement("div");
      noResults.className = "empty filter-empty";
      noResults.hidden = true;
      noResults.innerHTML =
        "No entries match these filters. <button data-clear-filters>Clear filters</button>";
      bar.after(noResults);
      entries.forEach((entry, index) => {
        entry.dataset.order = index;
      });
      filterCatalog();
    }
    if (currentTab === "nation") {
      const nav = document.createElement("nav");
      nav.className = "sheet-navigation";
      nav.setAttribute("aria-label", "Nation sheet sections");
      const names = [
        "National record",
        "Development",
        "People & quality of life",
        "Budget per turn",
        "Domestic policies",
        "Leader skills",
      ];
      for (const title of names) {
        const h = [...workspace.querySelectorAll("h2,h3")].find(
          (h) => h.textContent === title,
        );
        if (!h) continue;
        h.id = "sheet-" + title.toLowerCase().replace(/[^a-z]+/g, "-");
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = title;
        nav.append(a);
      }
      workspace.querySelector(".page-heading").after(nav);
    }
    for (const button of workspace.querySelectorAll("button[data-action]")) {
      if (button.disabled && !button.title)
        button.title =
          "Requirements or permissions are not met. See the information in this section.";
    }
    if (currentTab === "map") {
      const tile = document.querySelector(
        `[data-map-tile="${selectedTile.join(",")}"]`,
      );
      const shell = document.querySelector(".map-shell");
      if (tile && !shell.scrollLeft) {
        shell.scrollLeft =
          tile.offsetLeft - shell.offsetLeft - shell.clientWidth / 2;
        shell.scrollTop =
          tile.offsetTop - shell.offsetTop - shell.clientHeight / 2;
      }
    }
  }
  function filterCatalog() {
    const bar = document.querySelector(".catalog-tools");
    if (!bar) return;
    const value = {
      query: bar.querySelector("input").value,
      status: bar.querySelector("[data-catalog-status]").value,
      sort: bar.querySelector("[data-catalog-sort]").value,
    };
    pageTools[bar.dataset.toolKey] = value;
    const entries = [...document.querySelectorAll("[data-list-item]")];
    let count = 0;
    for (const entry of entries) {
      const status =
        value.status === "all" ||
        (value.status === "owned" && Number(entry.dataset.owned) > 0) ||
        (value.status.startsWith("section:") &&
          entry.dataset.section === value.status.slice(8)) ||
        entry.dataset.status === value.status;
      entry.hidden = !(status && UI.matches(entry.dataset.search, value.query));
      if (!entry.hidden) count++;
    }
    if (entries.length) {
      const parent = entries[0].parentElement;
      entries
        .sort((a, b) =>
          value.sort === "name"
            ? a
                .querySelector("h2,h3")
                .textContent.localeCompare(b.querySelector("h2,h3").textContent)
            : value.sort === "cost"
              ? Number(a.dataset.moneyCost) - Number(b.dataset.moneyCost)
              : Number(a.dataset.order) - Number(b.dataset.order),
        )
        .forEach((entry) => parent.append(entry));
    }
    bar.querySelector(".filter-count").textContent =
      `${count} of ${entries.length} shown`;
    const empty = document.querySelector(".filter-empty");
    if (empty) empty.hidden = !!count || !entries.length;
  }
  function updateCharacterCounts() {
    const scope = activePanel() || app;
    for (const text of scope.querySelectorAll("textarea[maxlength]")) {
      const hint = text.nextElementSibling;
      if (hint?.classList.contains("character-count"))
        hint.textContent = `${number(text.value.length)} / ${number(text.maxLength)} characters`;
    }
  }
  function formFeedback(f, message, blocked = false) {
    let hint = f.querySelector(".eligibility");
    if (!hint) {
      hint = document.createElement("p");
      hint.className = "eligibility reasons";
      f.append(hint);
    }
    hint.textContent = message;
    const b = f.querySelector('button[type="submit"],.form-footer button');
    if (b) b.disabled = pending || !online || blocked || !f.checkValidity();
  }
  const previewActions = new Set([
    "develop",
    "government",
    "religion",
    "declareWar",
    "attack",
    "tradePropose",
    "proposeMotion",
  ]);
  function previewForm(f) {
    const action = f.dataset.command,
      data = formData(f),
      revision = state.revision;
    const key = JSON.stringify([revision, action, data]);
    const apply = (q) =>
      formFeedback(
        f,
        [
          q.cost ? "Full purchase: " + money(q.cost.money) : "",
          ...q.reasons,
          q.canAct ? "Ready � checked against current world rules" : "",
        ]
          .filter(Boolean)
          .join(" � "),
        !q.canAct,
      );
    if (quoteRevision !== revision) {
      quoteCache.clear();
      quoteRevision = revision;
    }
    clearTimeout(quoteTimers.get(f.getAttribute("id")));
    if (f.closest("details:not([open]),[hidden]")) {
      formFeedback(f, "Open this action to check current availability.", true);
      return;
    }
    if (!f.checkValidity()) {
      formFeedback(f, "Complete the fields using the displayed limits.", true);
      return;
    }
    if (!online || pending) {
      formFeedback(
        f,
        "Waiting for the world connection or current action�",
        true,
      );
      return;
    }
    if (quoteCache.has(key)) {
      apply(quoteCache.get(key));
      return;
    }
    formFeedback(f, "Checking current cost and availability�", true);
    quoteTimers.set(
      f.getAttribute("id"),
      setTimeout(async () => {
        quoteTimers.delete(f.getAttribute("id"));
        if (!f.isConnected) return;
        try {
          const quote = await api("/api/quote", { action, data });
          if (
            !f.isConnected ||
            state.revision !== revision ||
            JSON.stringify([state.revision, action, formData(f)]) !== key
          )
            return;
          if (quote.revision !== state.revision) {
            formFeedback(f, "World updated; refreshing availability�", true);
            receive(await api("/api/state"));
            return;
          }
          if (quoteCache.size >= 100) quoteCache.clear();
          quoteCache.set(key, quote);
          apply(quote);
        } catch (error) {
          if (
            f.isConnected &&
            state.revision === revision &&
            JSON.stringify([revision, action, formData(f)]) === key
          )
            formFeedback(
              f,
              `${error.message} � Change a field or reopen this page to retry.`,
              true,
            );
        }
      }, 300),
    );
  }
  function updateDynamicForms() {
    if (!state) return;
    const scope = activePanel() || app;
    for (const f of scope.querySelectorAll("form[data-command]")) {
      const action = f.dataset.command,
        data = formData(f),
        n = state.nation;
      if (!f.classList.contains("unit-form")) {
        const submit = f.querySelector(".form-footer button");
        if (submit)
          submit.disabled =
            pending ||
            !online ||
            f.dataset.allowed !== "true" ||
            !f.checkValidity();
      }
      if (action === "allianceRole") {
        const alliance = state.alliances.find((a) => a.id === n.allianceId);
        formFeedback(
          f,
          "Choose an available role to change this member�s permissions.",
          alliance?.members[data.target] === data.role,
        );
      }
      if (action === "comment") {
        const article = state.articles.find((a) => a.id === data.id);
        formFeedback(
          f,
          `${article?.comments.length || 0} / 500 comments`,
          !article || article.comments.length >= 500,
        );
      }
      if (action === "article") {
        const recent = state.articles.filter(
          (a) =>
            a.author === n.id &&
            a.createdAt > Date.now() + clockOffset - 3600000,
        ).length;
        formFeedback(
          f,
          `${recent} / 10 articles published this hour`,
          recent >= 10,
        );
      }
      if (action === "manufacture") {
        const recipe = catalog.recipes[data.product],
          valid =
            Number.isSafeInteger(data.amount) &&
            data.amount > 0 &&
            data.amount <= 10000;
        const ingredients = Object.fromEntries(
          Object.entries(recipe.inputs).map(([key, value]) => [
            key,
            value * (valid ? data.amount : 0),
          ]),
        );
        formFeedback(
          f,
          `Requires ${Object.entries(ingredients)
            .map(([key, value]) => number(value) + " " + human(key))
            .join(
              ", ",
            )} � Produces ${number(recipe.output * (valid ? data.amount : 0))} ${human(data.product)}`,
          !valid ||
            !n.improvements.assemblyPlant ||
            Object.entries(ingredients).some(
              ([key, value]) => (n.resources[key] || 0) < value,
            ),
        );
      }
      if (action === "relationship") {
        const q =
          state.diplomacy.relationships[data.target]?.[data.relationship];
        formFeedback(
          f,
          q?.reasons.join(" � ") || "Ready to set relationship",
          !q?.canSet,
        );
      }
      if (action === "teamBet") {
        const match = state.sports.matches.find((m) => m.id === data.matchId);
        formFeedback(
          f,
          "Stakes are paid from your national treasury.",
          !match ||
            match.status !== "scheduled" ||
            match.date <= Date.now() + clockOffset ||
            !n.projects.sportsBetting ||
            state.sports.bets.some((b) => b.matchId === data.matchId) ||
            [match.team1, match.team2].some(
              (id) =>
                state.sports.teams.find((t) => t.id === id)?.nationId === n.id,
            ) ||
            !Number.isSafeInteger(data.amount) ||
            data.amount < 1 ||
            data.amount > 1000000 ||
            data.amount > n.money,
        );
      }
      if (action === "offer") {
        const valid =
            Number.isSafeInteger(data.amount) &&
            data.amount > 0 &&
            data.amount <= 1000000 &&
            Number.isSafeInteger(data.price) &&
            data.price > 0 &&
            data.price <= 1000000000 &&
            Number.isSafeInteger(data.amount * data.price),
          value = valid ? data.amount * data.price : 0;
        const offerLimit =
          state.offers.filter((o) => o.owner === n.id).length >= 100;
        const blocked =
          !valid ||
          offerLimit ||
          n.motionModifiers.embargo.includes(data.resource) ||
          (data.side === "buy"
            ? n.money < value
            : (n.resources[data.resource] || 0) < data.amount);
        formFeedback(
          f,
          valid
            ? `${data.side === "buy" ? "Money" : human(data.resource)} held in escrow: ${data.side === "buy" ? money(value) : number(data.amount)} � Offer value ${money(value)}${blocked ? " � Insufficient stock, funds, or embargo restriction" : ""}`
            : "Enter a positive whole quantity and price.",
          blocked,
        );
      }
      if (["allianceDeposit", "allianceWithdraw"].includes(action)) {
        const available =
          action === "allianceDeposit"
            ? n.money
            : state.alliances.find((a) => a.id === n.allianceId)?.treasury || 0;
        formFeedback(
          f,
          `Available: ${money(available)}`,
          !Number.isSafeInteger(data.amount) ||
            data.amount < 1 ||
            data.amount > available,
        );
      }
      if (action === "aid") {
        const tech = data.type === "tech";
        f.elements.amount.closest("label").hidden = tech;
        const available = tech ? Math.floor(n.tech * 0.2) : n.money;
        const occupied = state.aid.filter(
          (a) =>
            a.from === n.id &&
            ["pending", "accepted", "returning"].includes(a.status),
        ).length;
        formFeedback(
          f,
          `${occupied} / 3 aid slots occupied � ${tech ? number(available) + " technology will be shared" : "Available " + money(available)}`,
          !n.improvements.foreignAffairsOffice ||
            !n.projects.financialAssistanceOffice ||
            occupied >= 3 ||
            (tech
              ? available < 1
              : !Number.isSafeInteger(data.amount) ||
                data.amount < 1 ||
                data.amount > available),
        );
      }
      if (action === "treatyPropose") {
        f.elements.duration.closest("label").hidden = data.type !== "peace";
        const def = catalog.treatyTypes[data.type];
        const reasons = [
          ...(state.diplomacy.treaties[data.target]?.[data.type] || [
            "Choose a treaty",
          ]),
        ];
        if (
          !Number.isSafeInteger(data.compensation) ||
          data.compensation < 0 ||
          data.compensation > 1e9
        )
          reasons.push(
            "Compensation must be a whole amount from 0 to 1 billion",
          );
        if (
          data.type === "peace" &&
          (!Number.isSafeInteger(data.duration) ||
            data.duration < 1 ||
            data.duration > 30)
        )
          reasons.push("Peace duration must be 1�30 real days");
        formFeedback(
          f,
          [def.description, ...reasons].join(" � "),
          !!reasons.length,
        );
      }
      if (["government", "religion"].includes(action)) {
        const definitions =
            action === "government" ? catalog.governments : catalog.religions,
          def = definitions[data.value];
        if (def) {
          const p = f.querySelector("p.muted");
          if (p) p.textContent = def.description;
          const preview = f.querySelector("[data-choice-image]");
          if (preview)
            preview.innerHTML = icon(
              action === "government" ? "Government" : "Religion",
              data.value,
              "portrait-icon",
            );
          const details = f.querySelector("details");
          if (details)
            details.innerHTML = `<summary>Benefits & deductions</summary>${list(UI.choiceEffects(def, action))}`;
        }
      }
    }
    for (const f of scope.querySelectorAll("form[data-command]")) {
      if (previewActions.has(f.dataset.command)) previewForm(f);
    }
    for (const b of scope.querySelectorAll('[data-action="acceptOffer"]')) {
      const offer = state.offers.find(
        (o) => o.id === JSON.parse(b.dataset.payload).id,
      );
      const q = offer?.acceptance;
      b.disabled = pending || !online || !q?.canAct;
      b.title = q?.canAct
        ? "Required, including tariff: " +
          Object.entries(q.cost)
            .map(([k, v]) =>
              k === "money" ? money(v) : number(v) + " " + human(k),
            )
            .join(", ")
        : q?.reasons.join(" � ") || "Offer unavailable";
    }
    updateDeadlineButtons();
  }
  function updateDeadlineButtons() {
    const now = Date.now() + clockOffset;
    const scope = activePanel() || app;
    for (const b of scope.querySelectorAll('[data-action="vote"]')) {
      const m = state.motions.find(
        (m) => m.id === JSON.parse(b.dataset.payload).id,
      );
      b.disabled =
        pending ||
        !online ||
        !m ||
        m.status !== "faction_voting" ||
        m.endsAt <= now ||
        !!m.votes[state.nation.id] ||
        now - state.nation.factionJoinedAt < 86400000;
    }
    const f = document.getElementById("election-form");
    if (f) {
      const data = formData(f),
        c = state.congress[state.nation.factionKey];
      const eligible =
        state.election.status === "voting" &&
        state.election.endsAt > now &&
        state.nation.projects.broadcasting &&
        now - state.nation.factionJoinedAt >= 86400000;
      formFeedback(
        f,
        `Select 1�${c.seats} eligible candidates while voting is open.`,
        !eligible ||
          !data.targets.length ||
          data.targets.length > c.seats ||
          new Set(data.targets).size !== data.targets.length ||
          data.targets.some((id) => !c.eligible.includes(id)),
      );
    }
  }
  function selectMapTile(x, y, focus = false) {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      Math.abs(x) > 25 ||
      Math.abs(y) > 25
    )
      return;
    selectedTile = [x, y];
    render();
    const tile = document.querySelector(`[data-map-tile="${x},${y}"]`);
    if (focus) tile?.focus({ preventScroll: true });
    tile?.scrollIntoView({ block: "nearest", inline: "nearest" });
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
    if (target.hasAttribute("data-clear-filters")) {
      const bar = document.querySelector(".catalog-tools");
      bar.querySelector("input").value = "";
      bar.querySelector("[data-catalog-status]").value = "all";
      filterCatalog();
      return;
    }
    if (target.dataset.helpTopic) {
      const topic = target.dataset.helpTopic;
      helpQuery = "";
      draftsByRoute.delete("help:");
      document.querySelector('[data-tab="help"]').click();
      const section = document.getElementById(`help-${topic}`);
      if (section) {
        section.open = true;
        section.querySelector("summary").focus();
        section.scrollIntoView({ block: "start" });
      }
      return;
    }
    if (target.dataset.jumpTab) {
      document.querySelector(`[data-tab="${target.dataset.jumpTab}"]`).click();
      return;
    }
    if (target.hasAttribute("data-preview-article")) {
      const f = document.getElementById("article-form"),
        data = formData(f);
      await confirmAction(
        "Article preview",
        `<div class="eyebrow">${esc(data.category)}</div><h2 class="section">${esc(data.title || "Untitled article")}</h2><div class="article-meta">By ${esc(state.nation.name)}</div><div class="article-body">${esc(data.body || "Your article text will appear here.")}</div>`,
        "Back to editor",
      );
      return;
    }
    if (target.dataset.recipient) {
      saveDraft();
      privateRecipient = target.dataset.recipient;
      render(false);
      const scope = activePanel() || app;
      [...scope.querySelectorAll("[data-recipient]")]
        .find((b) => b.dataset.recipient === privateRecipient)
        ?.focus({ preventScroll: true });
      return;
    }
    if (target.dataset.mapTile) {
      const [x, y] = target.dataset.mapTile.split(",").map(Number);
      const id = state.territories[`${x},${y}`];
      if (id && id !== n.id) {
        // Toggle nation view when clicking an owned tile
        mapToggleType = "nation";
        mapToggleTarget = id;
        selectedTile = [x, y];
        render();
        return;
      }
      selectMapTile(x, y, true);
      return;
    }
    if (target.dataset.mapToggleClose) {
      mapToggleType = null;
      mapToggleTarget = null;
      render();
      return;
    }
    if (target.dataset.mapToggleCurrency) {
      mapToggleType = "currency";
      mapToggleTarget = target.dataset.mapToggleCurrency;
      render();
      return;
    }
    if (target.dataset.action === "openNationToggle") {
      mapToggleType = "nation";
      mapToggleTarget = target.dataset.target;
      render();
      return;
    }
    if (target.dataset.action === "openAllianceToggle") {
      mapToggleType = "alliance";
      mapToggleTarget = target.dataset.target;
      render();
      return;
    }
    if (target.dataset.action === "declareWar") {
      openModal("declareWar", null);
      return;
    }
    if (target.dataset.action === "proposeTreaty") {
      openModal("proposeTreaty", null);
      return;
    }
    if (target.dataset.action === "launchAttack") {
      openModal("launchAttack", null);
      return;
    }
    if (target.dataset.action === "openMessage") {
      messageChannel = "private";
      privateRecipient = target.dataset.target;
      render(false);
      return;
    }
    if (target.dataset.action === "setRelationship") {
      await command("relationship", {
        target: target.dataset.target,
        type: target.dataset.type,
      });
      render(false);
      return;
    }
    if (target.dataset.mapZoom) {
      mapZoom = Math.max(
        16,
        Math.min(40, mapZoom + Number(target.dataset.mapZoom)),
      );
      render();
      return;
    }
    if (target.hasAttribute("data-map-home")) {
      const key = state.nation.territories[0] || "0,0";
      selectMapTile(...key.split(",").map(Number), true);
      return;
    }
    if (target.dataset.tab) {
      saveDraft();
      switchTab(target.dataset.tab);
      return;
    }
    if (target.dataset.subTab) {
      state.userSubTab = target.dataset.subTab;
      render();
      return;
    }
    if (target.id === "pop-dropdown-btn") {
      popDropdownOpen = !popDropdownOpen;
      const dd = document.getElementById("pop-dropdown");
      const btn = document.getElementById("pop-dropdown-btn");
      if (dd) dd.classList.toggle("hidden", !popDropdownOpen);
      if (btn) btn.setAttribute("aria-expanded", String(popDropdownOpen));
      return;
    }
    if (target.id === "account-trigger" || target.closest("#account-trigger")) {
      accountMenuOpen = !accountMenuOpen;
      const menu = document.getElementById("account-menu");
      const trigger = document.getElementById("account-trigger");
      if (menu) menu.classList.toggle("hidden", !accountMenuOpen);
      if (trigger) trigger.setAttribute("aria-expanded", String(accountMenuOpen));
      return;
    }
    if (target.id === "notification-trigger" || target.closest("#notification-trigger")) {
      notificationsOpen = !notificationsOpen;
      const list = document.getElementById("notification-list");
      const trigger = document.getElementById("notification-trigger");
      const badge = document.getElementById("notification-badge");
      if (list) list.classList.toggle("hidden", !notificationsOpen);
      if (trigger) trigger.setAttribute("aria-expanded", String(notificationsOpen));
      if (badge) badge.classList.add("hidden");
      return;
    }
    if (target.id === "account-menu-settings") {
      accountMenuOpen = false;
      document.getElementById("account-menu")?.classList.add("hidden");
      openModal("settings");
      return;
    }
    if (target.id === "account-menu-skills") {
      accountMenuOpen = false;
      document.getElementById("account-menu")?.classList.add("hidden");
      openModal("playerSkill");
      return;
    }
    if (target.id === "account-menu-bugreport") {
      accountMenuOpen = false;
      document.getElementById("account-menu")?.classList.add("hidden");
      openModal("bugReport");
      return;
    }
    if (target.id === "notification-clear") {
      notificationsOpen = false;
      document.getElementById("notification-list")?.classList.add("hidden");
      return;
    }
    if (target.dataset.action === "openSituation") {
      notificationsOpen = false;
      document.getElementById("notification-list")?.classList.add("hidden");
      const situationId = target.dataset.situationId;
      const situationType = target.dataset.situationType;
      const definitionId = target.dataset.definitionId;
      const situation = state.notifications?.find((n) => n.id === situationId) || {
        id: situationId,
        situationType,
        definitionId,
        title: "Situation",
        description: "",
      };
      openModal("situation", situation);
      return;
    }
    if (target.dataset.view) {
      saveDraft();
      const { view, value } = target.dataset;
      if (view === "auth") authMode = value;
      if (view === "build") category = value;
      if (view === "research") researchCategory = value;
      if (view === "forum") forumScope = value;
      if (view === "worldView") worldView = value;
      if (view === "article") articleId = value || null;
      if (view === "messages") messageChannel = value;
      if (view === "tradeView") tradeView = value;
      if (view === "sport") teamSport = value;
      if (view === "allianceSubtab") sessionStorage.setItem("allianceSubtab", value);
      render(false);
      const scope = activePanel() || app;
      const nextControl = [...scope.querySelectorAll("[data-view]")].find(
        (b) => b.dataset.view === view && b.dataset.value === value,
      );
      (nextControl || document.getElementById("workspace"))?.focus({
        preventScroll: true,
      });
      return;
    }
    if (target.dataset.action === "openSkills") {
      openModal("playerSkill");
      return;
    }
    if (target.dataset.action === "openEditNation") {
      openModal("editNation");
      return;
    }
    if (target.dataset.action === "openLoanModal") {
      openModal("loan");
      return;
    }
    if (target.dataset.action === "openFundDiseaseCure") {
      openModal("fundDiseaseCure");
      return;
    }
    if (target.dataset.action === "openCurrencyInvest") {
      currencyInvestCurrency = JSON.parse(target.dataset.payload).currency;
      openModal("currencyInvest");
      return;
    }
    if (target.dataset.action === "openLotteryPicker") {
      openModal("lotteryPicker");
      return;
    }
    if (target.dataset.action === "openProposeMotion") {
      proposeMotionScope = JSON.parse(target.dataset.payload).scope;
      openModal("proposeMotion");
      return;
    }
    if (target.dataset.action === "openTeamDraft") {
      teamDraftSport = JSON.parse(target.dataset.payload).sport;
      openModal("teamDraft");
      return;
    }
    if (target.dataset.action === "openTeamPlayer") {
      const d = JSON.parse(target.dataset.payload);
      teamPlayerSport = d.sport;
      teamPlayerId = d.playerId;
      teamPlayerTab = d.tab || "profile";
      openModal("teamPlayer");
      return;
    }
    if (target.dataset.action === "openTeamStadium") {
      teamStadiumSport = JSON.parse(target.dataset.payload).sport;
      openModal("teamStadium");
      return;
    }
    if (target.dataset.action === "openFortuneModal") {
      const d = JSON.parse(target.dataset.payload || '{}');
      modalFortuneGame = d.game;
      openModal("fortune");
      return;
    }
    if (target.dataset.action === "closeFortuneModal") {
      closeModal();
      return;
    }
    if (target.dataset.action && target.dataset.action.startsWith("fortune:")) {
      const [, game, action] = target.dataset.action.split(":");
      const payload = JSON.parse(target.dataset.payload || '{}');
      const result = await fortuneApi(game, action, payload);
      if (game === "wheel" && action === "spin" && result && result.ok && result.physics) {
        window.WheelModalAnimate(result.physics, result.slice);
      }
      if (game === "wheel" && action === "stop" && result && result.ok) {
        window.WheelModalStop();
      }
      if (game === "scratchOff" && result && result.ok) {
        if (action === "buyCard") {
          await window.ScratchOffModalHandlers.buyCard(payload.cardType);
        } else if (action === "revealTile") {
          await window.ScratchOffModalHandlers.revealTile(payload.cardId, payload.tileIndex);
        } else if (action === "claimPrize") {
          await window.ScratchOffModalHandlers.claimPrize(payload.cardId);
        } else if (action === "autoScratch") {
          await window.ScratchOffModalHandlers.autoScratch(payload.cardId);
        }
        if (modalMode === "fortune" && modalFortuneGame === "scratchOff") renderModal();
      }
      if (game === "keno" && result && result.ok) {
        if (action === "togglePet") {
          await window.KenoModalHandlers.togglePet(payload.pet);
        } else if (action === "autoSelect") {
          await window.KenoModalHandlers.autoSelect(payload.count);
        } else if (action === "clear") {
          await window.KenoModalHandlers.clear();
        } else if (action === "buyTicket") {
          await window.KenoModalHandlers.buyTicket(payload.bet);
        }
        if (modalMode === "fortune" && modalFortuneGame === "keno") renderModal();
      }
      if (game === "blackjack" && result && result.ok) {
        if (action === "joinTable") {
          await window.BlackjackModalHandlers.joinTable();
        } else if (action === "placeBet") {
          await window.BlackjackModalHandlers.placeBet(payload.amount);
        } else if (action === "rebet") {
          await window.BlackjackModalHandlers.rebet();
        } else if (action === "dealInitial") {
          await window.BlackjackModalHandlers.dealInitial();
        } else if (action === "hit") {
          await window.BlackjackModalHandlers.hit();
        } else if (action === "stand") {
          await window.BlackjackModalHandlers.stand();
        } else if (action === "doubleDown") {
          await window.BlackjackModalHandlers.doubleDown();
        } else if (action === "split") {
          await window.BlackjackModalHandlers.split();
        } else if (action === "surrender") {
          await window.BlackjackModalHandlers.surrender();
        } else if (action === "leaveTable") {
          await window.BlackjackModalHandlers.leaveTable();
        } else if (action === "refresh") {
          await window.BlackjackModalHandlers.refresh();
        }
        if (modalMode === "fortune" && modalFortuneGame === "blackjack") renderModal();
      }
      if (game === "gamblerDice" && result && result.ok) {
        if (action === "joinTable") {
          await window.GamblerDiceModalHandlers.joinTable();
        } else if (action === "placeBet") {
          await window.GamblerDiceModalHandlers.placeBet();
        } else if (action === "rollDice") {
          await window.GamblerDiceModalHandlers.rollDice();
        } else if (action === "passDice") {
          await window.GamblerDiceModalHandlers.passDice();
        } else if (action === "leaveTable") {
          await window.GamblerDiceModalHandlers.leaveTable();
        } else if (action === "refresh") {
          await window.GamblerDiceModalHandlers.refresh();
        } else if (action === "setDieSize") {
          await window.GamblerDiceModalHandlers.setDieSize(payload.dieSize);
        } else if (action === "setDiceCount") {
          await window.GamblerDiceModalHandlers.setDiceCount(payload.diceCount);
        } else if (action === "setDiceStyle") {
          await window.GamblerDiceModalHandlers.setDiceStyle(payload.diceStyle);
        } else if (action === "getBetMenu") {
          await window.GamblerDiceModalHandlers.getBetMenu(payload.dieSize, payload.diceCount);
        }
        if (modalMode === "fortune" && modalFortuneGame === "gamblerDice") renderModal();
      }
      if (game === "tarot" && result && result.ok) {
        if (action === "shuffle") {
          await window.TarotModalHandlers.shuffle();
        } else if (action === "deal") {
          await window.TarotModalHandlers.deal();
        } else if (action === "new") {
          await window.TarotModalHandlers.newReading();
        } else if (action === "setType") {
          await window.TarotModalHandlers.setType(payload.type);
        } else if (action === "setMode") {
          await window.TarotModalHandlers.setMode(payload.mode);
        }
        if (modalMode === "fortune" && modalFortuneGame === "tarot") renderModal();
      }
      return;
    }
    if (target.dataset.action === "teamStarter") {
      const d = JSON.parse(target.dataset.payload);
      const select = target.closest(".lineup-slot")?.querySelector("select");
      const playerId = select ? select.value : (d.playerId || "");
      if (!playerId) return notice("Select a player for this position first.", true);
      await command("teamStarter", { sport: d.sport, slot: d.slot, playerId });
      return;
    }
    if (target.dataset.action === "teamSetSub") {
      const d = JSON.parse(target.dataset.payload);
      if (d.add === true || d.add === "true") {
        const select = target.closest(".lineup-slot")?.querySelector("select");
        const playerId = select ? select.value : "";
        if (!playerId) return notice("Select a player to add as a sub first.", true);
        d.playerId = playerId;
      }
      if (!d.playerId) return notice("Select a player first.", true);
      await command("teamSetSub", d);
      return;
    }
    if (target.dataset.action === "fundDiseaseCure") {
      const f = document.getElementById("fund-disease-form");
      const amount = Number(f?.elements.amount?.value || 0);
      if (!amount || amount <= 0) return;
      await command("fundDiseaseCure", { amount });
      return;
    }
    if (target.dataset.action === "currencyInvest") {
      const f = document.getElementById("currency-invest-form");
      const currencyKey = currencyInvestCurrency;
      const buy = Number(f?.elements.buy?.value || 0);
      const sell = Number(f?.elements.sell?.value || 0);
      if (!currencyKey || (!buy && !sell)) return;
      if (buy > 0) await command("currencyBuy", { currencyKey, points: buy });
      else if (sell > 0) await command("currencySell", { currencyKey, points: sell });
      return;
    }
    if (target.dataset.action === "worldBankLoan") {
      const f = document.getElementById("loan-modal-form");
      const amount = Number(f?.elements.amount?.value || 0);
      if (!amount || amount <= 0) return;
      await command("worldBankLoan", { amount });
      return;
    }
    if (target.dataset.action === "lotteryPurchaseCustom") {
      const f = document.getElementById("lottery-picker-form");
      const count = Number(f?.elements.count?.value || 0);
      const picks = [];
      for (let i = 0; i < count; i++) {
        const nums = [];
        for (let k = 1; k <= 5; k++) nums.push(f.elements[`pick${i}-n${k}`]?.value);
        const mult = f.elements[`pick${i}-m`]?.value;
        const allSix = [...nums, mult];
        if (new Set(allSix).size !== 6) return notice("All 6 pets must be unique", true);
        picks.push({ numbers: nums, multiplier: mult });
      }
      await command("lotteryPurchase", { count, ticketPicks: picks });
      return;
    }
    if (target.dataset.action === "proposeMotion") {
      const f = document.getElementById("world-propose-motion-form");
      const data = formData(f);
      data.parameters = {};
      for (const [key, value] of Object.entries(data))
        if (key.startsWith("param-")) {
          data.parameters[key.slice(6)] = value;
          delete data[key];
        }
      await command("proposeMotion", data);
      return;
    }
    if (target.dataset.action === "lotteryQuickPick") {
      const { index } = JSON.parse(target.dataset.payload);
      const f = document.getElementById("lottery-picker-form");
      if (!f) return;
      const icons = window.PET_ICONS_UNIQUE || [];
      const shuffled = [...icons].sort(() => 0.5 - Math.random());
      const picks = shuffled.slice(0, 6);
      for (let k = 1; k <= 5; k++) {
        const el = f.elements[`pick${index}-n${k}`];
        if (el) el.value = picks[k - 1];
      }
      const m = f.elements[`pick${index}-m`];
      if (m) m.value = picks[5];
      return;
    }
    if (target.dataset.action === "lotteryPurchaseQuick") {
      const f = document.getElementById("lottery-form");
      const count = Number(f?.elements.count?.value || 1);
      if (!count || count < 1) return;
      await command("lotteryPurchase", { count });
      return;
    }
    if (target.dataset.action === "newsCreate") {
      newsModalArticle = null;
      newsModalArticleId = null;
      newsReactionDraft = null;
      modalMode = "newsEditor";
      renderModal();
      initNewsEditor();
      return;
    }
    if (target.dataset.action === "newsEdit") {
      const { id } = JSON.parse(target.dataset.payload);
      newsModalArticle = state.articles.find((a) => a.id === id) || null;
      newsModalArticleId = id;
      newsReactionDraft = null;
      modalMode = "newsEditor";
      renderModal();
      initNewsEditor();
      return;
    }
    if (target.dataset.action === "newsDelete") {
      const { id } = JSON.parse(target.dataset.payload);
      const confirmed = await confirmCommand("newsArticleDelete", { id });
      if (!confirmed) return;
      await command("deleteArticle", { id });
      return;
    }
    if (target.dataset.action === "newsReact") {
      const { id } = JSON.parse(target.dataset.payload);
      const article = state.articles.find((a) => a.id === id);
      if (!article) return;
      newsModalArticleId = id;
      newsModalCommentId = null;
      newsModalTargetType = "article";
      newsReactionDraft = article.reactions?.[state.nation.id] || {
        sentiment: null,
        reaction: null,
        emojis: {},
      };
      modalMode = "newsReaction";
      renderModal();
      return;
    }
    if (target.dataset.action === "newsCommentReact") {
      const { articleId, commentId } = JSON.parse(target.dataset.payload);
      const article = state.articles.find((a) => a.id === articleId);
      const comment = article && article.comments.find((c) => c.id === commentId);
      if (!comment) return;
      newsModalArticleId = articleId;
      newsModalCommentId = commentId;
      newsModalTargetType = "comment";
      newsReactionDraft = comment.reactions?.[state.nation.id] || {
        sentiment: null,
        reaction: null,
        emojis: {},
      };
      modalMode = "newsReaction";
      renderModal();
      return;
    }
    if (target.dataset.action === "newsCommentReact") {
      const { articleId, commentId } = JSON.parse(target.dataset.payload);
      const article = state.articles.find((a) => a.id === articleId);
      const comment = article && article.comments.find((c) => c.id === commentId);
      if (!comment) return;
      newsModalArticleId = articleId;
      newsModalCommentId = commentId;
      newsReactionDraft = comment.reactions?.[state.nation.id] || {
        sentiment: null,
        reaction: null,
        emojis: {},
      };
      modalMode = "newsReaction";
      renderModal();
      return;
    }
    if (target.dataset.action === "newsEditComment") {
      const { commentId } = JSON.parse(target.dataset.payload);
      let foundArticleId = null;
      let comment = null;
      for (const a of state.articles) {
        const c = a.comments.find((x) => x.id === commentId);
        if (c) {
          foundArticleId = a.id;
          comment = c;
          break;
        }
      }
      if (!comment) return;
      newsModalArticleId = foundArticleId;
      newsModalCommentId = commentId;
      newsReactionDraft = null;
      modalMode = "newsComment";
      renderModal();
      return;
    }
    /* ════════════════════════════════════════════════════════════════════
       NATION TAB ACTIONS
       ══════════════════════════════════════════════════════════════════ */

    if (target.dataset.action === "openFlagModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.flagModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openFlagDesigner") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.flagDesignerModalContent(state);
      if (!dlg.open) dlg.showModal();
      // Initialize FlagDesigner after the modal is rendered
      if (window.FlagDesigner) {
        const root = document.getElementById("flag-designer-root");
        if (root && !root.querySelector('.flag-designer')) {
          const designer = new window.FlagDesigner();
          root.appendChild(designer.element);
          // Load current flag data if it exists
          if (state.nation.flag) {
            designer.loadFlagData(state.nation.flag);
          }
          // Store designer instance on the dialog for save
          dlg._flagDesigner = designer;
        }
      }
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "editNationName") {
      const name = prompt("Enter new nation name:", state.nation.name);
      if (name && name.trim()) {
        await command("identity", {
          capital: state.nation.capitalCity,
          motto: state.nation.motto,
          name: name.trim(),
        });
      }
      return;
    }
    if (target.dataset.action === "editRulerName") {
      const name = prompt("Enter new ruler name:", state.nation.leader);
      if (name && name.trim()) {
        await command("identity", {
          capital: state.nation.capitalCity,
          motto: state.nation.motto,
          leader: name.trim(),
        });
      }
      return;
    }
    if (target.dataset.action === "openGovModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.govReligionModalContent(state, "government");
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openRelModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.govReligionModalContent(state, "religion");
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openCultureModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.cultureModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openDevelopModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.developModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openGovRelModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.govReligionModalContent(state, "government");
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openStatsModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.statsModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "developLand") {
      const amt = Number(document.querySelector('input[name="devLandAmount"]')?.value || 1);
      if (!amt || amt < 1) return;
      await command("develop", { kind: "land", amount: amt });
      return;
    }
    if (target.dataset.action === "developInfra") {
      const amt = Number(document.querySelector('input[name="devInfraAmount"]')?.value || 1);
      if (!amt || amt < 1) return;
      await command("develop", { kind: "infra", amount: amt });
      return;
    }
    if (target.dataset.action === "developTech") {
      const amt = Number(document.querySelector('input[name="devTechAmount"]')?.value || 1);
      if (!amt || amt < 1) return;
      await command("develop", { kind: "tech", amount: amt });
      return;
    }
    if (target.dataset.action === "openBuildModal") {
      const cat = target.dataset.buildCat || "improvements";
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.buildModalContent(state, cat);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openUnitsModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.unitsModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openEdictsModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.edictsModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openDiplomacyModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.diplomacyModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openPopDetailedModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.populationDetailedModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    /* ═══════════════════════════════════════════════════════════════════════════
       ALLIANCE TAB MODALS
       ══════════════════════════════════════════════════════════════════════════ */
    if (target.dataset.action === "openAllianceCreateModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = AllianceModals.allianceCreateModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openAllianceSettingsModal") {
      const dlg = document.getElementById("nation-dialog");
      const alliance = state.alliances?.find((x) => x.id === state.nation.allianceId);
      dlg.innerHTML = AllianceModals.allianceSettingsModalContent(state, alliance);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openAllianceSkillsModal") {
      const dlg = document.getElementById("nation-dialog");
      const alliance = state.alliances?.find((x) => x.id === state.nation.allianceId);
      dlg.innerHTML = AllianceModals.allianceSkillsModalContent(state, alliance);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openAllianceMemberModal") {
      const dlg = document.getElementById("nation-dialog");
      const alliance = state.alliances?.find((x) => x.id === state.nation.allianceId);
      dlg.innerHTML = AllianceModals.allianceMemberBreakdownModalContent(state, alliance);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "openDiseaseModal") {
      const dlg = document.getElementById("nation-dialog");
      dlg.innerHTML = NationModals.diseaseModalContent(state);
      if (!dlg.open) dlg.showModal();
      return;
    }
    if (target.dataset.action === "toggleStatsDetails" ||
        target.dataset.action === "toggleGovRelDetails" ||
        target.dataset.action === "toggleCultureDetails") {
      // Details are shown inline; just render to refresh
      render(false);
      return;
    }
    if (target.dataset.action === "save-flag") {
      const dlg = document.getElementById("nation-dialog");
      const fileInput = dlg.querySelector('input[name="flagFile"]');
      const file = fileInput?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          await command("setFlag", { type: "uploaded", data: reader.result, name: file.name });
          dlg.close();
          render(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Check for flag builder design
        const stripeCount = dlg.querySelector('select[name="stripeCount"]')?.value;
        const stripeOrientation = dlg.querySelector('select[name="stripeOrientation"]')?.value;
        if (stripeCount && stripeOrientation) {
          await command("setFlag", { type: "designed", stripeCount, stripeOrientation });
          dlg.close();
          render(false);
        }
      }
      return;
    }
    if (target.dataset.action === "flagDesignerSave") {
      const dlg = document.getElementById("nation-dialog");
      const designer = dlg._flagDesigner;
      if (!designer) {
        alert("Flag designer not initialized.");
        return;
      }
      const flagData = designer.getFlagData();
      if (flagData.type === 'uploaded') {
        await command("setFlag", { type: "uploaded", data: flagData.data, name: "custom-flag.png" });
      } else {
        const d = flagData.data;
        await command("setFlag", {
          type: "designed",
          stripeCount: 1,
          stripeOrientation: "horizontal",
          background: d.background,
          pattern1: d.pattern1,
          pattern1Color: d.pattern1Color,
          pattern2: d.pattern2,
          pattern2Color: d.pattern2Color,
          symbol: d.symbol,
          symbolColor: d.symbolColor,
          symbolSize: d.symbolSize,
          layers: d.layers,
        });
      }
      dlg.close();
      render(false);
      return;
    }
    if (target.dataset.action === "save-government") {
      const dlg = document.getElementById("nation-dialog");
      const selected = dlg.querySelector('.govrel-option.current')?.dataset.key;
      if (selected) {
        await command("government", { value: selected });
        dlg.close();
        render(false);
      }
      return;
    }
    if (target.dataset.action === "save-religion") {
      const dlg = document.getElementById("nation-dialog");
      const selected = dlg.querySelector('.govrel-option.current')?.dataset.key;
      if (selected) {
        await command("religion", { value: selected });
        dlg.close();
        render(false);
      }
      return;
    }
    if (target.dataset.action === "save-culture") {
      const dlg = document.getElementById("nation-dialog");
      const food = dlg.querySelector('input[name="nationalFood"]:checked')?.value;
      const water = dlg.querySelector('input[name="nationalWater"]:checked')?.value;
      const pet = dlg.querySelector('input[name="nationalPet"]:checked')?.value;
      const updates = [];
      if (food !== undefined) updates.push(command("nationalFood", { value: food }));
      if (water !== undefined) updates.push(command("nationalWater", { value: water }));
      if (pet && pet !== "none") updates.push(command("setNationalPet", { petIcon: pet }));
      await Promise.all(updates);
      dlg.close();
      render(false);
      return;
    }
    if (target.dataset.action === "save-edicts") {
      const n = state.nation;
      if (!n.improvementEffects?.canSetPolicies) {
        const dlg = document.getElementById("nation-dialog");
        dlg.innerHTML = '<div class="locked">Internal Affairs Office required to set edicts. Build it in the Build tab.</div><button value="close">Close</button>';
        return;
      }
      const dlg = document.getElementById("nation-dialog");
      const edicts = {};
      dlg.querySelectorAll('input[name^="edict-"]:checked').forEach((inp) => {
        const cat = inp.name.replace("edict-", "");
        edicts[cat] = inp.value;
      });
      await command("setEdicts", { edicts });
      dlg.close();
      render(false);
      return;
    }
    if (target.dataset.action === "setRelation") {
      const payload = JSON.parse(target.dataset.payload);
      await command("relationship", { target: payload.target, relationship: payload.relationship });
      const dlg = document.getElementById("nation-dialog");
      if (dlg && dlg.open) {
        dlg.innerHTML = NationModals.diplomacyModalContent(state);
      }
      return;
    }
    if (target.dataset.action === "cureDisease") {
      const payload = JSON.parse(target.dataset.payload);
      await command("cureDisease", { outbreakId: payload.outbreakId });
      const dlg = document.getElementById("nation-dialog");
      if (dlg && dlg.open) {
        dlg.innerHTML = NationModals.diseaseModalContent(state);
      }
      return;
    }

    /* ── Modal tab switching ── */
    if (target.dataset.popTab) {
      const dlg = document.getElementById("nation-dialog");
      dlg.querySelectorAll(".pop-tab").forEach((b) => b.classList.remove("active"));
      dlg.querySelectorAll(".pop-tab-panel").forEach((p) => p.classList.remove("active"));
      target.classList.add("active");
      const panel = dlg.querySelector(`#pop-tab-${target.dataset.popTab}`);
      if (panel) panel.classList.add("active");
      return;
    }
    if (target.dataset.buildCat) {
      const dlg = document.getElementById("nation-dialog");
      const cat = target.dataset.buildCat;
      dlg.innerHTML = NationModals.buildModalContent(state, cat);
      return;
    }

    /* ── Gov/Rel option selection ── */
    if (target.closest(".govrel-option")) {
      const dlg = document.getElementById("nation-dialog");
      dlg.querySelectorAll(".govrel-option").forEach((o) => o.classList.remove("current"));
      target.closest(".govrel-option").classList.add("current");
      return;
    }

    /* ── Culture item selection ── */
    if (target.closest(".culture-item")) {
      const dlg = document.getElementById("nation-dialog");
      dlg.querySelectorAll(".culture-item").forEach((o) => o.classList.remove("selected"));
      target.closest(".culture-item").classList.add("selected");
      const radio = target.closest(".culture-item").querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      return;
    }

    /* ════════════════════════════════════════════════════════════════════
       WARS TAB ACTIONS
       ═══════════════════════════════════════════════════════════════════ */

    if (target.dataset.action === "warBack") {
      window.warsCurrentWarId = null;
      window.warsStatRank = "damage";
      render(false);
      return;
    }
    if (target.dataset.action === "warWatch") {
      const { id } = JSON.parse(target.dataset.payload);
      window.warsCurrentWarId = id;
      window.warsStatRank = "damage";
      render(false);
      return;
    }
    if (target.dataset.action === "warAttack") {
      const { id: warId, target: targetId } = JSON.parse(target.dataset.payload);
      const tSelect = document.getElementById("warAttackTarget");
      const finalTarget = tSelect ? tSelect.value : targetId;
      if (!finalTarget) return notice("Select a target nation", true);
      await command("attack", { id: warId, target: finalTarget, type: "conventional" });
      return;
    }
    if (target.dataset.action === "warLaunch") {
      const { id: warId, target: targetId, type } = JSON.parse(target.dataset.payload);
      const tSelect = document.getElementById("warAttackTarget");
      const finalTarget = tSelect ? tSelect.value : targetId;
      if (!finalTarget) return notice("Select a target nation", true);

      // Track spy damage client-side before the server updates state
      // (spy damage is not reported per-nation in war.damage by the server)
      if (type === "spies") {
        const n = state.nation;
        const spyCount = n.militaryUnits?.spies || 0;
        const intuition = state.player?.currentIntuition || 0;
        const baseDamage = Math.floor(spyCount * 5 + intuition * 2);
        const estimatedDamage = Math.max(50, baseDamage);
        if (typeof window.warSpyDamage !== "undefined") {
          window.WarModals.addSpyDamage(warId, n.id, estimatedDamage);
        }
      }

      await command("attack", { id: warId, target: finalTarget, type });
      return;
    }
    if (target.dataset.action === "warJoin") {
      const { id: warId, side } = JSON.parse(target.dataset.payload);
      await command("joinWar", { id: warId, side });
      return;
    }
    if (target.dataset.action === "warFilter") {
      const cat = target.dataset.warFilter;
      window.warsFilter = cat;
      render(false);
      return;
    }
    if (target.dataset.action === "warStat") {
      const stat = target.dataset.warStat;
      window.warsStatRank = stat;
      render(false);
      return;
    }

    /* ════════════════════════════════════════════════════════════════════ */

    if (target.dataset.action) {
      await command(target.dataset.action, JSON.parse(target.dataset.payload));
      return;
    }

    /* ═══════════════════════════════════════════════════════════════════ */

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
    if (target.id === "music-resume") {
      music.resume();
      return;
    }
    if (target.id === "logout") {
      try {
        await api("/api/logout", {});
        stream?.close();
        state = null;
        syncMusic();
        draftsByRoute.clear();
        online = true;
        render(false);
      } catch (error) {
        notice(error.message, true);
      }
    }
  });
  app.addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-editor]")) event.preventDefault();
  });
  app.addEventListener(
    "toggle",
    (event) => {
      if (event.target.matches("details") && event.target.open)
        updateDynamicForms();
    },
    true,
  );
  app.addEventListener("input", (event) => {
    if (event.target.form?.getAttribute("id") === "music-form") {
      saveMusicPreferences();
      return;
    }
    if (event.target.id === "help-search") filterHelp();
    if (event.target.closest(".unit-form")) updateUnitButtons();
    if (event.target.matches("[data-catalog-search]")) filterCatalog();
    if (event.target.id === "warFilterType") {
      window.warsFilterType = event.target.value;
      window.warsFilterValue = "";
      render(false);
      return;
    }
    updateCharacterCounts();
    if (
      event.target.form?.dataset.command &&
      !event.target.closest(".unit-form")
    )
      updateDynamicForms();
  });
  app.addEventListener("keydown", (event) => {
    if (!event.target.matches("[data-map-tile]")) return;
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (delta) {
      event.preventDefault();
      selectMapTile(
        selectedTile[0] + delta[0],
        selectedTile[1] + delta[1],
        true,
      );
    }
  });
  app.addEventListener("change", (event) => {
    if (
      ["rankingMetric", "rankingPeriod", "rankingMode"].includes(
        event.target.name,
      )
    ) {
      if (event.target.name === "rankingMetric")
        rankingMetric = event.target.value;
      if (event.target.name === "rankingPeriod")
        rankingPeriod = event.target.value;
      if (event.target.name === "rankingMode") rankingMode = event.target.value;
      render(false);
      app.querySelector(`[name="${event.target.name}"]`)?.focus();
      return;
    }
    if (event.target.form?.getAttribute("id") === "music-form") {
      saveMusicPreferences();
      return;
    }
    if (event.target.id === "news-editor-file") {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        notice("Please select an image file.", true);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dlg = document.getElementById("nation-dialog");
        const editor = dlg.querySelector("#news-editor");
        if (!editor) return;
        editor.focus({ preventScroll: true });
        document.execCommand("insertImage", false, reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }
    if (event.target.id === "warFilterValue") {
      window.warsFilterValue = event.target.value;
      render(false);
      return;
    }
    if (event.target.matches("[data-editor]")) {
      const dlg = document.getElementById("nation-dialog");
      const editor = dlg.querySelector("#news-editor");
      if (!editor) return;
      editor.focus({ preventScroll: true });
      const target = event.target;
      if (target.matches('select[data-editor="fontName"]'))
        document.execCommand("fontName", false, target.value);
      else if (target.matches('select[data-editor="fontSize"]'))
        document.execCommand("fontSize", false, target.value);
      else if (target.matches('input[data-editor="foreColor"]'))
        document.execCommand("foreColor", false, target.value);
      return;
    }
    if (event.target.matches("[data-mobile-nav]")) {
      document.querySelector(`[data-tab="${event.target.value}"]`).click();
      return;
    }
    if (event.target.matches("[data-catalog-status],[data-catalog-sort]"))
      filterCatalog();
    updateDynamicForms();
    if (
      event.target.form?.getAttribute("id") === "motion-form" &&
      event.target.name === "type"
    ) {
      motionFields();
      updateDynamicForms();
    }
  });
  app.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = event.target;
    if (pending) return;
    if (f.dataset.local === "map") {
      const data = formData(f);
      selectMapTile(data.x, data.y, true);
      return;
    }
    if (f.getAttribute("id") === "auth-form") {
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
    if (f.dataset.local === "appearance") {
      preferences = { ...preferences, ...formData(f) };
  applyPreferences();
  applyTabOrder();
  initTabDragDrop();
      try {
        localStorage.setItem("dominion-ui", JSON.stringify(preferences));
        notice("Display preferences saved for this browser.");
      } catch {
        notice(
          "Display updated for this session. This browser could not save it.",
          true,
        );
      }
      return;
    }
    if (
      f.dataset.command &&
      !f.querySelector(".form-footer button, [data-buy-unit]")?.disabled &&
      f.reportValidity()
    )
      await command(f.dataset.command, formData(f), f.getAttribute("id"));
  });
  // Browsers may block saved music preferences until the next real interaction.
  document.addEventListener("pointerdown", () => music.resume(), {
    passive: true,
  });
  document.addEventListener("keydown", () => music.resume());
  // Nation dialog (skills & edit-nation modals) event handling.
  const nationDialog = document.getElementById("nation-dialog");
  nationDialog.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    if (target.hasAttribute("data-save-edit-nation")) {
      await saveEditNation();
      return;
    }
    if (target.dataset.action === "closeModal" || target.value === "close" || target.value === "cancel") {
      closeModal();
      return;
    }
    if (target.dataset.action === "buyUnit" || target.dataset.action === "sellUnit") {
      // Support both dialog input (input[name="unitAmount"]) and main tab input (input[name="unitAmount-${type}"])
      let amt = 1;
      const dlgInput = document.getElementById("nation-dialog")?.querySelector('input[name="unitAmount"]');
      const mainInput = document.querySelector(`input[name="unitAmount-${target.dataset.unitType || JSON.parse(target.dataset.payload || '{}').type}"]`);
      if (dlgInput) amt = Number(dlgInput.value || 1);
      else if (mainInput) amt = Number(mainInput.value || 1);
      if (!amt || amt < 1) return;
      await command(target.dataset.action, { type: target.dataset.unitType || JSON.parse(target.dataset.payload || '{}').type, amount: amt });
      return;
    }
    if (target.dataset.toggle) {
      const content = document.getElementById(`toggle-${target.dataset.toggle}`);
      if (content) {
        content.classList.toggle("hidden");
        const btn = target;
        btn.textContent = content.classList.contains("hidden") ? "⌃" : "⌄";
      }
      return;
    }
    if (target.dataset.action === "openCitizenDialog") {
      const citizenId = target.dataset.citizenId;
      const popSys = window.PopulationSystem;
      const citizenSys = window.CitizenDialogSystem;
      if (!citizenSys || !popSys) {
        alert("Citizen systems not available.");
        return;
      }
      const citizen = popSys.citizens?.get(citizenId);
      if (!citizen) {
        alert("Citizen not found.");
        return;
      }
      const nation = state.nation;
      const conv = citizenSys.generateConversation(citizen, nation);
      const dlgContent = document.getElementById("citizen-dialog-content");
      if (dlgContent) {
        dlgContent.innerHTML = `
          <div class="dialog-ruler">Ruler asks: ${esc(conv.rulerQuestion)}</div>
          <div class="dialog-citizen">${esc(citizen.name)} answers: ${esc(conv.citizenAnswer)}</div>
          <div class="dialog-reason">${esc(conv.fullDialog)}</div>
        `;
      }
      return;
    }
    if (target.dataset.action === "openNationToggle") {
      mapToggleType = "nation";
      mapToggleTarget = target.dataset.target;
      render();
      return;
    }
    if (target.dataset.action === "openAllianceToggle") {
      mapToggleType = "alliance";
      mapToggleTarget = target.dataset.target;
      render();
      return;
    }
    if (target.dataset.action === "declareWar") {
      const f = document.getElementById("declare-war-modal-form");
      if (!f || !f.reportValidity()) return;
      const data = new FormData(f);
      await command("declareWar", {
        target: data.get("target"),
        reason: data.get("reason"),
        warType: data.get("warType"),
        casusBelli: data.get("casusBelli"),
      });
      closeModal();
      mapToggleType = null;
      mapToggleTarget = null;
      return;
    }
    if (target.dataset.action === "proposeTreaty") {
      const f = document.getElementById("propose-treaty-modal-form");
      if (!f || !f.reportValidity()) return;
      const data = new FormData(f);
      await command("treatyPropose", {
        target: data.get("target"),
        type: data.get("type"),
        compensation: Number(data.get("compensation") || 0),
        duration: Number(data.get("duration") || 7),
      });
      closeModal();
      mapToggleType = null;
      mapToggleTarget = null;
      return;
    }
    if (target.dataset.action === "launchAttack") {
      const f = document.getElementById("launch-attack-modal-form");
      if (!f || !f.reportValidity()) return;
      const data = new FormData(f);
      const attackType = data.get("attackType");
      const targetId = target.dataset.target || mapToggleTarget;
      const reason = data.get("reason") || "Territorial dispute";
      // If not at war, declare war first
      const isAtWar = (state.wars || []).some(
        (w) => w.status !== "ended" && w.participants.includes(n?.id) && w.participants.includes(targetId),
      );
      if (!isAtWar) {
        await command("declareWar", { target: targetId, reason, warType: "conventional", casusBelli: "territorial" });
      }
      // Find the war and launch attack
      await new Promise((r) => setTimeout(r, 100));
      const war = (state.wars || []).find(
        (w) => w.status !== "ended" && w.participants.includes(n?.id) && w.participants.includes(targetId),
      );
      if (war) {
        await command("attack", { id: war.id, target: targetId, type: attackType });
      }
      closeModal();
      mapToggleType = null;
      mapToggleTarget = null;
      return;
    }
    if (target.dataset.action === "openMessage") {
      closeModal();
      mapToggleType = null;
      mapToggleTarget = null;
      messageChannel = "private";
      privateRecipient = target.dataset.target;
      render(false);
      return;
    }
    if (target.dataset.action === "setRelationship") {
      await command("relationship", {
        target: target.dataset.target,
        type: target.dataset.type,
      });
      render(false);
      return;
    }
    if (target.dataset.action === "flagDesignPreview") {
      const dlg = document.getElementById("nation-dialog");
      const count = Number(dlg.querySelector('select[name="stripeCount"]')?.value || 3);
      const orientation = dlg.querySelector('select[name="stripeOrientation"]')?.value || 'horizontal';
      const colors = [];
      dlg.querySelectorAll('input[name^="flagColor"]').forEach((inp) => colors.push(inp.value));
      const flag = { type: 'designed', stripeCount: count, stripeOrientation: orientation, colors };
      dlg.querySelector('#flag-builder-canvas').innerHTML = designedFlagPreviewHTML(flag);
      return;
    }
    if (target.dataset.action === "flagRemove") {
      const dlg = document.getElementById("nation-dialog");
      await command("setFlag", { type: "designed", stripeCount: 1, stripeOrientation: "horizontal", colors: [] });
      dlg.innerHTML = NationModals.flagModalContent(state);
      return;
    }
    if (target.dataset.action === "save-flag") {
      const dlg = document.getElementById("nation-dialog");
      const fileInput = dlg.querySelector('input[name="flagFile"]');
      const file = fileInput?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          await command("setFlag", { type: "uploaded", data: reader.result, name: file.name });
          dlg.close();
          render(false);
        };
        reader.readAsDataURL(file);
        return;
      }
      const stripeCount = dlg.querySelector('select[name="stripeCount"]')?.value;
      const stripeOrientation = dlg.querySelector('select[name="stripeOrientation"]')?.value;
      const colors = [];
      dlg.querySelectorAll('input[name^="flagColor"]').forEach((inp) => colors.push(inp.value));
      if (stripeCount && stripeOrientation) {
        await command("setFlag", { type: "designed", stripeCount, stripeOrientation, colors });
        dlg.close();
        render(false);
      }
      return;
    }
    if (target.dataset.action === "newsReactSetSentiment") {
      const { type } = JSON.parse(target.dataset.payload);
      const d = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      if (d.sentiment?.type === type) d.sentiment = null;
      else d.sentiment = { type, rating: 1 };
      newsReactionDraft = d;
      renderModal();
      return;
    }
    if (target.dataset.action === "newsReactClearSentiment") {
      const d = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      d.sentiment = null;
      newsReactionDraft = d;
      renderModal();
      return;
    }
    if (target.dataset.action === "newsReactSetLevel") {
      const { group, type, level } = JSON.parse(target.dataset.payload);
      const key = group === "reaction" ? "reaction" : "sentiment";
      const d = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      if (d[key]?.type === type) d[key].rating = Number(level);
      else d[key] = { type, rating: Number(level) };
      newsReactionDraft = d;
      renderModal();
      return;
    }
    if (target.dataset.action === "newsReactClearReaction") {
      const d = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      d.reaction = null;
      newsReactionDraft = d;
      renderModal();
      return;
    }
    if (target.dataset.action === "newsReactToggleEmoji") {
      const { emoji } = JSON.parse(target.dataset.payload);
      const d = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      d.emojis = d.emojis || {};
      if (d.emojis[emoji]) delete d.emojis[emoji];
      else d.emojis[emoji] = true;
      newsReactionDraft = d;
      renderModal();
      return;
    }
    if (target.dataset.action === "newsReactSave") {
      const dlg = document.getElementById("nation-dialog");
      const id = dlg.querySelector('input[name="id"]').value;
      const targetType = dlg.querySelector('input[name="targetType"]').value;
      const commentId = dlg.querySelector('input[name="commentId"]');
      const reaction = newsReactionDraft || { sentiment: null, reaction: null, emojis: {} };
      if (targetType === "comment") {
        await command("react", { id: commentId.value, targetType: "comment", reaction });
      } else {
        await command("react", { id, targetType: "article", reaction });
      }
      closeModal();
      return;
    }
    if (target.dataset.action === "newsArticleSave") {
      const dlg = document.getElementById("nation-dialog");
      const editor = dlg.querySelector("#news-editor");
      const idField = dlg.querySelector('input[name="id"]');
      const titleField = dlg.querySelector('input[name="title-field"]');
      const categoryField = dlg.querySelector('select[name="category-field"]');
      const isEdit = !!idField.value;
      if (isEdit) {
        await command("editArticle", {
          id: idField.value,
          title: titleField.value,
          body: editor.innerHTML,
        });
      } else {
        await command("article", {
          title: titleField.value,
          body: editor.innerHTML,
          category: categoryField.value,
        });
      }
      closeModal();
      return;
    }
    if (target.dataset.action === "newsArticleDelete") {
      const dlg = document.getElementById("nation-dialog");
      const id = dlg.querySelector('input[name="id"]').value;
      const confirmed = await confirmCommand("newsArticleDelete", { id });
      if (!confirmed) return;
      await command("deleteArticle", { id });
      closeModal();
      return;
    }
    if (target.dataset.action === "newsCommentSave") {
      const dlg = document.getElementById("nation-dialog");
      const bodyField = dlg.querySelector('textarea[name="body-field"]');
      const idField = dlg.querySelector('input[name="id"]');
      const commentIdField = dlg.querySelector('input[name="commentId"]');
      const isEdit = !!commentIdField?.value;
      if (isEdit) {
        await command("newsCommentEdit", {
          commentId: commentIdField.value,
          body: bodyField.value,
        });
      } else {
        await command("comment", { id: idField.value, body: bodyField.value });
      }
      closeModal();
      return;
    }
    if (target.dataset.action === "newsCommentDelete") {
      const { commentId } = JSON.parse(target.dataset.payload);
      const confirmed = await confirmCommand("newsCommentDelete", { commentId });
      if (!confirmed) return;
      await command("newsCommentDelete", { commentId });
      closeModal();
      return;
    }
    if (target.dataset.editor) {
      const dlg = document.getElementById("nation-dialog");
      const editor = dlg.querySelector("#news-editor");
      if (!editor) return;
      editor.focus({ preventScroll: true });
      const cmd = target.dataset.editor;
      if (cmd === "foreColorPicker") {
        const picker = dlg.querySelector('input[data-editor="foreColor"]');
        document.execCommand("foreColor", false, picker.value);
      } else if (cmd === "insertImage") {
        const fileInput = dlg.querySelector("#news-editor-file");
        fileInput.value = "";
        fileInput.click();
        return;
      } else {
        document.execCommand(cmd, false, undefined);
      }
      return;
    }
    if (target.dataset.action === "openTeamDraft") {
      teamDraftSport = JSON.parse(target.dataset.payload).sport;
      openModal("teamDraft");
      return;
    }
    if (target.dataset.action === "openTeamPlayer") {
      const d = JSON.parse(target.dataset.payload);
      teamPlayerSport = d.sport;
      teamPlayerId = d.playerId;
      teamPlayerTab = d.tab || "profile";
      openModal("teamPlayer");
      return;
    }
    if (target.dataset.action === "openTeamStadium") {
      teamStadiumSport = JSON.parse(target.dataset.payload).sport;
      openModal("teamStadium");
      return;
    }
    if (target.dataset.action?.startsWith("admin")) {
      await handleAdminAction(target.dataset.action, JSON.parse(target.dataset.payload));
      return;
    }
    if (target.dataset.action) {
      await command(target.dataset.action, JSON.parse(target.dataset.payload));
      return;
    }
  });
  nationDialog.addEventListener("change", (event) => {
    if (event.target.name === "situationChoice") {
      const index = Number(event.target.value);
      const btn = nationDialog.querySelector('[data-action="resolveSituation"]');
      if (btn) {
        btn.dataset.payload = JSON.stringify({
          situationId: modalSituation ? modalSituation.id : "",
          choiceIndex: index,
        });
      }
    }
  });
  nationDialog.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = event.target;
    if (!f.dataset.command) return;
    if (f.dataset.command === "policy") {
      const fd = new FormData(f);
      await command("policy", { policy: fd.get("policy"), value: fd.get("value") });
      return;
    }
    if (f.dataset.command === "allianceCreate" || f.dataset.command === "allianceEditSettings") {
      await command(f.dataset.command, formData(f));
      const dlg = document.getElementById("nation-dialog");
      if (dlg.open) dlg.close();
      return;
    }
  });
  nationDialog.addEventListener("close", () => {
    if (modalMode && nationDialog.returnValue === "") modalMode = null;
  });

  // Close dropdowns / account menu when clicking outside
  document.addEventListener("click", (event) => {
    const dd = document.getElementById("pop-dropdown");
    const btn = document.getElementById("pop-dropdown-btn");
    const menu = document.getElementById("account-menu");
    const trigger = document.getElementById("account-trigger");
    if (popDropdownOpen && dd && !dd.contains(event.target) && !btn?.contains(event.target)) {
      dd.classList.add("hidden");
      popDropdownOpen = false;
      btn?.setAttribute("aria-expanded", "false");
    }
    if (accountMenuOpen && menu && !menu.contains(event.target) && !trigger?.contains(event.target)) {
      menu.classList.add("hidden");
      accountMenuOpen = false;
      trigger?.setAttribute("aria-expanded", "false");
    }
  });

  async function boot() {
    try {
      catalog = await api("/api/catalog");
      const initialTab = location.hash.slice(1);
      if (tabs.some(([key]) => key === initialTab)) currentTab = initialTab;
      online = true;
      // Handle OAuth callback: /auth/google and /auth/discord redirect back
      // to /?token=<jwt>. Exchange it for a cookie session then strip the URL.
      const oauthParams = new URLSearchParams(location.search);
      const oauthToken = oauthParams.get("token");
      if (oauthToken) {
        history.replaceState({}, "", location.pathname + location.hash);
        try {
          const oauthRes = await fetch("/api/login-oauth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: oauthToken }),
          });
          if (oauthRes.ok) {
            const json = await oauthRes.json();
            // OAuth account exists but has no nation yet → nation setup flow.
            if (json.hasNation === false) {
              if (window.AccountCreation) {
                window.AccountCreation.showNationSetup(
                  json.token || oauthToken,
                  json.user || { username: json.username }
                );
              }
              return;
            }
            receive(json);
            connect();
            return;
          }
        } catch { /* fall through to normal auth */ }
      }
      const response = await fetch("/api/state");
      if (response.ok) {
        const json = await response.json();
        // Logged in but no nation yet → nation setup flow.
        if (json.hasNation === false) {
          if (window.AccountCreation) {
            window.AccountCreation.showNationSetup(null, json.user);
          }
          return;
        }
        // Ensure PopulationSystem exists so citizens can be loaded from server state
        if (typeof window.PopulationSystem === 'function') {
          window.PopulationSystem = new window.PopulationSystem();
        }
        receive(json);
        connect();
      } else if (response.status === 401) {
        // Not logged in - show auth form
        auth();
      } else {
        // Other error - try to parse error message
        try {
          const error = await response.json();
          console.error("Failed to load state:", error);
        } catch {
          console.error("Failed to load state:", response.status);
        }
        auth();
      }
    } catch (error) {
      app.innerHTML = `<main class="loading"><div class="crest">DW</div><h1>World connection unavailable</h1><p>The game server must be running to enter this persistent world.</p><button id="retry-connect">Try again</button></main>`;
      document.getElementById("retry-connect").onclick = boot;
    }
  }
  window.addEventListener("hashchange", () => {
    const key = location.hash.slice(1);
    if (state && tabs.some(([id]) => id === key) && key !== currentTab) {
      saveDraft();
      switchTab(key);
    }
  });
  setInterval(updateClock, 1000);
  // Periodically sync citizens to server so auto-simulated births/deaths/relationships persist
  setInterval(() => {
    if (state && window.PopulationSystem && window.PopulationSystem.citizens.size)
      syncCitizens();
  }, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state)
      api("/api/state")
        .then(receive)
        .catch(() => {
          online = false;
          render();
        });
  });
  // Persist citizens before page unload so names, ties, and jobs survive refreshes
  window.addEventListener("beforeunload", () => {
    if (state && window.PopulationSystem && window.PopulationSystem.citizens.size) {
      navigator.sendBeacon(
        "/api/citizens",
        JSON.stringify({ citizens: Array.from(window.PopulationSystem.citizens.values()) })
      );
    }
  });
  function wireFortuneModal(dialog, state) {
    // Wired per-game in Phase 3 when individual game modals are created.
    dialog.querySelectorAll('[data-action="closeFortuneModal"]').forEach((b) => {
      b.addEventListener("click", () => closeModal(), { once: true });
    });
  }
  window.TarotModalRender = () => {
    if (modalMode === "fortune") renderModal();
  };
  window.GamblerDiceModalRender = () => {
    if (modalMode === "fortune") renderModal();
  };
  window.KenoModalRender = () => {
    if (modalMode === "fortune") renderModal();
  };
  boot();
})();