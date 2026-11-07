# Server Folder Audit — `docs/DEV/server-files.md`

**Location:** `docs/DEV/server-files.md`
**Project:** Sovereignty Epochs (Empire.2)
**Game rules in effect:** NO resources, NO trades. Nations CAN send aid (money/tech) to each other.

This document audits every file in the `server/` folder, marks which are needed versus obsolete, identifies the files we do not have but MUST have for the Entity/System game logic to load, and explains how the Entities and Systems fit together.

---

## 1. Current Game Rules (Why This Audit Exists)

| Rule | Status |
|------|--------|
| Resources | REMOVED — no resource gathering, stockpiles, or resource costs |
| Trades | REMOVED — no buy/sell offers, no trade agreements, no trade hub |
| Aid | ALLOWED — nations send money or tech to each other (see `core/aid-system.js`) |

Because trades and resources are gone, anything in `server/` that deals with offers, trade agreements, resource escrow, or `./trade` is **obsolete** and must be removed or replaced with aid logic.

---

## 2. Server Folder File Audit

`server/` contains **11 files**. Here is each one, what it does, whether we still need it, and its current status.

| File | What It Does | Still Needed? | Status |
|------|-------------|---------------|--------|
| `world.js` | The World class — the central game loop. Registers nations, processes turns, handles every player action (build, war, research, alliance, aid, motion, world bank, etc.), persists saves. | YES — core game engine | EXISTS, but **BROKEN** (requires removed `./trade`) |
| `rules.js` | Runs all Entity and System rule classes inside a Node `vm` sandbox to build each nation's isolated rule state (Nation, Player, buildings, projects, wonders, research, combat, diplomacy, war, forum, world bank). | YES — loads the game logic | EXISTS, but **BROKEN** (loads missing `data/research/*.js` files) |
| `diplomacy.js` | Nation-to-nation relationships (friend/foe/best friend/nemesis), treaty reasons/limits, combat bonuses, shared tech via intelligence treaties, demolition checks. | YES — diplomacy & aid depend on it | EXISTS |
| `war-diplomacy.js` | War obligations, treaty call-ins (defense/aggression pacts), joining wars, war debt collection, pending war calls view. | YES — war system | EXISTS |
| `rankings.js` | Calendar-bounded leaderboards (weekly/monthly/yearly) for strength, wins, population, treasury, tech, research, construction, territories, treaties, missile/nuke hits/misses. | YES — rankings system | EXISTS |
| `research.js` | Research catalog validation, effect totals/rebuild, descriptions, and active-research rescheduling. | YES — research system | EXISTS |
| `research-effects.json` | Data registry mapping research effect keys to stat, mode, and scale (attack, defense, trade efficiency, happiness, etc.). | YES — research data | EXISTS |
| `sports.js` | Sports simulation engine (teams, leagues, tournaments, matches, betting, player development, injuries, revenue). Loads `systems/Sports/sports-system.js`. | YES — sports system | EXISTS |
| `static.js` | Static file server (MIME types, range requests) for serving client assets. | YES — serves the UI | EXISTS |
| `query-routes.js` | Express route handlers for `/api/query`, `/api/query/schema`, `/api/query/audit` (read-only GraphQL-like API for Discord bots/websites). | YES — public read API | EXISTS |
| `lock.js` | Single-writer file lock for the world save (prevents two servers using one save). | YES — server safety | EXISTS |
| `trade.js` | **REMOVED** — handled trade offers, trade agreements, resource escrow. | NO — trades deleted | **MISSING** (intentionally) |

### Verdict on `trade.js`
`trade.js` no longer exists, and it **should not be brought back**. Trades are gone. However, `world.js:6` still does:

```js
const agreements = require("./trade");
```

and `world.js` calls `agreements.partners(...)`, `agreements.action(...)`, `agreements.process(...)`, plus has its own `trade()` method (buy/sell offers) and `tradePropose`/`tradeRespond`/`tradeCancel`/`acceptOffer` action cases. These are all **trade references that must be removed** (or replaced with aid where appropriate) before the server can start.

---

## 3. Files We Do NOT Have But DO Need

These files are required by `rules.js` and `world.js` at load time. Without them the server crashes with `ENOENT` before it can serve anything. They are the **research data catalogs** that feed the Entity/ System research system.

### Missing file 1: `data/research/economy-research.js`
### Missing file 2: `data/research/healthcare-research.js`
### Missing file 3: `data/research/production-research.js`
### Missing file 4: `data/research/war-research.js`

#### Why they are needed
`rules.js` (lines 24–27) loads these four files into the VM sandbox:

```js
...["economy", "healthcare", "production", "war"].map(
  (name) => `data/research/${name}-research.js`,
),
```

Each file exports a research catalog object (e.g. `EconomyResearch`, `HealthcareResearch`, `ProductionResearch`, `WarResearch`). `rules.js` merges them into `rules.research`, which is the research catalog every nation uses.

`world.js` constructor calls `research.validate(this.base.research)` (line 61), which validates every research entry's cost, time, prerequisites, and effects. If these files are missing, `rules.js` throws `ENOENT` on `fs.readFileSync`, and `world.js` (which requires `./rules`) fails to load too.

#### What each file should contain
Each is a plain object mapping research key → `{ name, category, cost, time, requirements: { tech_level, prerequisites }, effects: { <effectKey>: <value> } }`. Effect keys must match entries in `server/research-effects.json` (validated by `server/research.js`).

| File | Research Theme | Example effect keys |
|------|---------------|---------------------|
| `economy-research.js` | Economy, income, tax, trade | `tax_income`, `tax_efficiency`, `wealth_generation`, `trade_efficiency` |
| `healthcare-research.js` | Health, disease, recovery | `population_health`, `disease_resistance`, `healing_efficiency` |
| `production-research.js` | Resources, manufacturing, production | `basic_production`, `food_production`, `industrial_output` |
| `war-research.js` | Military, attack, defense, nukes | `attack_power`, `critical_damage`, `nuclear_deterrent`, `air_superiority` |

> **Verification:** `npm run check` passes syntax (143 files), but the server will NOT start until these four files exist and `world.js`'s `./trade` require is removed.

---

## 4. How Entities, Systems, and Server Files Work Together

The Entities (`entities/`) and Systems (`systems/`) are the **game logic**. `server/rules.js` loads them into a sandbox so each nation has its own isolated rule state. `server/world.js` owns the live world, the turn loop, persistence, and action dispatch.

### Entities (`entities/`)

| File | Role |
|------|------|
| `entities/Nation.js` | Nation entity — money, land, infra, tech, population, military units, resources, wars, alliances, relationships |
| `entities/Player.js` | Player entity — username, skills, levels, experience, energy, intuition, settings, nations |
| `entities/GlobalWorld.js` | World state — game day, world name, global stats |
| `entities/Team.js` | Sports team |
| `entities/Alliance.js` | Alliance — name, treasury, members, roles |
| `entities/MilitaryUnit.js` | Military unit types (soldiers, tanks, aircraft, ships, spies, missiles, nukes) |
| `entities/Citizen.js` | Citizen/population model |
| `entities/Technology.js` | Technology/research model |
| `entities/Building.js` | Building model (improvements, projects, wonders) |
| `entities/AwardSystem.js` | Player awards/achievements |
| `entities/HiveMindAI.js` | AI nation controller |

### Systems (`systems/`)

| File | Role |
|------|------|
| `systems/Nation/government-system.js` | Governments, stances, policies |
| `systems/Nation/religion-system.js` | Religions, bonuses |
| `systems/Nation/improvements-system.js` | Improvement (building) effects |
| `systems/Nation/projects-system.js` | Project effects, military unit limits |
| `systems/Nation/wonders-system.js` | Wonder effects |
| `systems/Nation/edict-system.js` | Nation edicts |
| `systems/Nation/research-system.js` | Research execution per nation |
| `systems/Nation/economy-system.js` | Nation economy (tax, GDP, upkeep) |
| `systems/Nation/buildings-system.js` | Building construction/demolition logic |
| `systems/Nation/events-system.js` | Nation events |
| `systems/World/world-bank-system.js` | World bank loans, buy/sell |
| `systems/World/world-forum-system.js` | World forum motions, voting, calendar |
| `systems/World/motion-system.js` | Motion types and parameters |
| `systems/World/global-system.js` | Global world updates |
| `systems/World/disease-system.js` | Disease mechanics |
| `systems/World/world-lottery-system.js` | Lottery |
| `systems/World/time-system.js` | Game clock/time |
| `systems/War/war-system.js` | Combat, damage, war resolution |
| `systems/War/alliance-system.js` | Alliance war logic |
| `systems/War/diplomacy-system.js` | War diplomacy/treaties |
| `systems/War/war-terms-system.js` | Peace terms |
| `systems/Population/population-system.js` | Population growth/capacity |
| `systems/Population/citizen-job-system.js` | Citizen jobs |
| `systems/Population/citizen-ties-system.js` | Citizen relationships |
| `systems/Sports/sports-system.js` | Sports engine (loaded by `server/sports.js`) |
| `systems/Sports/draft-system.js` | Player drafts |
| `systems/Sports/team-player-system.js` | Team/player management |
| `systems/Chat/messaging-system.js` | Private/alliance/world messages |
| `systems/Chat/forum-system.js` | Nation forum |

### Server files that bridge Entities/Systems to the live game

- `server/rules.js` — loads every Entity and System class into the sandbox; produces `rules.nation`, `rules.player`, `rules.research`, `rules.combat`, etc.
- `server/world.js` — holds `this.rules` (Map of nationId → rules), runs `transact`/`advance`/`processTurn`, dispatches actions, persists saves.
- `server/sports.js` — loads `systems/Sports/sports-system.js`; runs sports turns and match simulation.
- `server/diplomacy.js` / `server/war-diplomacy.js` — diplomacy and war relations used during `refresh` and action processing.
- `server/research.js` / `server/research-effects.json` — research validation/effects consumed by `world.refresh` and `rules.js`.
- `server/rankings.js` — leaderboards recorded each turn by `world.advance`.
- `server/query-routes.js` / `server/static.js` — HTTP API and asset serving.
- `server/lock.js` — save-file locking.

---

## 5. Data Flow (Game Logic Summary)

```
Player action (world.command)
        ↓
world.js runAction → delegates to system logic
        ↓
rules.js sandbox entities/systems compute effects & validity
        ↓
world.refresh(r) → recalculates nation stats (economy, military, happiness, research)
        ↓
world.advance() → turn loop: process research, motions, wars, aid expiry, sports, rankings.record
        ↓
world.save() → atomic write to saves/world.json
        ↓
core/data-persistence.js write-through → saves/db/<domain>.json
```

Aid specifically: `world.command` → `diplomacyAction` → creates `state.aid` record → `advance` completes/returns it after the timer → money/tech transferred. This replaces trade for nation-to-nation transfers.

---

## 6. What Must Be Fixed (Action Items)

1. **Create the 4 missing research data files** under `data/research/`:
   - `economy-research.js`
   - `healthcare-research.js`
   - `production-research.js`
   - `war-research.js`
   Each must export a catalog whose effect keys exist in `server/research-effects.json`.

2. **Remove trade from `world.js`:**
   - Delete line 6: `const agreements = require("./trade");`
   - Remove the `trade()` method (buy/sell offers, escrow, tariffs).
   - Remove `tradePropose`/`tradeRespond`/`tradeCancel`/`offer`/`acceptOffer`/`cancelOffer` action cases (replace with aid flow).
   - Remove `agreements.process(this, at)` from `advance`.
   - Remove `tradePartners`, `tradeAgreements`, `offers` from `view`.
   - Remove `agreements.partners(...)` checks from `buildingQuote`.

3. **Run verification:**
   - `npm run check` — syntax check all JS (should pass: 143 files)
   - `npm test` — run `tests/live-server.test.js` (confirms register, actions, research, units, alliances, messages, catalog)

4. **Confirm server loads:** `require("./server/world.js")` and `require("./server/rules.js")` must both succeed without `ENOENT`.

---

## 7. Verification Commands

| Command | Purpose |
|---------|---------|
| `npm run check` | Syntax-checks all 143 JS files (core, entities, systems, data, ui, map, utils, server, tests) |
| `npm test` | Runs `node --test tests/*.test.js` — live server integration test |
| `node -e "require('./server/world.js'); require('./server/rules.js'); console.log('OK')"` | Confirms server modules load at runtime |

---

**Bottom line:** All 11 `server/` files exist and are needed except the removed `trade.js` (do not restore). The server will not run until you add the 4 missing `data/research/*.js` files and strip the `./trade` dependency out of `world.js`. The Entities and Systems are all present and are the game logic loaded by `rules.js` into each nation's isolated world state.
