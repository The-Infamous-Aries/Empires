# Sports Guide

Everything you need to know about sports in Dominion Wars — from building your first stadium to winning the World Championship.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Your Team](#your-team)
3. [Players](#players)
   - [Names](#names)
   - [Traits](#traits)
   - [Attributes & Positions](#attributes--positions)
   - [Contracts](#contracts)
4. [The Draft](#the-draft)
5. [Stadium Upgrades](#stadium-upgrades)
6. [Leagues & Seasons](#leagues--seasons)
7. [Match Day](#match-day)
8. [Injuries](#injuries)
9. [Championships & World Championship](#championships--world-championship)
10. [Betting](#betting)
11. [Coach Rating](#coach-rating)
12. [Season Cycle](#season-cycle)

---

## Getting Started

To play sports, you first need to build a **stadium wonder** for the sport you want:

| Sport | Wonder Required |
|-------|----------------|
| Basketball | `basketballStadium` |
| Hockey | `hockeyStadium` |
| Soccer | `soccerStadium` |
| Football | `footballStadium` |

Once built, you can:
- Create a team (empty roster — no auto players)
- Join or create a league
- Draft players from the global draft board
- Upgrade your stadium facilities

Teams use **nation money** directly for salaries, upgrades, and contracts. There is no separate team budget.

---

## Your Team

Each nation can have **one team per sport**. Teams start empty — you build the roster through the draft and free agency.

### Team Basics

| Property | What It Means |
|----------|---------------|
| `name` | Your team's display name |
| `sport` | Basketball, Hockey, Soccer, or Football |
| `fans` | Fan count — grows with wins and stadium upgrades |
| `fanLoyalty` | Fan loyalty (0-100) |
| `wins / losses / draws` | Season and career record |
| `championships` | League championships won |
| `leagueId` | Which league your team belongs to |

### Roster Management

Your team has three roster areas:

| Area | Purpose |
|------|---------|
| **Players** | All players on your team |
| **Roster (Starters)** | One player per starting position |
| **Subs** | Substitute players per position |

A **full team** means every starting position is filled:
- Basketball/Hockey/Soccer: 5-11 starters depending on sport
- Football: 22 starters (11 offense + 11 defense)

### Setting Your Lineup

- **`setStarter`**: Assign a player to a starting position
- **`setSub`**: Add or remove a substitute player at a position
- Players must be on your team, not injured, and not retired to start

---

## Players

### Names

Every player gets a randomly generated name from four name lists:
- **Male first names** / **Female first names** (50/50 gender chance)
- **Middle names** (30% chance of inclusion)
- **Last names**

Example output: `"Marcus J. Rodriguez"` or `"Sarah Chen"`

### Traits

Players are born with **0-3 random traits** from a pool of ~350 traits (250 good, 100 bad). Traits give permanent bonuses to attributes, morale, and potential.

| Trait Type | Effect |
|------------|--------|
| **Good traits** | +attributes, +morale, +potential |
| **Bad traits** | -attributes, -morale, -potential |
| **Special traits** (Enforcer, Wrecking Ball, etc.) | Increase opponent injury chance during matches |

**Trait Management:**
- **Reroll Trait** — Add a new random trait (max 3 per player). Costs nation money.
- **Remove Trait** — Remove a trait and reverse its bonuses. Costs nation money.

### Attributes & Positions

Each sport has its own attribute set:

| Sport | Attributes |
|-------|------------|
| **Basketball** | Speed, Stamina, Passing, Awareness, Endurance, Shooting, Defense, Rebounding, Stealing |
| **Hockey** | Speed, Stamina, Spirit, Awareness, Endurance, Passing, Shooting, Defense, Goaltending |
| **Soccer** | Stamina, Awareness, Endurance, Passing, Shooting, Defense, Goaltending |
| **Football** | Stamina, Awareness, Endurance, Passing, Catching, Defense, Strength, Speed |

Attributes range from **1 to 99**. Position-relevant attributes get a bonus during player generation.

**Football positions** are split into offense and defense:
- **Offense:** QB, RB, WR, Slot WR, TE, LT, LG, C, RG, RT, Kicker
- **Defense:** DE, DT, NT, MLB, OLB (×2), CB (×2), FS, SS

### Potential

Every player has a **potential** (1-99) — the maximum any attribute can reach. Teens have the highest potential (75-95), older players the lowest (35-55). Training and game XP can raise attributes up to potential, but never beyond.

### Contracts

| Field | Description |
|-------|-------------|
| `contractSeasons` | Total seasons on contract |
| `contractSeasonsRemaining` | Seasons left |
| `salary` | Per-season salary paid from nation money |

**Contract Extension:** Extend by 1-5 seasons. Cost is based on:
- Average attribute value (higher = more expensive)
- Potential (higher = more expensive)
- Morale (happy players cost less, unhappy players cost more)

Contracts expire at season end. You'll get warnings when players have ≤1 season remaining.

---

## The Draft

### How It Works

When you build a stadium wonder and create a team, **100 new players** are added to that sport's global draft board. The draft board is shared by all nations.

**Draft Board Demographics** (equal distribution):
- 20 Teen players
- 20 Young Adult players
- 20 Adult players
- 20 Middle Aged players
- 20 Older players

**Older players start with better attributes** but have lower potential and shorter careers.

### Draft Rate

Each player has a draft rate score based on:
- Average attribute value
- Potential
- Demographic (older = higher rate)
- Whether they're already on a team

Use this to judge which players are most valuable.

### Drafting

During the **draft phase** of a league:
1. Browse the draft board (`getDraftBoard` shows free agents only)
2. Select a player and draft them to your team
3. The player's salary is deducted from nation money
4. They're added to your roster and removed from the board

### Player Regeneration

When players retire, they're removed from the board and replaced with new players (half the normal count). This keeps the draft board fresh with new talent.

---

## Stadium Upgrades

Upgrade your stadium to improve your team. Each upgrade has 10 levels and costs nation money.

| Upgrade | What It Does |
|---------|-------------|
| **Seating** | +5,000 capacity per level; more fans per game |
| **Gym** | +10% player skill gain from games per level |
| **Medical Center** | -10% injury chance and length per level |
| **Youth Academy** | Better skills for new draft players |
| **Fan Experience** | +10% fans per game per level |
| **Concessions** | +10% revenue per level |
| **Technology Center** | +5% fans/XP per level, -injury; requires nation tech level (level × 100) |

**Technology Center requires nation tech:** Level 1 needs 100 tech, Level 2 needs 200 tech, etc.

---

## Leagues & Seasons

### Creating a League

Build a stadium wonder, then create a league for your sport. Leagues support **2-8 sides** (default: East/West). Teams are distributed across sides for balanced competition.

### Joining a League

You need a stadium wonder for the sport. You're automatically assigned to the least-full side.

### Season Structure

| Phase | Duration | What Happens |
|-------|----------|-------------|
| Registration | 7 days | Create/join leagues |
| Draft | 7 days | Draft players from global board |
| Active | 30 days | 30 games (1 per day per team) |
| Championship | 21 days | Playoff tournament |
| World Championship | 21 days | League champions compete |
| Offseason | 14 days | Demographic changes, contract expiry, new season |

**All leagues share one global phase.** When registration ends, all draft-ready leagues with full rosters automatically start their season.

### Regular Season

- 30 games per season
- 1 game per day per team
- Round-robin scheduling
- Wins = 3 points, Draws = 1 point (for standings)

### Standings

Ranked by points, then goal differential, then name.

---

## Match Day

### How Matches Work

Matches are simulated based on **team strength**, which averages your players' ratings (starters weighted 1.2×). Win probability is proportional to strength ratio.

### Sport-Specific Match Events

| Sport | Events Tracked |
|-------|---------------|
| **Basketball** | 2pt/3pt field goals, steals, rebounds, shots, blocks |
| **Hockey** | Goals, shots, blocks, fights, overtime goals |
| **Soccer** | Goals, steals |
| **Football** | Touchdowns, extra points, 2-point conversions, field goals, interceptions, passes |

### Team Sport Stats

Each match updates your team's sport-specific stats:
- Touchdowns, field goals, interceptions, passes (Football)
- Goals, shots, blocks, fights (Hockey)
- Goals, steals (Soccer)
- Points, steals, rebounds, shots, blocks (Basketball)

### XP & Leveling

Players gain XP after every game:
- Base: minutes played / 10
- Win bonus: ×1.5
- Gym level bonus: +10% per level
- Technology Center bonus: +5% per level

Every 100 XP = 1 level. On level up, one random attribute increases by 1 (capped at potential).

---

## Injuries

### How Injuries Happen

After every match, each player on both teams has a chance to get injured. Injury risk is based on:

| Factor | Effect |
|--------|--------|
| Consecutive games played | +2% per game |
| Minutes played | +1% per minute |
| Low endurance/stamina | Increases risk |
| Older age | +5% to +20% |
| Lost the match | +10% |
| Drew the match | +5% |
| Previous injury | +15% |
| Opponent has enforcer traits | +bonus per trait |

### Injury Severity

| Severity | Description | Days Out |
|----------|-------------|----------|
| 1 | Minor | 0 days |
| 2 | Moderate | 1 day |
| 3 | Serious | 5 days |
| 4 | Season-ending | Rest of season |
| 5 | Career-ending | Player retires |

**Medical Center** reduces injury days by 10% per level. **Technology Center** reduces by 5% per level.

### Injury Tracking

- Injuries appear in `team.injuries` Map
- Player's `injuryHistory` records all past injuries
- `team.stats.totalInjuries` counts all injuries suffered
- Injuries heal automatically each turn during `processInjuries()`

---

## Championships & World Championship

### League Championship

Top 16 teams qualify (side-aware for multi-side leagues):
- **2 sides:** 8 per side = 16 teams
- **4 sides:** 4 per side = 16 teams
- **6 sides:** 2 per side + 4 wildcards = 16 teams
- **8 sides:** 2 per side = 16 teams

**Format:** Best-of-5 series rounds, best-of-7 finals.

The champion gets:
- `stats.championships++`
- `stats.tournamentsWon++`
- Nation-level tournament win recorded

### World Championship

After all league championships finish, league champions compete in the World Championship:
- Bracket size = next power of two
- Byes for excess teams
- Best-of-5 semifinals, best-of-7 finals
- Winner gets `stats.worldTournamentsWon++`

---

## Betting

Bet on matches using nation money:

| Bet Type | Prediction | Odds Based On |
|----------|-----------|---------------|
| `winner` | Team ID or 'draw' | Team strength ratio |
| `over_under` | `{type: 'over'|'under', line: number}` | Randomized |
| `score` | `{score1, score2}` | Randomized |

**Winnings** = `amount × odds`. Bets are resolved after the match completes.

---

## Coach Rating

Your nation gets a **coach rating** (0-100) per sport and overall:

```
Rating = Win Component + Tournament Component
Win Component = (wins / totalGames) × 60  (max 60)
Tournament Component = min((tournamentsWon + worldTournamentsWon) × 10, 40)  (max 40)
```

Check your rating with `getNationCoachRating(nationId, sport)` or `getNationOverallCoachRating(nationId)`.

---

## Season Cycle

All leagues share one global cycle. Here's what happens in each phase:

| Phase | Your Actions |
|-------|-------------|
| **Registration** | Create/join leagues, build stadium wonders |
| **Draft** | Draft players from the global board |
| **Active** | Games happen automatically; bet on matches; manage lineup |
| **Championship** | Playoff games happen automatically |
| **World Championship** | Watch your league champion compete |
| **Offseason** | Players age, contracts expire, retired players replaced, new season begins |

### Offseason Changes

During offseason:
1. **Player development** — random attribute gains based on demographic
2. **Retirement checks** — older players may retire
3. **Contract expiry** — seasons remaining decrease; warnings for ≤1 season
4. **Draft board regeneration** — retired players replaced
5. **New season** — all leagues reset to draft phase

---

## Quick Reference

| Action | System/Method |
|--------|--------------|
| Build stadium | Wonders system |
| Create team | `SportsSystem.createTeam()` |
| Join league | `SportsSystem.joinLeague()` |
| Draft player | `SportsSystem.draftPlayer()` |
| Set starter | `SportsSystem.setStarter()` |
| Train player | `SportsSystem.trainPlayer()` |
| Extend contract | `SportsSystem.extendContract()` |
| Trade player | `SportsSystem.tradePlayers()` |
| Place bet | `SportsSystem.placeBet()` |
| Check coach rating | `SportsSystem.getNationCoachRating()` |
| View draft board | `DraftSystem.getDraftBoard()` |
