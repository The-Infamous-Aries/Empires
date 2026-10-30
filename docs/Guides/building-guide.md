# Building Guide — Empire Builder

Everything you need to know about constructing and managing Improvements, Projects, and Wonders for your nation. This guide covers how the building system works, every building available, and pro tips to maximize your empire's growth, military power, and economy.

---

## Table of Contents

1. [How the Building System Works](#how-the-building-system-works)
2. [Improvements — The Foundation](#improvements--the-foundation)
3. [Projects — Advanced Nation Capabilities](#projects--advanced-nation-capabilities)
4. [Wonders — The Pinnacle of Achievement](#wonders--the-pinnacle-of-achievement)
5. [Building Tips & Strategy](#building-tips--strategy)
6. [Quick Reference Tables](#quick-reference-tables)

---

## How the Building System Works

The Buildings System is the central coordinator for all construction in your nation. It manages three tiers of buildings:

| Tier | What it is | Cost | Limit |
|------|-----------|------|-------|
| **Improvements** | Basic buildings built on territory squares | Money | 1 per territory square |
| **Projects** | Advanced nation-wide capabilities | Money | 1 per 10 territories |
| **Wonders** | Unique, game-changing structures | Money | 1 per 20 territories |

### Truth Source Architecture

Each building type has a dedicated system that owns its definitions:

| System | Owns |
|--------|------|
| `ImprovementsSystem` | Improvement definitions (`improvementTypes`) |
| `ProjectsSystem` | Project definitions (`projectTypes`) |
| `WondersSystem` | Wonder definitions (`wonderTypes`) |
| `BuildingsSystem` | Build/demolish coordination, slot checks, cooldown timers |
| `Building` (entity) | Per-instance data container — pulls definitions from `BuildingsSystem` |

When a nation builds, demolishes, or upgrades a building, `BuildingsSystem` handles the operation and recalculates all effects. The `Building` entity instance is a read-only data container that pulls its stats from `BuildingsSystem` — it does not modify nation state directly.

### Key Mechanics

**Territory Slots:** Each territory square you own provides 1 improvement slot. If you have 50 territories, you can build up to 50 improvements total across all types.

**Project Limits:** You can build 1 project per 10 territories you own. Projects also have a **14-day cooldown** between builds. The exception is **Broadcasting**, which doesn't use a project slot but still triggers the cooldown.

**Wonder Limits:** You can build 1 wonder per 20 territories. Wonders have a **28-day cooldown** between builds.

**Upkeep:** Every improvement costs **$25,000 per day** in upkeep. Make sure your economy can support your building count before expanding too fast.

**Prerequisites:** Some projects and wonders require you to build specific things first:
- Projects may require a certain number of improvements (usually 5) or other projects
- Wonders may require projects, other wonders, or 5 stacked improvements
- Tech level requirements must also be met

**Daily Processing:** Each game day, your buildings produce resources, missiles, spies, nuclear warheads, and apply their effects. Some effects are recalculated daily (like food/water wonder activation based on farm/well counts).

---

## Improvements — The Foundation

Improvements are the basic building blocks of your nation. They're built on individual territory squares and provide direct bonuses to military, economy, infrastructure, diplomacy, and basic needs.

### Trade

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Port** | 4 | $800,000 | Enables 1 trade partner per port |

**Tip:** Ports are your gateway to trade. Build them early to unlock trade agreements and generate extra income.

---

### Military

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Barracks** | 5 | $1,500,000 | +10% soldier effectiveness each |
| **Factory** | 5 | $2,000,000 | +10% tank effectiveness each |
| **Airforce Base** | 5 | $2,800,000 | +10% aircraft effectiveness each |
| **Harbor** | 5 | $2,500,000 | +10% ship effectiveness each |

**Tips:**
- Military improvements stack up to 5 each. Max them out for the strongest military bonuses.
- Projects like Advanced Barracks Training, Advanced Tank Manufacturing, Advanced Aircraft Systems, and Advanced Naval Operations double these bonuses (10% → 20% per improvement).
- The **Supreme Military Command Complex** wonder gives an extra +5% to each military type that is at max (5 stacks), but costs -0.5 happiness per boosted type.

---

### Diplomacy

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Embassy** | 5 | $1,200,000 | 1 friend/foe slot each; special bonuses at 5 |
| **Foreign Affairs Office** | 1 | $3,500,000 | Required for all diplomatic actions |

**Tips:**
- Embassies increase how many friends and foes you can have. At 5 embassies, you unlock Best Friend and Nemesis selections.
- The Foreign Affairs Office is mandatory before you can conduct diplomacy. Build it early if you plan to interact with other nations.
- **Government Monument** wonder removes the permanent lock from Government Statue, letting you change government every 14 days.
- **Religious Monument** wonder does the same for Religious Statue.

---

### Administration

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Internal Affairs Office** | 1 | $3,000,000 | Allows selection of 10 domestic policies |

**Tips:**
- Build this to unlock domestic policy control. You can set policies on Immigration, Nuclear Research, Education, Healthcare, Environment, Taxation, Military, Trade, Surveillance, and Research.
- Certain policy combinations grant synergy bonuses (Authoritarian, Liberal Democracy, Technocracy, Green State).

---

### Infrastructure

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Hospital** | 5 | $900,000 | -5% disease rate each (max -25%) |
| **Police Station** | 5 | $750,000 | -5% crime rate each (max -25%) |
| **Recycling Center** | 5 | $1,100,000 | -5% pollution each (max -25%) |
| **School** | 5 | $1,000,000 | +7.5% literacy rate each (max +37.5%) |
| **Park** | 5 | $650,000 | +7.5% environment, +2 happiness each |
| **Tree Plantation** | 5 | $450,000 | +1 environment, +1 happiness, -1 pollution each |

**Tips:**
- Infrastructure improvements stack to 5. Hospitals, Police Stations, and Recycling Centers each cap at 25% reduction.
- Parks and Tree Plantations are cheap ways to boost happiness and environment.
- The **Supreme Environmental Protection Complex** wonder triples recycling center effectiveness and removes the happiness penalty.

---

### Economic

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Casino** | 5 | $1,800,000 | +5% taxable income each; +3% crime, -2 happiness each |

**Tips:**
- Casinos boost income but increase crime and lower happiness. Balance them with Police Stations and Parks.
- Each casino adds 3% crime — at 5 casinos that's +15% crime, so build Police Stations to offset it.

---

### Food & Water (Basic Needs)

| Improvement | Max | Cost | Effect |
|-------------|-----|------|--------|
| **Farm** | 5 | $500,000 | Feeds 1M population each; 5 stacks = +50% bonus |
| **Well** | 5 | $500,000 | Water for 1M population each; 5 stacks = +50% bonus |

**Tips:**
- Farms and Wells stack to 5. At 5 stacks, you get a 50% production bonus (5M → 7.5M coverage).
- Projects **Advanced Agriculture** and **Advanced Well Drilling** double coverage to 2M per farm/well.
- Projects **Farm Synergy** and **Well Synergy** increase the max-stack bonus from 50% to 100%.
- Wonders **Temple of Abundance** and **Aqueduct of Life** provide food/water for ALL population regardless of size — but require 5 farms/wells to function.

---

## Projects — Advanced Nation Capabilities

Projects are nation-wide upgrades that cost more than improvements and require technology. They unlock powerful capabilities and enhance existing improvements.

### Military Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Missile Silo** | 3 | $8,000,000 | 500 | 1 missile/day, 5 storage per silo |
| **Iron Curtain Defense System** | 3 | $12,000,000 | 500 | 15% missile interception chance each (max 45%) |
| **Military Command Center** | 3 | $9,000,000 | 750 | +1 offensive & defensive war slot each |
| **Advanced Military Academy** | 1 | $28,000,000 | 1,500 | Raises max military unit percentages |
| **Intelligence Operations Center** | 5 | $11,000,000 | 750 | 3 spies/day, 10 storage per center |
| **Elite Military Training Program** | 1 | $20,000,000 | 750 | Doubles barracks bonus (10%→20%) |
| **Advanced Tank Manufacturing** | 1 | $26,000,000 | 1,000 | Doubles factory bonus (10%→20%) |
| **Advanced Aircraft Systems** | 1 | $32,000,000 | 1,250 | Doubles airforce base bonus (10%→20%) |
| **Advanced Naval Operations** | 1 | $28,000,000 | 1,100 | Doubles harbor bonus (10%→20%) |
| **Military Salvage Operations** | 3 | $6,000,000 | 700 | 9% salvage rate each (max 27%) |

**Tips:**
- Missile Silos and Iron Curtain work together — build silos to attack, iron curtain to defend.
- Military Command Centers increase how many wars you can fight simultaneously.
- The four "Advanced" manufacturing projects double the effectiveness of their corresponding military improvements.
- Military Salvage Operations let you recover resources from defeated enemy units in war.

---

### Education Projects

| Project | Max | Cost | Tech | Prereq | Effect |
|---------|-----|------|------|--------|--------|
| **National University** | 3 | $10,000,000 | 500 | — | +10% literacy, +3 happiness, -5% tech costs each |
| **Advanced University** | 1 | $20,000,000 | 600 | University (1) | +10% research speed; prerequisite for Great Library |

**Tips:**
- Universities reduce tech costs, making later technologies cheaper to research.
- Advanced University requires only 1 University (not 5, unlike most prerequisites).
- Great Library wonder requires Advanced University.

---

### Healthcare Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Emergency Medical Hub** | 3 | $6,000,000 | 500 | -10% disease, +5 happiness each |

---

### Administration Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Government Monument** | 1 | $32,000,000 | 1,000 | Locks government choice forever (PERMANENT) |
| **Religious Monument** | 1 | $32,000,000 | 1,000 | Locks religion choice forever (PERMANENT) |

⚠️ **Warning:** Government Monument and Religious Monument are PERMANENT. They cannot be demolished once built. Only build them if you're certain about your government/religion choice.

---

### Security Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **SWAT Operations Center** | 3 | $8,000,000 | 750 | -15% crime, +2 happiness each |

---

### Science Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Advanced Research Institute** | 5 | $15,000,000 | 1,000 | Doubles Research Lab bonus when 5 built |

---

### Economic Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Sports Betting Complex** | 1 | $15,000,000 | 600 | +33% taxable income, +33% crime |
| **Trade Hub** | 3 | $5,000,000 | 500 | Permanent trade agreements, unlimited trade proposals |

**Tips:**
- Sports Betting gives a huge income boost but massively increases crime. Pair with Police Stations.
- Trade Hubs unlock permanent trade deals — essential for late-game economy.

---

### Infrastructure Projects

| Project | Max | Cost | Tech | Prereq | Effect |
|---------|-----|------|------|--------|--------|
| **Advanced Police Stations** | 3 | $8,000,000 | 800 | — | -10% crime, +2 happiness each |
| **Advanced Recycling Operations** | 1 | $20,000,000 | 800 | — | Doubles recycling effectiveness, reduces happiness |
| **Advanced Agriculture** | 1 | $10,000,000 | 800 | Farms (5) | Farms cover 2M population each |
| **Farm Synergy** | 1 | $15,000,000 | 1,000 | Farms (5) | Max-stack bonus 50%→100% |
| **Advanced Well Drilling** | 1 | $10,000,000 | 800 | Wells (5) | Wells cover 2M population each |
| **Well Synergy** | 1 | $15,000,000 | 1,000 | Wells (5) | Max-stack bonus 50%→100% |
| **Salvage Yard** | 1 | $8,000,000 | 600 | — | Enables resource recovery on demolition |

**Tips:**
- Farm Synergy and Well Synergy require 5 farms/wells first, then make 5-stack bonuses twice as effective.
- Salvage Yard is required for the Advanced Resource Recovery Complex wonder.

---

### Diplomacy Projects

| Project | Max | Cost | Tech | Effect |
|---------|-----|------|------|--------|
| **Financial Assistance Office** | 1 | $15,000,000 | 800 | Send monetary/tech aid; enhanced Intelligence Pacts |
| **Office of Relationships** | 1 | $13,000,000 | 500 | Change friends, foes, best friends, nemesis |

---

### Infrastructure (Special)

| Project | Max | Cost | Tech | Special |
|---------|-----|------|------|---------|
| **National Broadcasting Network** | 1 | $10,000,000 | 300 | World Forum voting, Congress eligible, no project slot |

**Tips:**
- Broadcasting Network doesn't count toward your project limit but still has the 14-day cooldown.
- Required for the Global Internet Network wonder.

---

## Wonders — The Pinnacle of Achievement

Wonders are unique, powerful structures that provide empire-wide benefits. Each nation can only build one of each wonder type.

### Administration Wonders

| Wonder | Cost | Tech | Prereq | Effect |
|--------|------|------|--------|--------|
| **Government Monument** | $50M | 500 | Govt Statue | Unlock government changes every 14 days |
| **Religious Monument** | $50M | 500 | Religious Statue | Unlock religion changes every 14 days |

---

### Science Wonders

| Wonder | Cost | Tech | Prereq | Effect |
|--------|------|------|--------|--------|
| **Great Library** | $75M | 600 | Advanced University | 2 simultaneous research, +25% speed, +200 research/day |
| **Universal Education System** | $75M | 2,000 | — | +25% literacy, -15% tech costs |
| **Universal Healthcare System** | $80M | 2,000 | — | -35% disease, +15 happiness |

---

### Military Wonders

| Wonder | Cost | Tech | Prereq | Effect |
|--------|------|------|--------|--------|
| **Enhanced Missile Silo Network** | $60M | 1,500 | Missile Silo | 2 missiles/day, 10 storage per silo |
| **Enhanced Intelligence Network** | $90M | 3,000 | Spy Operations | 5 spies/day, 15 storage per center |
| **Military Recovery Wonder** | $55M | 1,200 | Military Salvage | Doubles salvage rate to 18%, -2.5% soldier losses |
| **Nuclear Warhead Production Facility** | $100M | 750 | — | 1 nuke/day, 3 storage |
| **Enhanced Nuclear Arsenal** | $150M | 2,000 | Nuclear Facility | 2 nukes/day, 5 storage |
| **Supreme Military Command Complex** | $150M | 3,000 | — | +5% to each maxed military type, -0.5 happiness each |

---

### Infrastructure Wonders

| Wonder | Cost | Tech | Prereq | Effect |
|--------|------|------|--------|--------|
| **Advanced Resource Recovery Complex** | $70M | 1,500 | Salvage Yard | 30% improvement refund, 20% project refund, 10% wonder refund |
| **Supreme Environmental Protection Complex** | $90M | 2,200 | — | Triples recycling effectiveness, removes happiness penalty, +1 env/center |
| **Global Internet Network** | $60M | 1,500 | Broadcasting Network | World Forum voting on edicts and global policies |
| **Temple of Abundance** | $250M | 2,500 | Farms (5) | Food for ALL population (requires 5 farms) |
| **Aqueduct of Life** | $250M | 2,500 | Wells (5) | Water for ALL population (requires 5 wells) |

---

### Sports Wonders

| Wonder | Cost | Tech | Effect |
|--------|------|------|--------|
| **Basketball Stadium Complex** | $85M | 1,200 | Unlock basketball team |
| **Hockey Arena Complex** | $90M | 1,300 | Unlock hockey team |
| **Soccer Stadium Complex** | $80M | 1,100 | Unlock soccer team |

---

### Diplomacy Wonder

| Wonder | Cost | Tech | Effect |
|--------|------|------|--------|
| **Alliance Headquarters Complex** | $75M | 1,000 | Create alliances, +15% alliance bonus, 10 max treaties |

---

## Building Tips & Strategy

### Early Game
1. **Start with Internal Affairs Office** to unlock domestic policies.
2. **Build Foreign Affairs Office** if you plan to do diplomacy.
3. **Construct Farms and Wells** — you need food and water for your population.
4. **Build Ports** to start trading and generating income.
5. **Add Hospitals, Police Stations, and Schools** to keep your citizens healthy, safe, and educated.

### Mid Game
1. **Max out military improvements** (Barracks, Factory, Airforce Base, Harbor) to 5 each.
2. **Build Military Command Centers** to increase war slots.
3. **Construct Missile Silos** and **Iron Curtain** for offensive and defensive missile capability.
4. **Build projects that double military improvement bonuses** — they're force multipliers.
5. **Add Casinos** for income, but balance with Police Stations to control crime.

### Late Game
1. **Build Wonders** — they're expensive but game-changing.
2. **Temple of Abundance and Aqueduct of Life** solve food/water forever (but need 5 farms/wells first).
3. **Great Library** accelerates research significantly.
4. **Nuclear Warhead Facility** gives you ultimate deterrent capability.
5. **Supreme Military Command Complex** if you have all military improvements at max.

### Economy Management
- **Watch your upkeep:** Each improvement costs $25,000/day. Don't overbuild early.
- **Casinos boost income but increase crime.** Pair every 2-3 casinos with a Police Station.
- **Trade Hubs unlock permanent trade deals** — build them when you have the tech.
- **Universities reduce tech costs** — build them before researching expensive technologies.

### Military Strategy
- **Missile Silos produce 1 missile/day per silo.** Enhanced Missile Silo Network wonder doubles this to 2/day.
- **Iron Curtain intercepts incoming missiles** — build 3 for 45% interception chance.
- **Military Salvage Operations** recover resources after battles — build 3 for max 27% salvage.
- **Supreme Military Command Complex** gives +5% to each military type at max stacks (5). At all 4 maxed, that's +20% total military power but -2 happiness.

### Food & Water Strategy
- **5 Farms + Farm Synergy + Advanced Agriculture** = 5M population coverage with 100% stack bonus.
- **Temple of Abundance** feeds your entire nation regardless of size — but costs $250M and needs 5 farms.
- **Wells follow the same pattern** with Aqueduct of Life for water.

---

## Quick Reference Tables

### Improvement Costs (Sorted by Cost)

| Improvement | Cost | Category |
|-------------|------|----------|
| Tree Plantation | $450,000 | Infrastructure |
| Well | $500,000 | Food/Water |
| Farm | $500,000 | Food/Water |
| Park | $650,000 | Infrastructure |
| Police Station | $750,000 | Infrastructure |
| Hospital | $900,000 | Infrastructure |
| Port | $800,000 | Trade |
| Embassy | $1,200,000 | Diplomacy |
| School | $1,000,000 | Infrastructure |
| Recycling Center | $1,100,000 | Infrastructure |
| Barracks | $1,500,000 | Military |
| Factory | $2,000,000 | Military |
| Airforce Base | $2,800,000 | Military |
| Harbor | $2,500,000 | Military |
| Casino | $1,800,000 | Economic |
| Internal Affairs Office | $3,000,000 | Administration |
| Foreign Affairs Office | $3,500,000 | Diplomacy |

### Project Costs (Sorted by Cost)

| Project | Cost | Tech |
|---------|------|------|
| Trade Hub | $5,000,000 | 500 |
| Emergency Medical Hub | $6,000,000 | 500 |
| National University | $10,000,000 | 500 |
| National Broadcasting Network | $10,000,000 | 300 |
| Military Salvage Operations | $6,000,000 | 700 |
| Missile Silo | $8,000,000 | 500 |
| Advanced Police Stations | $8,000,000 | 800 |
| SWAT Operations Center | $8,000,000 | 750 |
| Salvage Yard | $8,000,000 | 600 |
| Iron Curtain Defense System | $12,000,000 | 500 |
| Military Command Center | $9,000,000 | 750 |
| Office of Relationships | $13,000,000 | 500 |
| Sports Betting Complex | $15,000,000 | 600 |
| Advanced Agriculture | $10,000,000 | 800 |
| Farm Synergy | $15,000,000 | 1,000 |
| Advanced Well Drilling | $10,000,000 | 800 |
| Well Synergy | $15,000,000 | 1,000 |
| Intelligence Operations Center | $11,000,000 | 750 |
| Advanced Research Institute | $15,000,000 | 1,000 |
| Financial Assistance Office | $15,000,000 | 800 |
| Elite Military Training Program | $20,000,000 | 750 |
| Advanced University | $20,000,000 | 600 |
| Advanced Tank Manufacturing | $26,000,000 | 1,000 |
| Advanced Naval Operations | $28,000,000 | 1,100 |
| Advanced Aircraft Systems | $32,000,000 | 1,250 |

### Wonder Costs (Sorted by Cost)

| Wonder | Cost | Tech |
|--------|------|------|
| Government Monument | $50M | 500 |
| Religious Monument | $50M | 500 |
| Enhanced Missile Silo Network | $60M | 1,500 |
| Global Internet Network | $60M | 1,500 |
| Military Recovery Wonder | $55M | 1,200 |
| Advanced Resource Recovery Complex | $70M | 1,500 |
| Great Library | $75M | 600 |
| Universal Education System | $75M | 2,000 |
| Alliance Headquarters Complex | $75M | 1,000 |
| Clean Mining Operations Wonder | $75M | 1,800 |
| Universal Healthcare System | $80M | 2,000 |
| Supreme Manufacturing Complex | $85M | 1,800 |
| Basketball Stadium Complex | $85M | 1,200 |
| Supreme Environmental Protection Complex | $90M | 2,200 |
| Hockey Arena Complex | $90M | 1,300 |
| Enhanced Intelligence Network | $90M | 3,000 |
| Nuclear Warhead Production Facility | $100M | 750 |
| Enhanced Nuclear Arsenal | $150M | 2,000 |
| Supreme Military Command Complex | $150M | 3,000 |
| Temple of Abundance | $250M | 2,500 |
| Aqueduct of Life | $250M | 2,500 |

---

## Final Advice

- **Plan your territory:** Each territory gives 1 improvement slot. Expand territory before you run out of building space.
- **Watch cooldowns:** Projects have 14-day cooldowns, wonders have 28-day cooldowns. Time your builds carefully.
- **Balance is key:** Don't ignore happiness, crime, disease, or pollution — they can cripple your nation even with a strong military.
- **Prerequisites matter:** Check requirements before saving for expensive buildings. Some wonders need 5 farms/wells, specific projects, or other wonders first.
- **Upkeep adds up:** $25,000 per improvement per day. A large empire with many improvements needs a matching economy.

Good luck building your empire!
