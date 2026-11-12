"use strict";
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function quantity(value, max = 1_000_000_000) {
  check(
    Number.isSafeInteger(value) && value > 0 && value <= max,
    `Quantity must be a whole number from 1 to ${max}`,
  );
  return value;
}

const GLOBAL_DISEASES_DATA = require("../../assets/data/diseases/global-diseases.js");
const NATIONAL_DISEASES_DATA = require("../../assets/data/diseases/national-diseases.js");

class DiseaseManager {
  constructor(world) {
    this.world = world;
  }

  GLOBAL_DISEASES = GLOBAL_DISEASES_DATA;
  NATIONAL_DISEASES = NATIONAL_DISEASES_DATA;

  /**
   * Compute global averages and disease stats from every nation's nationStats.
   */
  computeGlobalWorld() {
    const world = this.world;
    const nations = [...world.rules.values()].map((r) => r.nation);
    const count = nations.length;
    if (count === 0) {
      return {
        globalAverages: { happiness: 50, pollution: 0, disease: 0, crime: 0, environment: 50, literacyRate: 50 },
        diseaseStats: { totalNations: 0, nationsWithMinorDisease: 0, nationsWithMajorDisease: 0, pctWithMinorDisease: 0, pctWithMajorDisease: 0, totalMinorOutbreaks: 0, totalMajorOutbreaks: 0 },
        activeGlobalDisease: world.state.globalWorld?.activeGlobalDisease || null,
        globalDiseaseSpawnChance: 0,
      };
    }

    let sumHappiness = 0;
    let sumPollution = 0;
    let sumDisease = 0;
    let sumCrime = 0;
    let sumEnvironment = 0;
    let sumLiteracy = 0;
    let nationsWithMinorDisease = 0;
    let nationsWithMajorDisease = 0;
    let totalMinorOutbreaks = 0;
    let totalMajorOutbreaks = 0;

    for (const n of nations) {
      const ns = n.nationStats || {};
      sumHappiness += ns.happiness !== undefined ? ns.happiness : 50;
      sumPollution += ns.pollution !== undefined ? ns.pollution : 0;
      sumDisease += ns.disease !== undefined ? ns.disease : 10;
      sumCrime += ns.crime !== undefined ? ns.crime : 15;
      sumEnvironment += ns.environment !== undefined ? ns.environment : 50;
      sumLiteracy += ns.literacy !== undefined ? ns.literacy : 0;

      const disease = ns.disease || 0;
      if (disease > 0 && disease < 40) {
        nationsWithMinorDisease++;
        totalMinorOutbreaks++;
      } else if (disease >= 40) {
        nationsWithMajorDisease++;
        totalMajorOutbreaks++;
      }
    }

    const avg = (value) => count ? Math.round((value / count) * 100) / 100 : 0;

    // Disease spawn chance: higher when global pollution/disease high, happiness/environment low
    const gw = world.state.globalWorld || {};
    let chance = 0.01; // 1% base per day
    const pollutionAvg = avg(sumPollution);
    const diseaseAvg = avg(sumDisease);
    const happinessAvg = avg(sumHappiness);
    const environmentAvg = avg(sumEnvironment);
    if (pollutionAvg > 60) chance *= 1 + ((pollutionAvg - 60) / 100) * 1.5;
    if (diseaseAvg > 30) chance *= 1 + (diseaseAvg - 30) / 100;
    if (happinessAvg < 40) chance *= 1 + ((40 - happinessAvg) / 40) * 1.5;
    if (environmentAvg < 40) chance *= 1 + ((40 - environmentAvg) / 40) * 0.5;

    const activeGlobalDisease = gw.activeGlobalDisease || null;

    return {
      globalAverages: {
        happiness: avg(sumHappiness),
        pollution: avg(sumPollution),
        disease: avg(sumDisease),
        crime: avg(sumCrime),
        environment: avg(sumEnvironment),
        literacyRate: avg(sumLiteracy),
      },
      diseaseStats: {
        totalNations: count,
        nationsWithMinorDisease: nationsWithMinorDisease,
        nationsWithMajorDisease: nationsWithMajorDisease,
        pctWithMinorDisease: count ? Math.round((nationsWithMinorDisease / count) * 100) : 0,
        pctWithMajorDisease: count ? Math.round((nationsWithMajorDisease / count) * 100) : 0,
        totalMinorOutbreaks,
        totalMajorOutbreaks,
      },
      activeGlobalDisease,
      globalDiseaseSpawnChance: Math.round(chance * 10000) / 100,
    };
  }

  /**
   * Roll for a global disease spawn on day change. Uses GLOBAL_DISEASES data.
   */
  rollGlobalDiseaseSpawn() {
    const world = this.world;
    const gw = this.computeGlobalWorld();
    if (gw.activeGlobalDisease) return; // one global disease at a time
    if (Math.random() >= gw.globalDiseaseSpawnChance / 100) return;

    const severityPool = [];
    const pollution = gw.globalAverages.pollution;
    const disease = gw.globalAverages.disease;
    const happiness = gw.globalAverages.happiness;
    const environment = gw.globalAverages.environment;

    let weights = { minor: 1.0, major: 0.3, severe: 0.1 };
    if (pollution > 60) { weights.major *= 1.5; weights.severe *= 2.0; }
    if (disease > 30) { weights.major *= 1.2; weights.severe *= 1.2; }
    if (happiness < 40) { weights.major *= 1.2; weights.severe *= 1.5; }
    if (environment < 40) { weights.major *= 1.2; weights.severe *= 1.2; }

    for (const [severity, weight] of Object.entries(weights)) {
      const list = this.GLOBAL_DISEASES[severity] || [];
      const count = Math.max(1, Math.floor(weight * 10));
      for (let i = 0; i < count; i++) severityPool.push(list[Math.floor(Math.random() * list.length)]);
    }

    if (severityPool.length === 0) return;
    const pickedDisease = severityPool[Math.floor(Math.random() * severityPool.length)];
    world.state.globalWorld = world.state.globalWorld || {};
    world.state.globalWorld.activeGlobalDisease = {
      ...pickedDisease,
      spawnedAt: world.state.day,
      funded: 0,
      cureTarget: pickedDisease.cureRequirement?.money ?? (pickedDisease.severity === 'severe' ? 50000000 : pickedDisease.severity === 'major' ? 20000000 : 5000000),
    };
  }

  /**
   * Fund the cure for the active global disease.
   */
  fundGlobalDiseaseCure(r, amount) {
    const world = this.world;
    const n = r.nation;
    amount = Number(amount);
    if (!amount || amount <= 0) throw new Error('Invalid funding amount');
    const reasons = world.affordability(n, { money: amount });
    if (reasons.length) throw new Error('Insufficient funds');
    const gw = world.state.globalWorld || {};
    const disease = gw.activeGlobalDisease;
    if (!disease) throw new Error('No active global disease to fund');
    world.pay(n, { money: amount });
    disease.funded = (disease.funded || 0) + amount;
    if (disease.funded >= disease.cureTarget) {
      disease.cured = true;
      disease.curedAt = world.state.day;
    }
    world.refresh(r);
  }

  /**
   * Cure a disease outbreak for a nation.
   */
  cureDiseaseAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { outbreakId } = data;
    check(outbreakId && typeof outbreakId === "string", "Outbreak ID required");
    // Cure cost: $500,000 per outbreak
    const cureCost = 500000;
    check(n.money >= cureCost, `Insufficient funds: need $${cureCost.toLocaleString()}`);
    n.money -= cureCost;
    world.refresh(r);
  }
}

module.exports = { DiseaseManager };
