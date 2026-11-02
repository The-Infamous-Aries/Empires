# Map System — Simple Guide
## Dominion Wars (The Empire Game)

This file explains how the map works in plain English. No fancy words.

---

## 1. What the map IS

Imagine a giant sheet of graph paper. Each square on the paper is a piece of land.

- **1 square = 100 square miles** of land
- The world is a grid of these squares
- Nations (players or computer countries) claim squares to build their empire
- Each square has terrain (grass, forest, mountain, water, etc.) and resources (food, wood, energy, money)
- You can build things on your squares, grow population, and fight other nations for their squares

The map grows **forever**. Every time someone claims land at or beyond the edge, the grid expands automatically. There is always enough room for new players.

---

## 2. How territories work (the real game rules)

### Land blocks and map squares
- 1 map square = 100 miles = 1 land block
- A nation's `land` is stored in miles. `mapBlocks = Math.floor(land / 100)`
- You can only claim as many squares as you have mapBlocks
- First 10 blocks (1000 miles) are **free** at nation creation
- After that, each block costs money. The cost goes up as you own more land

### Buying land
- `NationSystem.buyLand()` buys 1 mile at a time
- The map system calls it 100 times to buy 1 block (100 miles = 1 square)
- Cost formula: `nextMile * (population / 1000) * 10 * tierMultiplier`
- The more land and population you have, the more expensive the next block

### Claiming a square on the map
To claim a square, a nation must:
1. Have at least one unused mapBlock
2. Pay the land cost (money)
3. Pay the World Bank territory tax (compounding — gets more expensive as more territories are bought globally)
4. The square must touch an existing owned square (or be the nation's first claim)

After claiming:
- The square is marked as owned in the map data
- The nation's territory list is updated
- Population and economy are recalculated
- The World Bank records the purchase for tax tracking

### Abandoning a square
- Removes ownership from the square
- Takes it out of the nation's territory list
- Frees up that mapBlock (the land miles stay, just not claimed on the map)

---

## 3. The files in the `map/` folder

### `map/map-data.js` — The Master List (data layer)
Remembers everything about the map grid:
- Which square belongs to which nation
- What terrain is on each square
- What resources each square has
- World bounds that expand forever as new land is claimed
- Uses **sparse storage** — only creates squares when they're touched/claimed
- Exposes `window.GridMap`

### `map/territory-manager.js` — The Rules Referee (logic layer)
Enforces the game rules on the map:
- Checks if a nation can claim a square (has blocks, pays cost, touches existing land)
- Calculates claim cost using NationSystem.landCost() + WorldBank territory tax
- Buys land through NationSystem.buyLand()
- Records purchases with WorldBankSystem.recordTerritoryPurchase()
- Handles combat, infrastructure, upgrades, daily income, population growth
- Exposes `window.TerritoryManager`

### `map/enhanced-map-renderer.js` — The Pro Painter (rendering layer)
Draws the map on screen using HTML5 Canvas:
- **5 view modes** (toggleable): Nations, Alliances, Treaties, Wars, Currencies
- Nations view: each nation its own color
- Alliances view: all members of an alliance share one color
- Treaties view: nation color + green lines between treaty partners
- Wars view: nation color + red lines between warring nations
- Currencies view: color by shared currency
- Nation interaction panel (click a nation to see info, declare war, send aid, etc.)
- Pan, zoom, keyboard (WASD, +/-), touch (pinch to zoom)
- Exposes `window.EnhancedMapRenderer`

### `map/map-renderer.js` — The Basic Painter
Simpler fallback renderer. Draws grid, territory colors, pan/zoom/click.

### `map/map-ui-styles.css` — The Makeup Artist
CSS for all map UI: view toggle buttons, map controls, nation panel, relationship badges, action buttons, legends, tooltips, context menu.

### `map/map-interaction.js` — The Controller (input layer)
Handles mouse, touch, and keyboard:
- Left drag to pan, wheel to zoom, double-click to center+zoom
- Right-click context menu (Claim, Build, Deploy, Details, Center)
- Hover tooltips
- WASD to pan, +/- to zoom, C to center, V to change view mode, Esc to close
- Touch: one finger pan, two-finger pinch zoom
- Works with both renderers (detects which API each supports)

### `map/map-integration.js` — The Glue
Connects everything together:
- Loads filter modules dynamically
- Waits for game systems (GridMap, EventBus) to be ready
- Finds or creates the `<canvas id="game-map">`
- Loads the CSS stylesheet
- Creates the EnhancedMapRenderer
- Wires all game systems (Nation, Alliance, Diplomacy, War, WorldBank) to the renderer
- Creates the MapInteraction controller
- Forwards game events (claim, alliance, war, treaty) to re-render the map
- Auto-initializes when the page loads

### `map/Filters/` — View Mode Filters
One file per view mode. Each filter decides how to color territories and what lines to draw:
- `base-filter.js` — Base class all filters extend
- `nation-filter.js` — Color by nation
- `alliance-filter.js` — Color by alliance
- `treaty-filter.js` — Nation color + treaty lines
- `war-filter.js` — Nation color + war lines
- `currency-filter.js` — Color by shared currency

---

## 4. File inventory

| File | What it does | Global |
|------|-------------|--------|
| `map/map-data.js` | Master List — grid data, terrain, resources, claiming | `window.GridMap` |
| `map/territory-manager.js` | Rules Referee — claim costs, combat, income, population | `window.TerritoryManager` |
| `map/enhanced-map-renderer.js` | Pro Painter — draws map, 5 view modes, nation panel | `window.EnhancedMapRenderer` |
| `map/map-renderer.js` | Basic Painter — simple fallback renderer | `GridMapRenderer` |
| `map/map-ui-styles.css` | Makeup Artist — all map UI styling | (stylesheet) |
| `map/map-interaction.js` | Controller — mouse, touch, keyboard input | `MapInteraction` |
| `map/map-integration.js` | Glue — connects everything to game systems | `window.MapIntegration` |
| `map/Filters/base-filter.js` | Base class for view filters | `window.BaseMapFilter` |
| `map/Filters/nation-filter.js` | Nations view mode | `window.NationFilter` |
| `map/Filters/alliance-filter.js` | Alliances view mode | `window.AllianceFilter` |
| `map/Filters/treaty-filter.js` | Treaties view mode | `window.TreatyFilter` |
| `map/Filters/war-filter.js` | Wars view mode | `window.WarFilter` |
| `map/Filters/currency-filter.js` | Currencies view mode | `window.CurrencyFilter` |

---

## 5. Load order (in index.html)

The map scripts load after the game engine, in this order:

1. `core/game-engine.js` — game systems must be ready first
2. `map/map-data.js` — creates `window.GridMap`
3. `map/territory-manager.js` — creates `window.TerritoryManager`
4. `map/Filters/base-filter.js` through `currency-filter.js` — view mode filters
5. `map/enhanced-map-renderer.js` — the painter
6. `map/map-interaction.js` — the controller
7. `map/map-integration.js` — the glue (auto-starts)
8. `map/map-ui-styles.css` — the styling

The HTML body has `<div id="map-container">` which holds the full-screen canvas.

---

## 6. View modes (toggles)

Users can switch how the map looks:

| Mode | What it shows |
|------|--------------|
| **Nations** | Each nation gets its own color. Unclaimed squares show terrain color. |
| **Alliances** | All members of an alliance share one color. Unallied nations keep their own color. |
| **Treaties** | Nation colors + green lines between nations that have active treaties. |
| **Wars** | Nation colors + red lines between nations at war. Line width shows who's winning. |
| **Currencies** | Nations sharing the same currency (aurel, velt, krona, etc.) show the same color. |

The view toggle appears at the top center of the map. Press `V` to cycle through modes.

---

## 7. How a claim happens (step by step)

1. User clicks a square on the map
2. MapInteraction figures out which square was clicked
3. Emits `claim_territory` event
4. TerritoryManager checks: does the nation have mapBlocks? Can they afford the cost? Does it touch existing land?
5. If yes: buy land via NationSystem.buyLand(), record with WorldBank, mark square in GridMap, add to nation's territory list
6. GridMap emits `territory_claimed`
7. EnhancedMapRenderer re-draws that square in the nation's color

---

## 8. What's still needed (UI next)

The map now works as the game background. The next phase is building the UI that frames around and over the map:
- Nation interaction panels (already in the renderer, but needs full UI menus)
- Build infrastructure dialogs
- Deploy forces dialog
- Treaty/war declaration dialogs
- Currency exchange UI

These will be built in `ui/live/` and triggered by events the map already emits.
