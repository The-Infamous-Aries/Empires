"use strict";

const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
function check(condition, message) {
  if (!condition) throw new Error(message);
}

class LotteryManager {
  constructor(world) {
    this.world = world;
  }

  _getLotteryState() {
    return this.world.state.lottery ||= {
      pool: 0,
      tickets: {},
      nextTicketId: 1,
      drawings: [],
      currentDrawing: null,
      lastDrawing: null,
    };
  }

  _getWeekStart(date = null) {
    const d = date || new Date();
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - d.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
  }

  _scheduleLotteryDrawing() {
    const lottery = this._getLotteryState();
    if (lottery.currentDrawing && lottery.currentDrawing.status === "open") return;
    const weekStart = this._getWeekStart();
    const now = new Date();
    const validSlots = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      for (let hour = 0; hour < 24; hour++) {
        const candidate = new Date(weekStart);
        candidate.setUTCDate(candidate.getUTCDate() + dayOffset);
        candidate.setUTCHours(hour, 0, 0, 0);
        const day = candidate.getUTCDay(), h = candidate.getUTCHours();
        if (day === 6 && h >= 22) continue;
        if (day === 0 && h <= 1) continue;
        validSlots.push(candidate.getTime());
      }
    }
    let drawTime = validSlots[Math.floor(Math.random() * validSlots.length)];
    if (new Date(drawTime) <= now) drawTime += 7 * 24 * 60 * 60 * 1000;
    lottery.currentDrawing = {
      weekStart: weekStart.getTime(),
      drawTime,
      status: "open",
      ticketsSold: 0,
    };
  }

  _isLotteryTime() {
    const lottery = this._getLotteryState();
    return lottery.currentDrawing && lottery.currentDrawing.status === "open"
      && Date.now() >= lottery.currentDrawing.drawTime;
  }

  runLotteryDrawing() {
    const world = this.world;
    const lottery = this._getLotteryState();
    if (!this._isLotteryTime()) return { ok: false, reason: "No drawing due" };
    const shuffled = [...world.PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
    const winningNumbers = shuffled.slice(0, 5);
    const winningMultiplier = shuffled[5];
    const allWinning = [...winningNumbers, winningMultiplier];

    const drawResult = {
      drawTime: new Date().toISOString(),
      winningNumbers,
      multiplier: winningMultiplier,
      allWinning,
      poolBefore: lottery.pool,
      winners: [],
      totalPayout: 0,
    };

    const jackpotWinners = [];
    const secondaryWinners = [];
    const ticketResults = {};

    for (const [ticketId, ticket] of Object.entries(lottery.tickets)) {
      const matchResult = this._checkLotteryTicket(ticket, winningNumbers, winningMultiplier);
      ticketResults[ticketId] = {
        ticketId: Number(ticketId),
        nationId: ticket.nationId,
        nationName: ticket.nationName,
        numbers: [...ticket.numbers],
        multiplier: ticket.multiplier,
        matches: matchResult.matches,
        hasMultiplierMatch: matchResult.hasMultiplierMatch,
        tier: matchResult.tier,
        prize: matchResult.prize,
        winningNumbers: [...allWinning],
        drawTime: drawResult.drawTime,
      };
      if (matchResult.prize > 0) {
        const winner = { ticketId: Number(ticketId), nationId: ticket.nationId, nationName: ticket.nationName, matches: matchResult.matches, hasMultiplierMatch: matchResult.hasMultiplierMatch, tier: matchResult.tier, prize: matchResult.prize, numbers: [...ticket.numbers], multiplier: ticket.multiplier };
        (matchResult.tier === "JACKPOT" ? jackpotWinners : secondaryWinners).push(winner);
      }
    }

    let totalPayout = 0;
    if (jackpotWinners.length > 0) {
      const share = Math.floor(lottery.pool / jackpotWinners.length);
      for (const w of jackpotWinners) { w.prize = share; w.tier = "JACKPOT"; drawResult.winners.push(w); totalPayout += share; }
    } else {
      const tierGroups = {};
      for (const w of secondaryWinners) { (tierGroups[w.tier] ||= []).push(w); }
      for (const [tier, winners] of Object.entries(tierGroups)) {
        const pct = ({ JACKPOT: 1, FOUR_PLUS_M: 0.04, FIVE: 0.02, THREE_PLUS_M: 0.00015, FOUR: 0.0001, THREE: 0.00005 }[tier] || 0);
        const tierPool = Math.floor(lottery.pool * pct);
        const share = Math.floor(tierPool / winners.length);
        for (const w of winners) { w.prize = share; drawResult.winners.push(w); totalPayout += share; }
      }
    }
    for (const w of drawResult.winners) {
      const existing = ticketResults[w.ticketId];
      if (existing) { existing.prize = w.prize; existing.tier = w.tier; }
    }
    for (const [ticketId, result] of Object.entries(ticketResults)) {
      lottery.drawings.push(result);
    }
    if (lottery.drawings.length > 52) lottery.drawings = lottery.drawings.slice(-52);

    lottery.pool = Math.max(0, lottery.pool - totalPayout);
    if (jackpotWinners.length > 0) {
      lottery.pool = Math.floor((drawResult.poolBefore - totalPayout + lottery.pool) * 0.0001) || 0;
    }

    this._recordLotteryUnclaimed(drawResult);
    lottery.lastDrawing = drawResult;
    lottery.currentDrawing.status = "closed";
    lottery.tickets = {};
    return { ok: true, result: drawResult };
  }

  _checkLotteryTicket(ticket, winningNumbers, winningMultiplier) {
    const world = this.world;
    let matches = 0;
    for (const num of ticket.numbers) if (winningNumbers.includes(num)) matches++;
    const hasMultiplierMatch = ticket.multiplier === winningMultiplier;
    let tier = null, prize = 0;
    const pool = world._getLotteryState().pool;
    if (matches === 5 && hasMultiplierMatch) { tier = "JACKPOT"; prize = pool; }
    else if (matches === 5) { tier = "FIVE"; prize = Math.floor(pool * 0.02); }
    else if (matches === 4 && hasMultiplierMatch) { tier = "FOUR_PLUS_M"; prize = Math.floor(pool * 0.04); }
    else if (matches === 4) { tier = "FOUR"; prize = Math.floor(pool * 0.0001); }
    else if (matches === 3 && hasMultiplierMatch) { tier = "THREE_PLUS_M"; prize = Math.floor(pool * 0.00015); }
    else if (matches === 3) { tier = "THREE"; prize = Math.floor(pool * 0.00005); }
    return { matches, hasMultiplierMatch, tier, prize };
  }

  _recordLotteryUnclaimed(drawResult) {
    const world = this.world;
    const lottery = this._getLotteryState();
    const expiresAt = Date.now() + world.CLAIM_WINDOW_MS;
    for (const w of drawResult.winners) {
      lottery.tickets = lottery.tickets || {};
      const unclaimedKey = `uc_${w.ticketId}`;
      (lottery.unclaimed ||= {})[unclaimedKey] = {
        ticketId: w.ticketId,
        nationId: w.nationId,
        nationName: w.nationName,
        tier: w.tier,
        prize: w.prize,
        drawTime: drawResult.drawTime,
        expiresAt,
        claimed: false,
      };
    }
  }

  lotteryPurchase(r, count, ticketPicks) {
    const world = this.world;
    const n = r.nation;
    const lottery = this._getLotteryState();
    this._scheduleLotteryDrawing();
    if (!lottery.currentDrawing || lottery.currentDrawing.status !== "open") throw new Error("No active lottery drawing");
    let effectiveCount = ticketPicks ? ticketPicks.length : Math.floor(count);
    if (effectiveCount < 1 || effectiveCount > world.MAX_TICKETS_PER_NATION) throw new Error(`Can only buy 1-${world.MAX_TICKETS_PER_NATION} tickets per drawing`);
    const existing = Object.values(lottery.tickets).filter((t) => t.nationId === n.id).length;
    if (existing + effectiveCount > world.MAX_TICKETS_PER_NATION) throw new Error(`Already have ${existing} tickets, max ${world.MAX_TICKETS_PER_NATION} per drawing`);
    const totalCost = effectiveCount * world.TICKET_COST;
    const reasons = world.affordability(n, { money: totalCost });
    if (reasons.length) throw new Error("Insufficient funds");
    world.pay(n, { money: totalCost });
    const purchased = [];
    const picksToUse = ticketPicks || [];
    for (let i = 0; i < effectiveCount; i++) {
      let ticket;
      if (picksToUse[i]) {
        ticket = this._createCustomLotteryTicket(n, picksToUse[i], lottery.nextTicketId++);
      } else {
        ticket = this._generateLotteryTicket(n, lottery.nextTicketId++);
      }
      lottery.tickets[ticket.id] = ticket;
      purchased.push(ticket);
      lottery.currentDrawing.ticketsSold = (lottery.currentDrawing.ticketsSold || 0) + 1;
    }
    lottery.pool += totalCost;
    world.refresh(r);
    return { ok: true, tickets: purchased, totalCost };
  }

  _generateLotteryTicket(nation, id) {
    const world = this.world;
    const shuffled = [...world.PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
    const picks = shuffled.slice(0, world.TICKET_PICK_COUNT);
    return {
      id,
      nationId: nation.id,
      nationName: nation.name,
      numbers: picks.slice(0, 5),
      multiplier: picks[5],
      purchasedAt: Date.now(),
      cost: world.TICKET_COST,
      customPick: false,
    };
  }

  _createCustomLotteryTicket(nation, pick, id) {
    const world = this.world;
    return {
      id,
      nationId: nation.id,
      nationName: nation.name,
      numbers: [...pick.numbers],
      multiplier: pick.multiplier,
      purchasedAt: Date.now(),
      cost: world.TICKET_COST,
      customPick: true,
    };
  }

  validateLotteryPicks(picks) {
    const world = this.world;
    if (!Array.isArray(picks) || picks.length === 0) return { valid: false, reason: "No picks provided" };
    if (picks.length > world.MAX_TICKETS_PER_NATION) return { valid: false, reason: `Max ${world.MAX_TICKETS_PER_NATION} tickets per drawing` };
    for (const pick of picks) {
      if (!pick || !Array.isArray(pick.numbers) || pick.numbers.length !== 5) return { valid: false, reason: "Each ticket needs exactly 5 pet numbers" };
      if (!pick.multiplier) return { valid: false, reason: "Each ticket needs a multiplier pet" };
      const allSix = [...pick.numbers, pick.multiplier];
      if (new Set(allSix).size !== 6) return { valid: false, reason: "All 6 pets on a ticket must be unique" };
      for (const pet of allSix) if (!world.PET_ICONS_UNIQUE.includes(pet)) return { valid: false, reason: `Invalid pet icon: ${pet}` };
    }
    return { valid: true };
  }

  lotteryClaim(r, ticketId) {
    const world = this.world;
    ticketId = Number(ticketId);
    const n = r.nation;
    const lottery = this._getLotteryState();
    const unclaimed = (lottery.unclaimed || {})[`uc_${ticketId}`];
    if (!unclaimed) throw new Error("No unclaimed winnings for this ticket");
    if (unclaimed.claimed) throw new Error("Prize already claimed");
    if (unclaimed.nationId !== n.id) throw new Error("Ticket does not belong to this nation");
    if (Date.now() > unclaimed.expiresAt) { unclaimed.claimed = true; unclaimed.expired = true; throw new Error("Prize expired"); }
    const prize = unclaimed.prize;
    n.money = (n.money || 0) + prize;
    unclaimed.claimed = true;
    unclaimed.claimedAt = Date.now();
    world.refresh(r);
    return { ok: true, prize, tier: unclaimed.tier };
  }
}

module.exports = { LotteryManager };
