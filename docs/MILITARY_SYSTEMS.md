# Empire Builder - Military Systems Documentation

## 📊 **CURRENT IMPLEMENTATION STATUS: 75% COMPLETE**

The Empire Builder military system has a sophisticated foundation with complete mathematical frameworks, unit systems, and combat effectiveness calculations. What's missing are primarily user interfaces and battle simulation mechanics.

---

## ⚔️ **MILITARY UNITS SYSTEM**

### **Core Unit Types (COMPLETE)**
The game implements seven distinct military unit categories with resource costs, population impacts, and technology progression:

| Unit Type | Money Cost | Resource Cost | Tech Required | Population Impact | Maintenance/Day | Description |
|-----------|------------|---------------|---------------|-------------------|-----------------|-------------|
| **Soldiers** | $1 each | 1 food each | None | -1 pop per 10 units for 1 day | $1 + 1 food per 100 units | Basic infantry forces |
| **Tanks** | $50 each | 5 steel each | **150 tech** | -1 pop per unit for 1 day | $15 + 1 steel per 10 units | Armored vehicles |
| **Aircraft** | $150 each | 15 aluminum each | **300 tech** | -2 pop per unit for 1 day | $50 + 3 aluminum each | Military aircraft |
| **Ships** | $500 each | 30 steel each | **450 tech** | -5 pop per unit for 1 day | $150 + 5 steel each | Naval vessels |
| **Spies** | $100,000 each | 50 ammo + 25 food | Spy Operations | No population impact | $500 + 5 ammo + 5 food each | Intelligence operatives |
| **Missiles** | $500,000 each | 500 gas + 500 ammo | Missile Silo | No population impact | $1,000 + 5 ammo + 5 gas each | Ballistic missiles |
| **Nukes** | $1,500,000 each | 1000 gas + 1000 uranium | Nuclear Facility | -1 happiness for 1 day | $5,000 + 50 ammo + 50 uranium each | Nuclear warheads |

### **Military Technology Progression**
The military system now enforces technological advancement requirements:

| Technology Level | Units Unlocked | Strategic Impact |
|------------------|----------------|------------------|
| **0-149 tech** | Soldiers only | Infantry-focused early game |
| **150+ tech** | Soldiers + Tanks | Armored warfare capability |
| **300+ tech** | Ground forces + Aircraft | Air superiority and bombing |
| **450+ tech** | Full conventional military | Naval power projection |
| **500+ tech** | Advanced projects | Missile and spy capabilities |
| **750+ tech** | Nuclear weapons | Ultimate strategic deterrence |

### **Unit Capacity Limits**
| Unit Type | Base Limit | Academy Limit | Prerequisites |
|-----------|------------|---------------|---------------|
| **Soldiers** | 20% of population | 30% of population | None |
| **Tanks** | 10% of population | 20% of population | **150 tech minimum** |
| **Aircraft** | 7.5% of population | 10% of population | **300 tech minimum** |
| **Ships** | 5% of population | 7.5% of population | **450 tech minimum** |
| **Spies** | 1% of population | 1% of population | Spy Operations project |
| **Missiles** | 0.5% of population | 0.5% of population | Missile Silo project |
| **Nukes** | 0.1% of population | 0.1% of population | Nuclear Warhead Facility wonder |

### **Unit Training System (IMPLEMENTED)**
```javascript
// New comprehensive cost calculation with tech requirements
unitCosts = {
    soldiers: { money: $1, resources: { food: 1 }, populationImpact: 0.1, techRequired: 0 },
    tanks: { money: $50, resources: { steel: 5 }, populationImpact: 1, techRequired: 150 },
    aircraft: { money: $150, resources: { aluminum: 15 }, populationImpact: 2, techRequired: 300 },
    ships: { money: $500, resources: { steel: 30 }, populationImpact: 5, techRequired: 450 },
    spies: { money: $100000, resources: { ammo: 50, food: 25 }, prerequisite: 'spyOperations' },
    missiles: { money: $500000, resources: { gas: 500, ammo: 500 }, prerequisite: 'missileSilo' },
    nukes: { money: $1500000, resources: { gas: 1000, uranium: 1000 }, prerequisite: 'nuclearWarheadFacility', happinessImpact: 1 }
};

// Technology requirement checks
if (unitType.techRequired && nation.tech < unitType.techRequired) {
    throw new Error(`Insufficient technology: need ${unitType.techRequired}, have ${nation.tech}`);
}

// Daily maintenance costs (unchanged)
maintenanceCosts = {
    soldiers: { money: $1, food: 1 } per 100 units,
    tanks: { money: $15, steel: 1 } per 10 units,
    aircraft: { money: $50, aluminum: 3 } per unit,
    ships: { money: $150, steel: 5 } per unit,
    spies: { money: $500, ammo: 5, food: 5 } per unit,
    missiles: { money: $1000, ammo: 5, gas: 5 } per unit,
    nukes: { money: $5000, ammo: 50, uranium: 50 } per unit
};
```

**Strategic Features:**
- **Technology Progression**: Must research to unlock advanced units
- **Resource Requirements**: Each unit type requires specific materials  
- **Population Impact**: Military recruitment temporarily reduces available workforce
- **Maintenance Costs**: Daily upkeep prevents unlimited military buildup
- **Prerequisites**: Advanced units require specific buildings/projects
- **Skill Discounts**: Player attack skill reduces training costs (up to 20% discount)
- **Maintenance Deficits**: Units at 50% effectiveness if maintenance can't be paid

---

## 💪 **MILITARY STRENGTH CALCULATION**

### **Base Strength Formula (WORKING)**
```javascript
// Unit contribution to total strength (updated values)
unitStrengthValues = {
    soldiers: 1 point each,
    tanks: 25 points each, 
    aircraft: 100 points each,
    ships: 200 points each,
    spies: 10 points each,        // Intelligence value
    missiles: 500 points each,    // High strategic value  
    nukes: 2000 points each       // Ultimate strategic value
};

baseMilitaryStrength = sum(units × unitStrengthValues);
totalMilitaryStrength = baseMilitaryStrength + attackSkillValue + defenseSkillValue;

// Maintenance deficit penalty
if (cannotPayMaintenance) {
    totalMilitaryStrength *= 0.5;  // 50% effectiveness penalty
}
```

### **Military Morale Multiplier (CRITICAL SYSTEM)**
Military morale affects ALL military effectiveness:
```javascript
militaryMorale = 1.0 + (happiness-50)×0.01 + literacy×0.005 - crime×0.002 - disease×0.003;
// Range: 0.5x to 2.0x effectiveness
```

**Impact Sources:**
- **Happiness**: Each point above 50 = +1% morale, below 50 = -1% morale
- **Literacy**: Each percentage point = +0.5% morale  
- **Crime**: Each percentage point = -0.2% morale
- **Disease**: Each percentage point = -0.3% morale

---

## 🏗️ **MILITARY BUILDINGS & EFFECTIVENESS**

### **Military Improvement Buildings (IMPLEMENTED)**

| Building | Max Count | Effect | Enhanced Effect | Cost |
|----------|-----------|--------|-----------------|------|
| **Barracks** | 5 | +10% soldier effectiveness | +20% with Enhanced Barracks | $1.2M + cement/lumber |
| **Factory** | 5 | +10% tank effectiveness | +20% with Enhanced Factories | $1.8M + steel/aluminum |  
| **Airforce Base** | 5 | +10% aircraft effectiveness | +20% with Enhanced Airforces | $2.5M + aluminum/cement |
| **Harbor** | 5 | +10% ship effectiveness | +20% with Enhanced Navy | $2.2M + steel/cement |

### **Supreme Military Wonder Effects**
When ALL military buildings reach maximum (5 each) AND Supreme Military Wonder is built:
- Additional +5% effectiveness bonus per building type
- Happiness penalty: -0.5 per maxed building type (motivation through military supremacy)

---

## 🚀 **ADVANCED MILITARY SYSTEMS**

### **Missile System (COMPLETE)**

**Missile Silos:**
- Production: 1 missile per day per silo
- Storage: 5 missiles per silo  
- Maximum: 3 missile silos per nation
- Enhanced (Wonder): 2 missiles/day, 10 storage each

**Iron Curtain Defense:**
- Interception: 15% chance per system
- Maximum: 3 systems (45% total interception)
- Stacking: Multiple systems add interception chances

**Missile Damage Formula:**
```javascript
missileDamage = 1000 × militaryMorale × missileTypeMultiplier;
```

### **Nuclear Weapons (COMPLETE)**

**Nuclear Warhead Facility (Wonder):**
- Requires: Technology level 750, massive resource investment
- Production: 1 nuclear warhead per day
- Storage: 3 nuclear warheads maximum
- Tech Required: 750 minimum

**Enhanced Nuclear Arsenal (Wonder):**
- Requires: Nuclear Warhead Facility + Technology level 2000
- Production: 2 nuclear warheads per day  
- Storage: 5 nuclear warheads maximum
- Ultimate military deterrent capability

**Nuclear Damage:**
```javascript
nuclearDamage = 10000 × militaryMorale × targetTypeMultiplier;
```

### **Military Command Structure**

**Command Centers:**
- Effect: +1 war slot per center (offensive & defensive)
- Base war capacity: 2 simultaneous wars
- Maximum: 3 command centers (+3 additional war slots)
- Enables complex multi-front warfare

**Military Academy:**
- Dramatically increases unit capacity limits:
  - Soldiers: 20% → 30% of population
  - Tanks: 10% → 20% of population  
  - Aircraft: 7.5% → 10% of population
  - Ships: 5% → 7.5% of population
- Single build per nation (massive investment)

---

## ⚡ **COMBAT EFFECTIVENESS SYSTEM**

### **Master Combat Formula (IMPLEMENTED)**
```javascript
finalCombatDamage = baseDamage × militaryMorale × improvementBonuses × diplomaticWarBonuses;
```

### **Combat Damage Components**

**1. Base Damage:**
- Weapon damage + player skill bonuses (attack, aim, critical chance)
- Player combat skills provide flat damage increases

**2. Military Morale Multiplier:**
- 0.5x to 2.0x effectiveness based on nation statistics
- Affects ALL military actions uniformly

**3. Improvement Bonuses:**
- Unit-specific bonuses from military buildings
- 10% base, 20% enhanced, +5% supreme per building

**4. Diplomatic War Bonuses (UP TO +125%):**
```javascript
friendBonus = friendsInWar × 0.05;        // +5% per friend in war
foeBonus = foesInWar × 0.05;              // +5% per foe relationship  
bestFriendBonus = bestFriendInWar ? 0.15 : 0;  // +15% if best friend in war
nemesisBonus = nemesisInWar ? 0.15 : 0;         // +15% if nemesis in war
totalBonus = min(1.25, friendBonus + foeBonus + bestFriendBonus + nemesisBonus);
```

---

## 🛡️ **MILITARY BALANCE MECHANICS**

### **Population Impact System (NEW)**
Military recruitment now has immediate workforce consequences:

**Recruitment Population Impact:**
- Every 10 soldiers = -1 population for 24 hours (1 game day)
- Every tank = -1 population for 24 hours
- Every aircraft = -2 population for 24 hours  
- Every ship = -5 population for 24 hours
- Spies, missiles, nukes have no population impact

This prevents mass military buildup and creates strategic timing decisions around recruitment.

### **Daily Maintenance System (NEW)**
All military units require ongoing resource investment:

**Maintenance Costs Per Day:**
- **100 Soldiers**: $1 + 1 food
- **10 Tanks**: $15 + 1 steel  
- **Each Aircraft**: $50 + 3 aluminum
- **Each Ship**: $150 + 5 steel
- **Each Spy**: $500 + 5 ammo + 5 food
- **Each Missile**: $1,000 + 5 ammo + 5 gas
- **Each Nuke**: $5,000 + 50 ammo + 50 uranium

**Maintenance Deficit Consequences:**
- Cannot pay maintenance = 50% military effectiveness penalty
- Forces strategic resource management and prevents infinite military growth
- Creates natural military size limits based on economic capacity

### **Nuclear Weapons Psychological Impact (NEW)**
- Each nuclear weapon produced causes -1 happiness for 24 hours
- Represents population fear and international pressure
- Balances nuclear power with domestic stability costs

### **Resource-Based Military Strategy (NEW)**
Different unit types require different resource investments:
- **Infantry Focus**: Requires sustainable food production
- **Armor Focus**: Demands steel production and reserves
- **Air Superiority**: Aluminum-intensive strategy
- **Naval Power**: Steel-heavy maritime strategy
- **Special Operations**: Ammunition and food for spy networks
- **Strategic Weapons**: Gas/uranium for missile/nuclear programs

### **Military Force Penalties**
```javascript
totalMilitaryUnits = soldiers + tanks + aircraft + ships + spies + missiles + nukes;
militaryPercentage = totalMilitaryUnits / population;

if (militaryPercentage > 0.25) {
    happinessPenalty = -10;  // Excessive militarization reduces civilian happiness
}
```

### **Resource Integration**

**Arms Pile Bonus Resource:**
- Requirements: Gas + Ammunition + Steel + Aluminum
- Effects: +30% military strength, -20% unit training costs
- Major strategic advantage for military-focused nations

**Military Policy Effects:**
| Policy | Military Strength Modifier | Other Effects |
|--------|---------------------------|---------------|
| **Pacifist** | -30% | +15% diplomatic reputation, -15% government spending |
| **Defensive** | 0% | +5% diplomatic reputation |
| **Balanced** | +10% | +10% government spending |
| **Aggressive** | +25% | -15% diplomatic reputation, +25% government spending |

---

## 📋 **WHAT'S IMPLEMENTED vs WHAT'S MISSING**

### ✅ **COMPLETE SYSTEMS**
- [x] Military unit definitions and capacity calculations
- [x] Unit training costs and skill-based discounts  
- [x] Military strength calculation with all bonuses
- [x] Military morale system affecting all effectiveness
- [x] Military building effectiveness bonuses
- [x] Missile production, storage, and interception systems
- [x] Nuclear weapon production and storage
- [x] Combat damage formulas with all multipliers
- [x] Diplomatic combat bonuses (+125% maximum)
- [x] Military force penalties for excessive militarization
- [x] Player combat skill integration (7 skills)
- [x] Government/religion/policy military modifiers
- [x] Resource bonus integration (Arms Pile)
- [x] Command structure (war slots, military academies)

### ❌ **MISSING SYSTEMS**

**User Interfaces (0% Complete):**
- [ ] Military Forces panel to view current units
- [ ] Unit recruitment interface with cost calculations
- [ ] Military deployment and positioning system
- [ ] War planning and strategy interface
- [ ] Battle result visualization
- [ ] Military technology research panel

**Battle Mechanics (0% Complete):**
- [ ] War declaration system
- [ ] Battle simulation engine
- [ ] Battle outcome calculations  
- [ ] Unit casualty and loss mechanics
- [ ] Siege and defensive battle types
- [ ] Battle result processing and effects

**Advanced Military Features:**
- [ ] Unit positioning and movement on map
- [ ] Terrain-based combat modifiers
- [ ] Supply line and logistics mechanics
- [ ] Air superiority and naval blockade systems
- [ ] Military intelligence operations (spies functional but limited)
- [ ] Advanced military technologies beyond building enhancements

---

## 🎯 **IMPLEMENTATION PRIORITY**

### **Phase 1: Core Interfaces (Next 2 weeks)**
1. **Military Forces Panel** - Display current units, capacity limits, and effectiveness
2. **Unit Recruitment Interface** - Train units with real-time cost calculations
3. **Basic War Declaration** - Simple war mechanics using existing diplomatic framework

### **Phase 2: Battle System (2-4 weeks)**  
1. **Battle Simulation Engine** - Use existing combat formulas for battle resolution
2. **War Mechanics** - Complete war declaration, conduct, and peace systems
3. **Battle Results** - Unit losses, territory changes, war outcome effects

### **Phase 3: Advanced Features (4-6 weeks)**
1. **Military Technology Trees** - Research system for military improvements
2. **Strategic Positioning** - Unit deployment and movement systems  
3. **Advanced Warfare** - Siege mechanics, air/naval superiority, intelligence operations

---

## 💡 **STRATEGIC MILITARY GAMEPLAY**

The implemented military system creates deep strategic choices:

**Resource Allocation:**
- Military investment vs economic growth
- Unit type specialization vs balanced forces  
- Building improvements vs unit quantity

**Diplomatic Strategy:**
- Friend/foe relationships for combat bonuses
- War timing based on diplomatic situation
- Alliance coordination for maximum effectiveness

**Technology Focus:**
- Military building enhancements
- Missile/nuclear weapon development
- Military Academy for force projection

**Government/Religion Selection:**
- Military-focused governments (+30% strength)
- Balanced vs specialized military policies
- Long-term vs short-term military strategies

The system rewards both military specialization and balanced development, with multiple viable paths to military dominance through different combinations of units, buildings, technologies, and diplomatic relationships.