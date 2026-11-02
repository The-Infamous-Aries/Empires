# AI Nations System — `core/ai-nations.js`

**Purpose:** Controls computer-controlled nations so the game world isn't empty. AI nations play the game like user nations: they build, recruit military, declare war, make treaties, start research, and **send aid**.

---

## What AI Nations Do

| Action | Description | Trigger |
|--------|-------------|---------|
| **Buy Land** | Purchase more land territory | When money > $1M and expansion personality high |
| **Buy Infrastructure** | Purchase infrastructure | When money > $1M and expansion personality high |
| **Buy Technology** | Purchase technology | When money > $2M and tech personality high |
| **Recruit Soldiers** | Recruit military units | When money > $500K and military ratio low |
| **Recruit Tanks** | Build tank units | When money > $2M and tech > 500 |
| **Declare War** | Start a war with another nation | When military strength > 1000 and aggressiveness high |
| **Make Treaty** | Propose non-aggression or mutual defense | When not at war with nearby nation |
| **Send Aid** | Send money to another nation | When money > $500K and aid opportunity exists |
| **Start Research** | Begin a research project | When tech > 100 and no current research |

## AI Personality Traits

Each AI nation has a personality that influences decisions:

| Trait | Range | Affects |
|-------|-------|---------|
| `aggressiveness` | 0-1 | Likelihood to declare war |
| `diplomacy` | 0-1 | Likelihood to make treaties |
| `expansion` | 0-1 | Likelihood to buy land/infrastructure |
| `military` | 0-1 | Likelihood to recruit units |
| `cooperation` | 0-1 | Likelihood to send aid, accept treaties |

## AI Nation Templates

| Template | Leader | Government | Personality Highlights |
|----------|--------|------------|----------------------|
| Aetherian Empire | Emperor Valdris | Monarchy | Aggressive (0.8), Expansionist (0.9), Military (0.8) |
| Republic of Neredia | President Marina | Republic | Diplomatic (0.8), Cooperative (0.8) |
| Technate of Innovus | Chief Engineer Zara | Technocracy | Tech-focused, Nuclear skill (18) |
| Tribal Federation of Wildlands | Chief Thornwick | Anarchy | Aggressive (0.6), Military (0.7), Geography (18) |

## AI Decision Loop

```
Every 5 seconds (decisionInterval)
    ↓
For each AI nation:
    ↓
1. Analyze nation state (money, military, happiness, wars, allies, aid opportunities)
    ↓
2. Get possible actions based on state and resources
    ↓
3. Weight actions by personality + current needs
    ↓
4. Select best action (with slight randomness)
    ↓
5. Execute action
    ↓
Catch and log any errors (one nation's error doesn't stop others)
```

## Nation State Analysis

The AI evaluates:
- **Economic:** GDP per capita, treasury ratio, resource scarcity
- **Military:** Military strength, military ratio, at war status
- **Development:** Tech level, infrastructure, land size
- **Social:** Happiness, stability
- **Threats/Opportunities:** Nearby enemies, potential allies, aid opportunities

## Aid Support (Replaces Trade)

AI nations use aid instead of trade:

### `getAidOpportunities(nation)`

Finds AI nations that could receive aid, prioritized by:
- **Low treasury** (< $500K): +0.4 priority
- **At war:** +0.3 priority
- **Allied:** +0.2 priority
- Multiplied by cooperation personality trait

### `aiSendAid(nation, targetId, amount)`

Calls `window.aidSystem.sendAid(nation.id, targetId, amount, 'humanitarian')`.

### AI Send Aid Decision

Added as an action type in `getPossibleActions()`:
- Available when money > $500K and aid opportunities exist
- Sends up to 10% of treasury or $100K, whichever is less

## AI Personality Evolution

Personality traits drift slightly over time (±1% per turn):
- **At war:** Aggressiveness ↑, Diplomacy ↓
- **High happiness (>70):** Cooperation ↑

## Map Territory Assignment

On creation, each AI nation gets a 5x5 tile cluster (25 tiles) on the world grid, spread across the map in a grid layout so they don't overlap. The map is re-rendered after assignment.

## Class Methods

| Method | Description |
|--------|-------------|
| `getAINation(nationId)` | Get a specific AI nation |
| `getAllAINations()` | Get all AI nations as array |
| `getAIPlayer(playerId)` | Get the AI player for a player ID |
| `isAINation(nationId)` | Check if a nation is AI-controlled |
| `removeAINation(nationId)` | Remove an AI nation and its player |
| `setAISettings(newSettings)` | Update global AI settings |
| `getAIStats()` | Get aggregate AI statistics |
| `forceAIAction(nationId, actionType, ...args)` | Force an AI nation to perform an action (debug) |
| `getAIDecisionLog(nationId, limit)` | Get recent AI decisions (debug, returns empty) |
| `destroy()` | Stop AI loop, clear all data |

## Creating AI Nations

AI nations are created using `PlayerClass` and `NationClass` constructors (not singletons):
1. Create `PlayerClass` with `isAI: true`
2. Set skills from template
3. Create `NationClass` with name, leader, government, religion
4. Seed money, land, infra, tech
5. Assign faction color (round-robin across 10 colors)
6. Set `aiPersonality` and `isAI = true`
7. Initialize nation calculations (population, stats, literacy, economy)

## Browser Safety

All `window` access (`window.Player`, `window.Nation`, `window.GridMap`, `window.WarSystem`, `window.DiplomacySystem`, `window.ResearchSystem`, `window.aidSystem`) is guarded with existence checks before use.
