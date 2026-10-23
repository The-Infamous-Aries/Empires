# Entity Integration Guide - Empire Game

## Overview
All entity files have been updated to properly integrate with your existing sophisticated 97% complete game systems. The entities now work seamlessly with Nation's economic formulas, Player skill bonuses, Alliance mechanics, and all your established systems.

## Integration Architecture

### Data Flow Pattern
```
Entities → Generate/modify data (City produces resources, Building provides effects)
Systems → Process and aggregate (resource-system totals production, buildings-system sums effects)  
Nation → Receives final aggregated values (resources, effects, statistics)
Player → Applies bonuses on top (skill multipliers, legendary bonuses)
```

## Entity Integration Details

### City.js - Regional Management
**Integration Points:**
- Links to `Nation.territories` for geographic placement
- Contributes to `Nation.population` calculations via `updatePopulation()`
- Resources feed into `Nation.resources` through `contributeToNation()`
- Building effects aggregate into `Nation.improvementEffects`
- Uses Nation's happiness and infrastructure formulas

**Key Methods:**
- `updateFromNation()` - Syncs with Nation state
- `contributeToNation()` - Adds city stats to national totals
- `addBuilding(buildingName, quantity)` - Updates both city and Nation.improvements
- `produceResources()` - Uses Nation's resource system and primary resource

### Building.js - Infrastructure
**Integration Points:**
- Links to Nation's BuildingsSystem data for all stats and costs
- Effects applied to `Nation.improvementEffects`, `Nation.projectEffects`, `Nation.wonderEffects`
- Maintenance costs deducted from `Nation.money`
- Worker assignments draw from population pools

**Key Methods:**
- `getNationBuildingData()` - Gets building data from Nation's systems
- `applyEffectsToNation()` - Adds building effects to Nation
- `updateNationCount()` - Updates Nation.improvements/projects counts
- `getEffectiveValue()` - Accounts for condition, efficiency, quantity

### MilitaryUnit.js - Combat Forces
**Integration Points:**
- Units aggregate into `Nation.militaryUnits` totals
- Strength contributes to `Nation.militaryStrength`
- Affected by `Nation.nationStats.militaryMorale`
- Uses Player combat skills (Attack, Defense, etc.)
- Maintenance tracked in `Nation.militaryBudget`

**Key Methods:**
- `calculateEffectiveStrength()` - Applies Nation morale, Player skills, building bonuses
- `updateNationMilitaryStrength()` - Contributes to Nation military power
- `getNationUnitTypeData()` - Uses Nation's war system unit data
- `affectedByPlayerSkills` - Integrates Player skill bonuses

### Technology.js - Research System
**Integration Points:**
- Links to Nation.technologies Set and Nation.currentResearch
- Uses DataIntegrationSystem's research database
- Effects applied to Nation.technologyBonuses/technologyEffects
- Research progress synced with Nation.researchProgress
- Prerequisites gate availability through Nation.technologies

**Key Methods:**
- `getTechnologyData()` - Uses research database files (economy-research.js, etc.)
- `startResearch()` - Sets Nation.currentResearch
- `completeResearch()` - Adds to Nation.technologies, applies effects
- `applyEffectsToNation()` - Applies technology bonuses to Nation
- `canResearch()` - Checks Nation prerequisites and tech level

### Resource.js - Production & Trade
**Integration Points:**
- Daily production feeds into `Nation.resources` via ResourceSystem
- Extraction rates modified by Nation building bonuses
- Market integration with EconomySystem trading
- Environmental impact affects `Nation.nationStats.pollution`
- Critical resources (water/food) affect Nation happiness

**Key Methods:**
- `contributeToNation()` - Adds daily production to Nation.resources
- `getDailyProduction()` - Applies Nation efficiency bonuses
- `getNationResourceTypeData()` - Uses Nation's resource system data
- `canExtract()` - Checks Nation has required buildings
- `applyEffectsToNation()` - Affects pollution and critical resource penalties

### Citizen.js - Population Detail
**Integration Points:**
- Aggregates to Nation.population calculations
- Tax payments contribute to Nation.taxRevenue
- Employment links to Building.currentWorkers
- Happiness/loyalty influences Nation.happiness and stability
- Education affected by Nation.nationStats.literacy

**Key Methods:**
- `updateFromNationState()` - Syncs with Nation statistics
- `payTaxesToNation()` - Contributes to Nation tax revenue
- `applyNationEffects()` - Initial generation based on Nation state
- `getStatsContribution()` - Provides data for Nation statistics
- `registerWithNation()` - Adds to Nation.citizens tracking

## System Integration Points

### ResourceSystem Integration
```javascript
// resource-system.js processes daily through:
generateTerritoryResources() // Uses Resource entities for territory-based production
processManufacturing()       // Uses Building entities for factory production  
calculateBonusEffects()      // Aggregates City and Building bonuses
```

### BuildingsSystem Integration  
```javascript
// buildings-system.js manages:
calculateImprovementEffects() // Aggregates Building entity effects
calculateProjectEffects()     // Sums project Building effects
calculateWonderEffects()      // Applies wonder Building bonuses
```

### EconomySystem Integration
```javascript
// economy-system.js handles:
// Market prices (integrates Resource.js market values)  
// Industry production (uses Building entities)
// Resource requirements and consumption chains
```

## Event Integration
- All entities emit events on major changes
- Systems listen for entity events and update aggregations
- Nation processes system updates in daily/monthly cycles
- DataManager serializes complete state including all entities

## Storage Pattern
```javascript
// Entities stored in Nation arrays:
Nation.cities[]         // City entities
Nation.buildings[]      // Building entities  
Nation.militaryUnits[]  // MilitaryUnit entities
Nation.resources[]      // Resource entities
Nation.citizens[]       // Citizen entities
Nation.technologies     // Technology Set

// Systems maintain references and process entity collections
// Serialization/deserialization handles entity reconstruction
// IDs used for cross-references between entities
```

## Usage Example
```javascript
// Create a new city
const city = new City('New Capital', Nation, {x: 100, y: 100});
city.isCapital = true;

// Add buildings through city (automatically updates Nation)
city.addBuilding('port', 2);     // Adds to both city and Nation.improvements
city.addBuilding('mine', 3);     // Triggers Nation effect recalculation

// Buildings automatically integrate with Nation systems
const building = new Building('university', 'project', city.id, Nation.id);
building.applyEffectsToNation(); // Adds to Nation.projectEffects

// Military units contribute to Nation strength
const unit = new MilitaryUnit('soldiers', 1000);
unit.updateNationMilitaryStrength(); // Adds to Nation.militaryStrength

// Technology research integrates with Nation
const tech = new Technology('mathematics');
tech.startResearch();            // Sets Nation.currentResearch = 'mathematics'
tech.completeResearch();         // Adds to Nation.technologies, applies bonuses

// Resources produce for Nation
const resource = new Resource('iron', 1000, 'territory_1');  
resource.contributeToNation();   // Adds to Nation.resources.iron

// Citizens contribute to Nation economy
const citizen = new Citizen(Nation.id);
citizen.payTaxesToNation(Nation.taxRate); // Adds to Nation.taxRevenue
```

## Compatibility
All entities are fully backward compatible with your existing:
- Economic formulas and calculations
- Player skill system and bonuses  
- Alliance mechanics and warfare
- Research system and technology trees
- Resource production and trading
- Population and happiness calculations
- Building effects and bonuses
- Military strength and combat

The entities enhance your existing systems without breaking any established functionality.