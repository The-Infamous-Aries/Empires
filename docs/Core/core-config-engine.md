# Config & Game Engine — `core/config.js` & `core/game-engine.js`

**Purpose:** `config.js` is the master settings file. `game-engine.js` is the main loop that runs the game.

---

## 1. Config System — `core/config.js`

**Purpose:** The master settings file for the entire game. Every system reads from `GameConfig`.

### What It Contains

| Section | What It Controls |
|---------|-----------------|
| `BUILDING_COSTS` | Money cost for each building type (house, factory, farm, power plant, research center, barracks, hospital, school) |
| `MILITARY_COSTS` | Money cost for each military unit (soldier, tank, aircraft, ship) |
| `EXPERIENCE_SOURCES` | XP rewards for actions (territory claimed, battle won/lost, alliance formed) |
| `AID` | Aid settings: cooldown, min/max amount |
| `GameEvents` | Event names including `AID_SENT` / `AID_RECEIVED` |
| `LAND_COST_BASE` / `LAND_COST_MULTIPLIER` | Land purchase cost formula |
| `INFRA_COST_BASE` | Infrastructure cost formula |
| `TECH_COST_BASE` | Technology cost formula |
| `INITIAL_LAND` / `INITIAL_INFRA` | Starting land/infrastructure values |
| `SAVE` | Save slot settings (max slots, compression, auto-save interval) |

### Trade/Resource Logic Removed

The following were **removed** because the game no longer has resources or trades:

- `RESOURCE_GENERATION` block — no resource generation rates
- `materials`/`energy`/`technology` fields from all building/military costs — money only now
- `TRADE_COMPLETED` from experience sources — no trade XP
- `TRADE_AGREEMENT` treaty type removed from AI

### Aid Config Added

| Setting | Default | Purpose |
|---------|---------|---------|
| `AID.COOLDOWN_MS` | 3,600,000 (1 hour) | Minimum time between aid sends |
| `AID.MAX_AMOUNT` | 1,000,000 | Max money per aid transfer |
| `AID.MIN_AMOUNT` | 1,000 | Min money per aid transfer |
| `GameEvents.AID_SENT` | `'aid_sent'` | Event emitted when aid is sent |
| `GameEvents.AID_RECEIVED` | `'aid_received'` | Event emitted when aid is received |

---

## 2. Game Engine — `core/game-engine.js`

**Purpose:** The main game loop. Starts up all systems, handles login, renders the map and UI, processes turns.

### What It Does

| Responsibility | Description |
|---------------|-------------|
| **System startup** | Initializes all core systems on game start |
| **Login handling** | Authenticates players, loads their nation data |
| **Map/UI rendering** | Renders the world grid, nation view, and UI panels |
| **Turn processing** | Processes game turns, updates nation stats |
| **Event wiring** | Connects UI buttons to game actions |

### Trade Button → Aid Button

**Removed:** Trade button click handler + `showTradeMenu()` method

**Added:** Aid button click handler + `showAidMenu()` method

```javascript
// Before (removed):
const tradeBtn = document.getElementById('trade-btn');
tradeBtn.addEventListener('click', () => this.showTradeMenu());

// After (added):
const aidBtn = document.getElementById('aid-btn');
aidBtn.addEventListener('click', () => this.showAidMenu());
```

### Game Flow

```
Player logs in
    ↓
Game Engine starts all systems
    ↓
Event System wires auto-save listeners
    ↓
Database Manager loads all domains from disk
    ↓
Map and UI render with nation data
    ↓
Player performs action (aid, build, war, etc.)
    ↓
Event emitted → Data Persistence saves immediately
    ↓
Turn advances → AI Nations make decisions
    ↓
Loop repeats
```

### Startup Order

1. Config loaded first (all other systems depend on it)
2. Database Manager initialized (loads all 15 domains from disk)
3. Data Integration connects all systems
4. Event System wired for auto-save
5. AI Nations created and assigned territories
6. Admin System initialized (checks for super_admin email)
7. Game loop begins
