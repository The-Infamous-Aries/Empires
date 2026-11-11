"use strict";

class LoginManager {
  constructor(world) {
    this.world = world;
  }

  /**
   * Update a nation's login date when they log in.
   * Call this from socket handlers when a player authenticates.
   * @param {Object} nation
   * @param {string} dateStr - YYYY-MM-DD date string
   */
  updateLoginDate(nation, dateStr) {
    if (!nation.equipment) return;
    nation.equipment.loginStreakChests = nation.equipment.loginStreakChests || {
      consecutiveDays: 0,
      lastLoginDate: null,
      weeklyChestCount: 0,
      monthlyChestCount: 0,
      loginMonthYear: null,
      allMonthDaysLogged: false,
    };
    const ls = nation.equipment.loginStreakChests;
    const today = dateStr || new Date().toISOString().slice(0, 10);
    const todayStr = today.slice(0, 10);
    const todayMonth = todayStr.slice(0, 7); // YYYY-MM

    // Reset month tracking if new month
    if (ls.loginMonthYear !== todayMonth) {
      ls.loginMonthYear = todayMonth;
      ls.weeklyChestCount = 0;
      ls.monthlyChestCount = 0;
      ls.allMonthDaysLogged = true;
      ls.consecutiveDays = 0;
    }

    // If already logged in today, don't increment streak
    if (ls.lastLoginDate === todayStr) return;

    // Check if consecutive streak continues
    if (ls.lastLoginDate) {
      const lastDate = new Date(ls.lastLoginDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        ls.consecutiveDays += 1;
      } else if (diffDays > 1) {
        ls.consecutiveDays = 1; // Gap in login, reset streak
        ls.allMonthDaysLogged = false; // Missed a day, no longer logged in every day
      }
    } else {
      ls.consecutiveDays = 1;
    }

    ls.lastLoginDate = todayStr;
  }

  /**
   * Grant login streak chest rewards. Call from processTurn for each nation.
   * Grants chest1 every day logged in, chest2 weekly, chest3 bi-weekly, chest4 monthly.
   * @param {Object} nation
   */
  grantLoginChest(nation) {
    if (!nation.equipment) return;
    nation.equipment.chests = nation.equipment.chests || { chest1: 0, chest2: 0, chest3: 0, chest4: 0 };
    const ls = nation.equipment.loginStreakChests;
    if (!ls) return;

    const today = new Date().toISOString().slice(0, 10);

    // Only grant if logged in today
    if (ls.lastLoginDate !== today) return;

    // Daily chest1
    this.world.equipmentSystem.grantChest(nation, 'chest1');

    // Weekly chest2: every 7 consecutive days
    if (ls.consecutiveDays >= 7 && ls.consecutiveDays % 7 === 0) {
      this.world.equipmentSystem.grantChest(nation, 'chest2');
      ls.weeklyChestCount = (ls.weeklyChestCount || 0) + 1;
    }

    // Bi-weekly chest3: every 14 consecutive days
    if (ls.consecutiveDays >= 14 && ls.consecutiveDays % 14 === 0) {
      this.world.equipmentSystem.grantChest(nation, 'chest3');
      ls.monthlyChestCount = (ls.monthlyChestCount || 0) + 1;
    }

    // Monthly chest4: if logged in every day of the month, grant at month end
    // Checked in processTurn via month boundary
  }

  /**
   * Check if player logged in every day of the month and grant chest4.
   * Called at month boundary.
   * @param {Object} nation
   */
  grantMonthlyLoginChest(nation) {
    if (!nation.equipment) return;
    nation.equipment.chests = nation.equipment.chests || { chest1: 0, chest2: 0, chest3: 0, chest4: 0 };
    const ls = nation.equipment.loginStreakChests;
    if (!ls || !ls.allMonthDaysLogged) return;

    // Grant chest4 for logging in every day of the month
    this.world.equipmentSystem.grantChest(nation, 'chest4');
    ls.allMonthDaysLogged = false; // Reset for next month
  }
}

module.exports = { LoginManager };
