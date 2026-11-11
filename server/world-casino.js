"use strict";
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
function check(condition, message) {
  if (!condition) throw new Error(message);
}

class CasinoManager {
  constructor(world) {
    this.world = world;
  }

  casinoSetCardSet(r, cardSet) {
    const world = this.world;
    const n = r.nation;
    const validSets = ['artistic', 'classic', 'dark', 'light', 'off-white', 'white-red'];
    if (!validSets.includes(cardSet)) throw new Error('Invalid card set');
    n.settings = n.settings || {};
    n.settings.ui = n.settings.ui || {};
    n.settings.ui.cardSet = cardSet;
    world.refresh(r);
    return { ok: true, cardSet };
  }

  casinoSpinWheel(r) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const wheelSys = world.sovereignWheelSystem;
    const today = new Date().toISOString().split('T')[0];
    if (casino.wheel.lastSpinDate === today) {
      throw new Error('Already spun the wheel today');
    }
    const wheel = wheelSys.buildDailyWheel();
    const { slice, physics } = wheelSys.spin(wheel);
    const result = wheelSys.applySpinResult(n, casino, slice, world.state.day);
    casino.wheel.lastSpinDate = today;
    casino.wheel.spinsToday = (casino.wheel.spinsToday || 0) + 1;
    world.refresh(r);
    return { ok: true, result: slice, physics, payout: result.payout, messages: result.messages };
  }

  casinoBuyKeno(r, petIds, wager) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const ticketCost = world.kenoSystem.ticketCost;
    const reasons = world.affordability(n, { money: ticketCost });
    if (reasons.length) throw new Error('Insufficient funds');
    world.pay(n, { money: ticketCost });
    world.casinoSystem.addToPool(ticketCost, 'keno_wager');
    const ticketPicks = petIds ? [{ pets: petIds }] : null;
    const result = world.kenoSystem.purchaseTickets(n, 1, ticketPicks);
    if (!result.ok) {
      n.money = (n.money || 0) + ticketCost;
      world.casinoSystem.addToPool(-ticketCost, 'keno_refund');
      throw new Error(result.reason);
    }
    world.refresh(r);
    return { ok: true, tickets: result.tickets, totalCost: result.totalCost };
  }

  casinoDrawKeno(r) {
    const world = this.world;
    const result = world.kenoSystem.runDrawing(world.casinoSystem);
    world.refresh(r);
    return result;
  }

  casinoClaimKenoWin(r, ticketId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const result = world.kenoSystem.claimPrize(ticketId, n.id, n);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoGetKenoStats(r) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const tickets = world.kenoSystem.getNationTickets(n.id);
    const resolved = world.kenoSystem.getNationResolvedTickets(n.id);
    const unclaimed = world.kenoSystem.getUnclaimedWinnings(n.id);
    return {
      ok: true,
      stats: casino.games.keno,
      tickets,
      resolved,
      unclaimed,
      drawing: world.kenoSystem.currentDrawing,
    };
  }

  casinoBuyScratchOff(r, cardId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const result = world.scratchOffSystem.purchaseCard(n, cardId, world.casinoSystem);
    if (!result.ok) throw new Error(result.reason);
    world.refresh(r);
    return { ok: true, card: result.card };
  }

  casinoRevealScratchOff(r, cardId, tileIndex) {
    const world = this.world;
    const n = r.nation;
    const result = world.scratchOffSystem.revealTile(n, cardId, tileIndex);
    if (!result.ok) throw new Error(result.reason);
    world.refresh(r);
    return result;
  }

  casinoClaimScratchOffWin(r, cardId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const result = world.scratchOffSystem.claimPrize(world.casinoSystem, n, cardId);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoGetScratchOffStats(r) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const cards = casino.scratchOffCards || [];
    return {
      ok: true,
      stats: casino.games.scratchOff,
      cards,
      availableCards: world.scratchOffSystem.getAvailableCards(),
    };
  }

  casinoGetStats(r) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    return {
      ok: true,
      stats: casino.games,
      wheel: casino.wheel,
      freeUnits: casino.freeUnits,
      activeEffects: casino.activeEffects,
      kenoTickets: casino.kenoTickets || [],
      scratchOffCards: casino.scratchOffCards || [],
    };
  }

  casinoJoinTable(r, tableId, seatIndex) {
    const world = this.world;
    const n = r.nation;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const result = bjSys.joinTable(table, seatIndex, n.id, r.player.playerId);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoLeaveTable(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    const table = bjSys.getTable(tableId);
    if (!table) return { ok: false, reason: 'Table not found' };
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.leaveTable(table, seatIndex);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoListTables(r) {
    const world = this.world;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    return { ok: true, tables: bjSys.listTables() };
  }

  casinoGetTableList(r) {
    return this.casinoListTables(r);
  }

  casinoPlaceBet(r, tableId, seatIndex, amount) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const seat = table.getSeat(seatIndex);
    if (!seat || seat.isEmpty() || seat.nationId !== n.id) {
      return { ok: false, reason: 'You are not seated at this seat' };
    }
    const result = bjSys.placeBet(table, seatIndex, amount, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
      casino.games.blackjack.spent = (casino.games.blackjack.spent || 0) + amount;
    }
    return result;
  }

  casinoDealInitial(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const seated = table.seats.some(s => !s.isEmpty() && s.nationId === n.id);
    if (!seated) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.dealInitial(table);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoBlackjackHit(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.hit(table, seatIndex);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoBlackjackStand(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.stand(table, seatIndex);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoBlackjackDouble(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const seatBefore = table.getSeat(seatIndex);
    const betBeforeDouble = seatBefore.bet;
    const result = bjSys.doubleDown(table, seatIndex, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
      casino.games.blackjack.spent = (casino.games.blackjack.spent || 0) + betBeforeDouble;
    }
    return result;
  }

  casinoBlackjackSplit(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const seatBeforeSplit = table.getSeat(seatIndex);
    const betBeforeSplit = seatBeforeSplit.bet;
    const result = bjSys.split(table, seatIndex, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
      casino.games.blackjack.spent = (casino.games.blackjack.spent || 0) + betBeforeSplit;
    }
    return result;
  }

  casinoBlackjackSurrender(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.surrender(table, seatIndex, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoBlackjackInsurance(r, tableId, accept) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    if (!accept) {
      const result = bjSys.placeInsurance(table, seatIndex, 0, n, world.casinoSystem);
      if (result.ok) {
        world.refresh(r);
      }
      return result;
    }
    const maxInsurance = Math.floor(table.getSeat(seatIndex).bet * 0.5);
    const result = bjSys.placeInsurance(table, seatIndex, maxInsurance, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoResolveInsurance(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const result = bjSys.resolveInsurance(table, world.casinoSystem);
    if (result.ok) {
      if (result.results) {
        for (const res of result.results) {
          const nation = world.state.nations?.[res.nationId];
          if (nation && res.payout > 0) {
            nation.money = (nation.money || 0) + res.payout;
          }
          if (nation && nation.casino && nation.casino.games) {
            const bjStats = nation.casino.games.blackjack;
            bjStats.played = (bjStats.played || 0) + 1;
            const netProfit = (res.payout || 0) - (res.bet || 0);
            if (res.outcome === 'win' || res.outcome === 'blackjack') {
              bjStats.won = (bjStats.won || 0) + 1;
              bjStats.wonAmount = (bjStats.wonAmount || 0) + netProfit;
              if (res.outcome === 'blackjack') bjStats.blackjacks = (bjStats.blackjacks || 0) + 1;
            } else if (res.outcome === 'push') {
              bjStats.pushed = (bjStats.pushed || 0) + 1;
            } else {
              bjStats.lost = (bjStats.lost || 0) + 1;
              bjStats.wonAmount = (bjStats.wonAmount || 0) + netProfit;
            }
          }
        }
      }
      world.refresh(r);
    }
    return result;
  }

  casinoGetTableState(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const cardSet = n.settings && n.settings.ui ? n.settings.ui.cardSet : 'white-red';
    const state = bjSys.getTableState(table, cardSet);
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex !== -1 && table.status === 'playerTurn' && table.currentSeatIndex === seatIndex) {
      const seat = table.getSeat(seatIndex);
      const odds = bjSys.calculateOdds(seat.getActiveHand(), table.shoe);
      state.odds = odds;
      state.canDouble = seat.canDouble();
      state.canSplit = seat.canSplit();
      state.canSurrender = seat.canSurrender();
    }
    return { ok: true, table: state };
  }

  casinoSettleBlackjack(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const bjSys = world.casinoSystem.getBlackjackSystem();
    if (!bjSys) throw new Error('Blackjack system not initialized');
    let table = bjSys.getTable(tableId);
    if (!table) {
      table = bjSys.getPublicTable();
    }
    const seated = table.seats.some(s => !s.isEmpty() && s.nationId === n.id);
    if (!seated) return { ok: false, reason: 'You are not seated at this table' };
    const result = bjSys.settle(table, world.casinoSystem);
    if (result.ok) {
      for (const res of result.results) {
        const nation = world.state.nations?.[res.nationId];
        if (nation && res.payout > 0) {
          nation.money = (nation.money || 0) + res.payout;
        }
        if (nation && nation.casino && nation.casino.games) {
          const bjStats = nation.casino.games.blackjack;
          bjStats.played = (bjStats.played || 0) + 1;
          const netProfit = (res.payout || 0) - (res.bet || 0);
          if (res.outcome === 'win' || res.outcome === 'blackjack') {
            bjStats.won = (bjStats.won || 0) + 1;
            bjStats.wonAmount = (bjStats.wonAmount || 0) + netProfit;
            if (res.outcome === 'blackjack') bjStats.blackjacks = (bjStats.blackjacks || 0) + 1;
          } else if (res.outcome === 'push') {
            bjStats.pushed = (bjStats.pushed || 0) + 1;
          } else {
            bjStats.lost = (bjStats.lost || 0) + 1;
            bjStats.wonAmount = (bjStats.wonAmount || 0) + netProfit;
          }
        }
      }
      world.refresh(r);
    }
    return result;
  }

  casinoDiceCreateTable(r, dieSize, diceCount, minBet, maxBet, autoRoll) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    const table = gdSys.createTable({
      dieSize: dieSize || 'd6',
      diceCount: diceCount || 2,
      minBet: minBet || 100,
      maxBet: maxBet || 100000,
      hostPlayerId: n.id,
      autoRoll: !!autoRoll,
    });
    gdSys.joinTable(table, 0, n.id, r.player.playerId);
    world.refresh(r);
    return { ok: true, tableId: table.tableId, table: gdSys.getTableState(table, n.settings?.ui?.cardSet) };
  }

  casinoDiceJoinTable(r, tableId, seatIndex) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const result = gdSys.joinTable(table, seatIndex, n.id, r.player.playerId);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoDiceLeaveTable(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    const table = gdSys.getTable(tableId);
    if (!table) return { ok: false, reason: 'Table not found' };
    let seatIndex = -1;
    for (let i = 0; i < table.seats.length; i++) {
      if (table.seats[i].nationId === n.id) {
        seatIndex = i;
        break;
      }
    }
    if (seatIndex === -1) return { ok: false, reason: 'You are not seated at this table' };
    const result = gdSys.leaveTable(table, seatIndex);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoDiceListTables(r) {
    const world = this.world;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    return gdSys.listTablesAction();
  }

  casinoDicePlaceBet(r, tableId, seatIndex, betType, target, amount) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const seat = table.getSeat(seatIndex);
    if (!seat || seat.isEmpty() || seat.nationId !== n.id) {
      return { ok: false, reason: 'You are not seated at this seat' };
    }
    const result = gdSys.placeBet(table, seatIndex, betType, target, amount, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
      if (casino.games && casino.games.gamblerDice) {
        casino.games.gamblerDice.spent = (casino.games.gamblerDice.spent || 0) + amount;
      }
    }
    return result;
  }

  casinoDiceBackBet(r, tableId, seatIndex, betId, amount) {
    const world = this.world;
    const n = r.nation;
    const casino = world.casinoSystem.getCasino(n);
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const seat = table.getSeat(seatIndex);
    if (!seat || seat.isEmpty() || seat.nationId !== n.id) {
      return { ok: false, reason: 'You are not seated at this seat' };
    }
    const result = gdSys.backBet(table, seatIndex, betId, amount, n, world.casinoSystem);
    if (result.ok) {
      world.refresh(r);
      if (casino.games && casino.games.gamblerDice) {
        casino.games.gamblerDice.spent = (casino.games.gamblerDice.spent || 0) + amount;
      }
    }
    return result;
  }

  casinoDiceRoll(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const seated = table.seats.some(s => !s.isEmpty() && s.nationId === n.id);
    if (!seated) return { ok: false, reason: 'You are not seated at this table' };
    const result = gdSys.roll(table, world.casinoSystem);
    if (result.ok) {
      const jackpotPoolBefore = table.jackpotPool || 0;
      let totalJackpotPaid = 0;
      for (const winner of result.jackpotWinners || []) {
        const nation = world.state.nations?.[winner.nationId];
        if (nation && winner.amount > 0) {
          const paid = Math.min(jackpotPoolBefore - totalJackpotPaid, winner.amount);
          totalJackpotPaid += paid;
          nation.money = (nation.money || 0) + paid;
        }
      }
      table.jackpotPool = Math.max(jackpotPoolBefore - totalJackpotPaid, Math.floor(jackpotPoolBefore * 0.1));
      for (const seatResult of result.results) {
        const nation = world.state.nations?.[seatResult.nationId];
        if (nation && seatResult.totalPayout > 0) {
          nation.money = (nation.money || 0) + seatResult.totalPayout;
        }
        if (nation && nation.casino && nation.casino.games) {
          const gdStats = nation.casino.games.gamblerDice;
          gdStats.played = (gdStats.played || 0) + 1;
          let seatWon = 0;
          let seatLost = 0;
          let seatPushed = 0;
          for (const bet of seatResult.bets) {
            if (bet.won === null) continue;
            if (bet.isPush) {
              seatPushed += bet.amount;
            } else if (bet.won === true) {
              seatWon += bet.payout;
            } else {
              seatLost += bet.amount;
            }
          }
          const netProfit = seatResult.netProfit;
          if (netProfit > 0) {
            gdStats.won = (gdStats.won || 0) + 1;
            gdStats.wonAmount = (gdStats.wonAmount || 0) + netProfit;
          } else if (netProfit === 0 && seatPushed > 0) {
            gdStats.pushed = (gdStats.pushed || 0) + 1;
          } else if (netProfit === 0) {
            gdStats.lost = (gdStats.lost || 0) + 1;
          } else {
            gdStats.lost = (gdStats.lost || 0) + 1;
          }
          for (const bet of seatResult.bets) {
            if (bet.isJackpotBet && bet.won === true) {
              gdStats.jackpotsWon = (gdStats.jackpotsWon || 0) + 1;
            }
          }
        }
      }
      world.refresh(r);
    }
    return result;
  }

  casinoDiceGetTableState(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const diceSet = n.settings && n.settings.ui ? n.settings.ui.diceSet : 'red';
    const diceColor = n.settings && n.settings.ui ? n.settings.ui.diceColor : 'red';
    const diceStyle = n.settings && n.settings.ui ? n.settings.ui.diceStyle : 'numbers';
    const state = gdSys.getTableState(table, { diceSet, diceColor, diceStyle });
    return { ok: true, table: state };
  }

  casinoDiceGetBetMenu(r, dieSize, diceCount) {
    const world = this.world;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    return gdSys.getBetMenu(dieSize || 'd6', diceCount || 1);
  }

  casinoDiceSetShooter(r, tableId, seatIndex) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    const result = gdSys.setShooter(table, seatIndex, n.id);
    if (result.ok) {
      world.refresh(r);
    }
    return result;
  }

  casinoDiceResetTable(r, tableId) {
    const world = this.world;
    const n = r.nation;
    const gdSys = world.casinoSystem.getGamblerDiceSystem();
    if (!gdSys) throw new Error('Gambler Dice system not initialized');
    let table = gdSys.getTable(tableId);
    if (!table) {
      table = gdSys.getPublicTable();
    }
    if (table.hostPlayerId !== n.id) return { ok: false, reason: 'Only host can reset table' };
    const result = gdSys.resetForNextRound(table);
    if (result) {
      world.refresh(r);
      return { ok: true };
    }
    return { ok: false, reason: 'Cannot reset table while bets are pending' };
  }

  casinoSetDiceSettings(r, diceSet, diceColor, diceStyle) {
    const world = this.world;
    const n = r.nation;
    const validSets = ['red', 'blue', 'green', 'gold', 'silver', 'obsidian'];
    const validStyles = ['numbers', 'dots'];
    if (diceSet && !validSets.includes(diceSet)) throw new Error('Invalid dice set');
    if (diceColor && !validSets.includes(diceColor)) throw new Error('Invalid dice color');
    if (diceStyle && !validStyles.includes(diceStyle)) throw new Error('Invalid dice style');
    n.settings = n.settings || {};
    n.settings.ui = n.settings.ui || {};
    if (diceSet) n.settings.ui.diceSet = diceSet;
    if (diceColor) n.settings.ui.diceColor = diceColor;
    if (diceStyle) n.settings.ui.diceStyle = diceStyle;
    world.refresh(r);
    return { ok: true, diceSet: n.settings.ui.diceSet, diceColor: n.settings.ui.diceColor, diceStyle: n.settings.ui.diceStyle };
  }
}

module.exports = { CasinoManager };
