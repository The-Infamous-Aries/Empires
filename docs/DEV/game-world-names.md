# Game & World Name Brainstorming

**Location:** `docs/DEV/game-world-names.md`
**Purpose:** Define replacement names for "Dominion Wars" (game) and "Dominion Wars" (world).
**Status:** Applied — all code, UI, and docs updated.

---

## Current Names (both taken / problematic)

| Element | Current Name | Issue |
|---------|-------------|-------|
| Game title | `Dominion Wars` | `core/config.js:8` — `GAME_TITLE: "Dominion Wars"` | Taken (2001 Star Trek DS9 space tactics game, Simon & Schuster) |
| World name | `Dominion Wars` | `server/world.js:117` — `worldName: "Dominion Wars"` | Same conflict as above |
| Browser title | `Dominion Wars · A living world` | `index.html:7` | Same conflict |

The world name is user-changeable via the `WORLD_NAME_CHANGE` motion (`docs/Systems/motion-system.md:136`), so a default starting world name is needed that players can vote to rename later.

---

## Selected Game Name

| Element | Value |
|---------|-------|
| **Game title** | `Sovereignty Epochs` |
| **Acronym** | `SovE` |
| **Game motto** | `Govern the economy. Command the matrix. Rule the epoch!` |
| **Where to set** | `core/config.js:8` — `GAME_TITLE: "Sovereignty Epochs"` |
| **Browser title** | `index.html:7` — `<title>Sovereignty Epochs · A living world</title>` |

**Why this fits:** "Sovereignty" emphasizes the player as supreme ruler of their nation (the core Ruler roleplay theme). "Epochs" suggests long eras, dynasties, historical ages, and legacy — matching the 12-skill XP/level system, population/economy progression, and long-term nation building. The acronym `SovE` is short, distinct, and usable for URLs, save files, and branding.

---

## Design Direction

The game is best described as a **Nation Ruler roleplay simulator**, not a war game. Core pillars:
- Users fully run a nation as a ruler with 12 skills + XP/levels
- Full diplomacy (treaties, alliances, nation relationships)
- Full wars (nation/alliance, treaty requirements, joining sides)
- Full sports manager (football, soccer, hockey, basketball; injuries, tournaments, seasons, draft)
- Full world bank & lottery (tax/interest rates, loans)
- World & Color Faction Congress and voting
- Full events system affecting many aspects
- Complex population/economy system
- News boards

The name should emphasize **Sovereignty / Ruler / Epoch / Reign / Dynasty / Legacy** rather than war/dominion.

---

## Game Name Ideas (reference)

Kept for reference in case the selected name needs a fallback.

### Tier 1: Strong emphasis on "Ruler"

| Name | Rationale | Availability Notes |
|------|-----------|--------------------|
| **Ruler of Nations** | Directly states the player's role. Clear, descriptive. | Verify trademark/domain before launch. |
| **Nation Ruler** | Simple, literal. Matches the description exactly. | Common phrase — may be hard to SEO. |
| **Supreme Ruler** | Evokes absolute authority. | Existing Cold War strategy series — Avoid. |
| **Imperial Ruler** | Ruler of an empire/nation. Strong thematic weight. | Check for conflicts. |
| **The Eternal Ruler** | Suggests long-term reign, dynasty, legacy. | Check for conflicts. |

### Tier 2: Realm / Throne / Reign themed

| Name | Rationale | Availability Notes |
|------|-----------|--------------------|
| **Realm of Reign** | "Realm" = domain; "Reign" = ruler's rule. Alliteration. | Check for conflicts. |
| **Throne of Nations** | Ruling over multiple nations from a central throne. | Check for conflicts. |
| **Reign & Realm** | Pairs the act of ruling with the domain being ruled. | Check for conflicts. |
| **Sovereign State** | "Sovereign" = supreme ruler; "State" = nation. | Common term — may need a qualifier. |
| **Sovereign Ruler** | Redundant but emphatic on absolute rule. | Check for conflicts. |

### Tier 3: Nation / World simulation themed

| Name | Rationale | Availability Notes |
|------|-----------|--------------------|
| **World Ruler** | Rules the whole world, not just one nation. | Check for conflicts. |
| **Global Ruler** | Similar to World Ruler, more modern feel. | Check for conflicts. |
| **Statecraft** | The art of governing a nation. Sophisticated, ruler-focused. | Common word — check trademark. |

### Tier 4: Avoid — taken

| Name | Why avoid |
|------|-----------|
| **Realm of Rulers** | **TAKEN** — existing medieval city-building game by Alchemical Interactive. Do not use. |
| **Dominion Wars** | **TAKEN** — 2001 Star Trek DS9 space tactics game. Current name — replace. |

---

## Starting World Name Ideas (for Sovereignty Epochs / SovE)

The world name appears in `server/world.js:117` as `worldName` and can be changed by players via the `WORLD_NAME_CHANGE` Congress motion. It should sound like a grand, sovereign realm spanning epochs — a living world where nations rise and fall across ages.

### Sovereign / Throne themed

| World Name | Rationale |
|------------|-----------|
| **Soverea** | Derived from "sovereignty." Clean, regal, directly ties to the game name. |
| **Thronereach** | Suggests the extent of a ruler's domain across the world. |
| **Crownspire** | A central seat of power; evokes a capital from which sovereignty radiates. |
| **Regalis** | Latin for "royal/kingly." Short, formal, sovereign. |
| **Imperium Aeternum** | "Eternal empire." Grand, epoch-spanning scope. |
| **Sovereign's Reach** | The breadth of a ruler's authority over the world. |
| **Diadem** | A crown; symbol of sovereignty. Short and memorable. |
| **Sceptrehold** | A realm held by royal authority. |
| **Apex Throne** | The highest seat of power in the world. |
| **Sovereign's Cradle** | Where nations and rulers are born. |

### Epoch / Age / Era themed (fits "Epochs")

| World Name | Rationale |
|------------|-----------|
| **Aeterna** | Latin for "eternal." Suggests a world that endures across epochs. |
| **Chronos Prime** | The primal world of time and ages. |
| **Epochus** | Direct nod to "Epochs." A world defined by ages. |
| **Aeonis** | Suggests eternity/ages. Good for a persistent world. |
| **Primordia** | First/original world. Fits a new game launch at the start of an epoch. |
| **Agefall** | A world where ages rise and fall. |
| **The Everage** | A single world spanning all ages. |
| **Eraforge** | Where epochs are forged by rulers. |
| **Timerealm** | A realm existing across time. |
| **Millennium** | Suggests long epochs and enduring rule. |

### Grand Realm / World themed

| World Name | Rationale |
|------------|-----------|
| **Terranova** | "New land/earth." A fresh world for nations to build on. Neutral starting point. |
| **Omnia** | Latin for "all/everything." Fits a world containing all nations. |
| **Valoria** | Derived from "valor"/"value." Strong, ruler-adjacent. |
| **Eldoria** | Classic fantasy world name; neutral and memorable. |
| **Aethelgard** | Fantasy-tinged, sounds like a living realm. |
| **Nexus** | Central hub where all nations meet. Modern, clean. |
| **Earth Prime** | Familiar but distinct. The primary world. |
| **The Grand Realm** | Generic but clear; easy for players to understand. |
| **Aeonhold** | A hold/realm that persists across aeons. |
| **Sovereign Expanse** | A wide realm under sovereign rule. |

### Dynasty / Legacy themed

| World Name | Rationale |
|------------|-----------|
| **Dynasta** | From "dynasty." A world shaped by ruling houses across epochs. |
| **Legacyreach** | The span of a ruler's legacy across the world. |
| **Heritagion** | A world defined by inherited rule and legacy. |
| **Bloodrealm** | A realm where dynastic bloodlines rule. |
| **Household of Epochs** | All ruling houses across all ages. |
| **Succession** | The passing of rule across epochs. |
| **Dynasphere** | The sphere of dynastic influence. |

---

## Recommended Starting Pair

| Element | Recommended Name | Where to set |
|---------|-----------------|--------------|
| **Game title** | `Sovereignty Epochs` | `core/config.js:8` — `GAME_TITLE` |
| **Acronym** | `SovE` | Branding, URLs, save prefixes |
| **Game motto** | `Govern the economy. Command the matrix. Rule the epoch!` | `core/config.js`, `index.html`, login/UI headers |
| **World name (default)** | `Epochus` | `server/world.js:117` — `worldName` |
| **Browser title** | `Sovereignty Epochs · {tab} · {month} {day}, Year {year}` (dynamic, updates every second) | `ui/live/game.js:1074` — `updateTitle()` |

**Why this pair:** "Sovereignty Epochs" (SovE) directly communicates the Nation Ruler roleplay theme with emphasis on the Ruler (sovereignty) and long-term progression (epochs). The motto "Govern the economy. Command the matrix. Rule the epoch!" ties together the economy system, ruler roleplay, and epoch/era progression. "Epochus" is a grand, epoch-sounding default world name that players can vote to change via the `WORLD_NAME_CHANGE` motion without implying war or conflict.

---

## Next Steps to Apply a New Name

1. Verify trademark/domain availability for "Sovereignty Epochs" and "SovE."
2. Update `core/config.js:8` — `GAME_TITLE: "Sovereignty Epochs"`.
3. Update `index.html:7` — `<title>Sovereignty Epochs · A living world</title>`.
4. Optionally update `server/world.js:117` — `worldName` for the default starting world (recommend `Soverea`).
5. Update JSDoc header comments across files that say "Dominion Wars - Nation Building Strategy Game" (many files in `core/`, `entities/`, `systems/`, `ui/`, `map/`).
6. Update `docs/DEV/server-files.md` project header.
7. Players can change the world name in-game via the World Forum / Congress `WORLD_NAME_CHANGE` motion.

---

## Dynamic Browser Title

The browser title now displays the live in-game date and updates every second:

```
Sovereignty Epochs · {tabName} · {monthName} {day}, Year {year}
```

**Implementation:** `ui/live/game.js:1074` — `updateTitle()`

- Called from `render()` at line 931 (on every tab switch / state update)
- Called from `updateClock()` at line 1086 (every second via `setInterval`)
- Uses `window.TimeSystem.getTime()` for `{year, month, day}`
- Uses `window.TimeSystem.getMonthName(t.month)` for the month name — supports calendar reform via World Forum motion, so if players change month names through a motion, the title updates automatically
- Falls back gracefully if `window.TimeSystem` isn't ready yet

**Example:** `Sovereignty Epochs · Nation · January 15, Year 3`

---

**Disclaimer:** Name availability (trademark, domain, existing games) was not exhaustively verified. Perform a trademark search and domain check before launching publicly.