# Wrestling System - Design Plan
# Sovereignty Epochs - Nation Ruler Roleplay Game
# Location: docs/DEV/wrestling-system-plan.md
# Implementation target: systems/Sports/wrestling-system.js (+ supporting data files)
# Status: CORRECTED - ready to implement (all integration points verified against codebase)

## 1. Overview

The Wrestling System is a nation-owned wrestling promotion system, parallel to but distinct from the Sports System. A nation unlocks it via a **Wrestling Arena Wonder**. Unlike sports (leagues with many teams), wrestling is primarily a solo promotion per nation with one weekly show. Fans are tied directly to the **nation's own population**: when the promotion's fan count reaches population percentage milestones, championships unlock in a fixed order.

The user fully manages: promotion name, airing day of the week, weekly match card (max 4 matches), ticket prices for weekly shows and monthly PPVs, wrestler roster (draft-based), venue/arena upgrades, wrestler contracts, move sets (Signature/Finisher), championship defenses, and storylines.

**PPV Structure:**
- **Monthly Nation PPV**: Each promotion runs its own monthly PPV (nation-based, separate from weekly shows).
- **Quarterly Mass PPV**: Every 3 months, every nation with an active wrestling promotion selects 1 wrestler to compete in a randomly generated match. Performance determines currency and fans gained or lost. Champions may put titles on the line for extra rewards or risk.

## 2. Unlock & Prerequisites

### 2.1 Wonder Unlock (Unified Sports Wonder Pattern)
- New wonder type: `wrestlingArena` (category: `sports`, maxCount: 1).
- Built through the existing Wonders System (`systems/Building/wonders-system.js`) following the **same unified pattern as sports stadium wonders** (`basketballStadium`, `hockeyStadium`, `soccerStadium`, `footballStadium`).
- Cost: **exactly the same as other sports stadium wonders** — money: $90,000,000, techRequired: 1200, resources: { bronze-manufactured: 600, steel-manufactured: 300, copper-manufactured: 300 }.
- Requires: none (standalone wonder).
- On built: `applyWonderEffects` sets `nation.wonderEffects.wrestlingPromotionUnlocked = true`, emits `wonder_built`. WrestlingSystem listens for `wonder_built` (guarded `if (typeof EventBus !== 'undefined')`) and calls `onWonderBuilt`.
- `WrestlingSystem.hasArenaWonder(nationId)` checks `nation.wonders.wrestlingArena > 0` (via `world.nation(id).nation.wonders`).
- UI tab visibility updated on `wonder_built` / `wonder_demolished` (same pattern as Sports System `onWonderBuilt`).
- Demolition: set promotion `isActive = false` (do not delete promotion or wrestlers). Rebuilding the wonder reactivates it.
- **AI nations**: AI-controlled nations can also build `wrestlingArena` and run promotions (see Section 14.5).

### 2.2 One Promotion Per Nation
- A nation may own exactly ONE wrestling promotion.
- `nation.wrestlingPromotion` holds the promotion object (stored on nation, serialized via `Nation.serialize()`/`deserialize()`).
- `nation.wrestlingPromotion` is initialized to `null`; set to promotion object on `createPromotion`.

## 3. Promotion Creation

When a user first builds the `wrestlingArena` wonder, they must create their promotion:

### 3.1 Required Fields
- `id`: string (unique, generated).
- `name`: string (3–60 chars), unique-ish per nation (not global-unique).
- `airingDay`: day of the week the promotion airs / matches simulates. Values: `monday`–`sunday` (stored as string; mapped 0–6 internally: monday=0 ... sunday=6).
- `foundedDay`: game day created (`world.state.day`).
- `isActive`: boolean (true while wonder owned).
- `lastShowDay`: game day the last weekly show aired.
- `lastMonthlyPpvDay`: game day the last monthly PPV aired.

### 3.2 Creation Flow
1. User builds `wrestlingArena` wonder.
2. `wonders-system.js` emits `wonder_built`. WrestlingSystem `onWonderBuilt` sets `wonderEffects.wrestlingPromotionUnlocked = true` and emits `wrestling:promotionUnlocked`.
3. User calls `wrestling:createPromotion` with `{ name, airingDay }`.
4. System validates wonder owned, no existing promotion, creates promotion, initializes empty roster, empty title vault, fan count = 0, `isActive = true`.
5. Emits `wrestling:promotionCreated`.

### 3.3 Airing Day
- Determines which game day the weekly show simulates.
- `getNextAiringDay(currentDay)` computes days until next airing day (1–7).
- Only on the airing day does `processWeeklyShow()` simulate booked matches.
- Changing airing day: allowed once per 14 days (cooldown stored as `airingDayChangedDay` on promotion), emits `wrestling:airingDayChanged`.

## 4. Venue / Arena Upgrades & Ticket Pricing

Same 7 upgrade types as the Sports System stadium, applied to the wrestling arena:

| Upgrade | Key | Effect |
|---------|-----|--------|
| Seating | `seating` | Arena capacity (+5000 fans per level); caps weekly show attendance |
| Gym | `gym` | Wrestler training XP / attribute gain bonus |
| Medical Center | `medicalCenter` | Injury recovery speed (weeks reduced) |
| Youth Academy | `youthAcademy` | Draft quality / rookie potential bonus |
| Fan Experience | `fanExperience` | Fans gained per match multiplier |
| Concessions | `concessions` | Revenue per attendee multiplier + merch sales bonus |
| Technology Center | `technologyCenter` | Match grading precision / broadcast quality |

- Max level 10 each.
- Cost curve: `baseCost * 1.5^(level-1)` (same as sports).
- Technology Center requires nation tech level `(level * 100)`.
- Paid from `nation.money`.
- Stored on `promotion.arena = { seating:0, gym:0, medicalCenter:0, youthAcademy:0, fanExperience:0, concessions:0, technologyCenter:0 }`.
- Arena upgrades applied via `wrestling:upgradeArena` (validates wonder owned, promotion active, nation can afford cost).

### Ticket Pricing
- Users set ticket price for **Weekly Show** and **Monthly Nation PPV** (NOT Mass PPV — Mass PPV is free/cross-nation).
- Ticket price is per-show: `promotion.ticketPrice.weekly` and `promotion.ticketPrice.monthlyPPV`.
- Ticket price bounds: min $1, max $500.
- **Attendance model**: Attendance = f(ticket price, wrestler skills, arena seating level, promotion fans, wrestler popularity). If price too high relative to draw, attendance drops toward 0. If too low, revenue is left on the table.
- Concessions level increases revenue per attendee.
- Ticket price stored on promotion, applied at show simulation.

## 5. Population Integration (Fan Thresholds → Championships)

This is the core differentiator from sports. Wrestling fans are a **subset of the nation's own population** (not world population), tracked on the promotion:

- `promotion.fans`: current fan count (starts at 0).
- `promotion.maxFansEver`: peak fan count ever reached (used for monotonic threshold detection).
- `promotion.attendanceCap`: soft ceiling based on arena seating (`seating * 5000`) — a single show cannot draw more attendees than capacity, but total accumulated fans can exceed capacity over time.
- Fan percentage = `promotion.fans / nation.population` (population from `window.PopulationSystem.getTotalPopulation()` or `nation.population` — **the nation's own population**, not global/world population). On the server (world.js), use `nation.population` (computed each turn by NationSystem).
- **Fans cannot exceed nation.population (100%)** — percentage is computed live each check; `promotion.fans` is clamped to `nation.population`.

### 5.1 Championship Unlock Tiers
When fan % crosses a threshold, the corresponding championship(s) unlock permanently (never re-lock if fans or population later drop):

| Threshold | Championship(s) Unlocked | Notes |
|-----------|-------------------------|-------|
| 10% | **Insanity Championship** (Intergender Hardcore Rules) | One title, any gender, Insanity rules only |
| 25% | **Women's Mid-Card Championship** + **Men's Mid-Card Championship** | Draws fewer fans than World; like Intercontinental / International |
| 33% | **Women's Tag-Team Championship** + **Men's Tag-Team Championship** | Teams of 2 |
| 50% | **Women's World Championship** + **Men's World Championship** | The top titles; draws the most fans |

- Threshold detection uses `maxFansEver / nation.population` — once a tier is unlocked it is permanent (monotonic).
- Track unlocked titles in `promotion.championships.unlocked = ['insanity', 'womensMidCard', 'mensMidCard', 'womensTagTeam', 'mensTagTeam', 'womensWorld', 'mensWorld']`.
- A title is "active" (can be defended) only if its tier is unlocked AND a champion is crowned (or vacancy).
- Fan % is recomputed each weekly show and on `day_passed` (population changes).
- Emits `wrestling:championshipUnlocked` when a tier is first crossed.

### 5.2 Fan Source
- Fans gained from weekly show matches (charisma-driven, match grading, stipulation bonuses).
- Fans gained from Monthly Nation PPV matches.
- Fans gained/lost from Quarterly Mass PPV matches (performance-based).
- No cross-promotion league fans (wrestling is solo), except the Monthly Nation PPV and Quarterly Mass PPV.
- Fans are gained or lost (fan loss possible from poor Mass PPV performance).

### 5.3 Currency & Revenue
- **Weekly show revenue**: Base gate revenue from attendance (capped by arena seating). Paid from nation economy.
- **Monthly Nation PPV revenue**: Higher gate + PPV buy revenue (nation currency).
- **Mass PPV revenue**: Performance-based currency payout (win = currency gained, poor = no currency). No gate revenue (cross-nation event).
- **Title defense bonus**: Successful title defense grants small currency bonus.
- All wrestling revenue/expenses flow through `nation.money` — no separate wrestling wallet.
- Arena upgrade costs paid from `nation.money` (same as sports stadium upgrades).
- Wrestler salaries paid weekly from `nation.money` (per-week `salary` on wrestler object).

## 6. Championship System

### 6.1 Title Definition
Each championship:
```js
{
  id: string,
  key: 'insanity' | 'womensMidCard' | 'mensMidCard' | 'womensTagTeam' | 'mensTagTeam' | 'womensWorld' | 'mensWorld',
  name: string,
  gender: 'men' | 'women' | 'intergender',
  division: 'world' | 'midcard' | 'tagteam' | 'insanity',
  requiredMatchType: 'singles' | 'tagteam' | null, // null = any (insanity title uses singles)
  requiredStipulation: 'insanity' | null, // null = any stipulations allowed; Insanity title requires Insanity stipulation only
  unlocked: boolean,
  championId: string | null, // wrestler id
  championName: string | null,
  reigns: number, // total title reigns across all champions
  titleDefenses: number,
  prestigeLevel: number, // 1-10, higher = more fans, harder to win
  lineage: [{ championId, startDay, endDay, defenses, note }],
  beltDesign: { colors: [], plates: [], sidePlates: [], leatherColor: string }, // custom belt visuals
  createdDay: number,
}
```

### 6.2 Title Match Restrictions (Enforced at Booking)
- **Tag-Team Titles**: can ONLY be defended in a `tagteam` match, AND both wrestlers on a team must match the title's gender (men's tag → 2 men; women's tag → 2 women). Cannot be defended in singles/trio/fatal four.
- **Singles Titles** (World, Mid-Card, Insanity): can ONLY be defended in a `singles` match. Cannot be defended in tag team, trio, or fatal four.
- **Insanity Championship**: requires `insanity` rules (No DQ) only — cannot be defended under any other ruleset.
- **ANY other stipulations** can be applied to non-Insanity title matches (1 fall, 2/3 falls, Ladder, Table, Cage, Death Match, First Blood, Last Man Standing, Iron Man, Submission Only, Knockout, No Count-Out, No DQ).
- **Ladder stipulation**: ONLY valid for a title match (must be for title). Cannot be used in non-title matches.
- **Iron Man**: can end in draw (tied falls) — only non-title match that allows draw.
- **Gender conflict**: A wrestler cannot hold titles of opposing gender divisions simultaneously (e.g., cannot hold both Men's World and Women's World; cannot hold Men's Tag and Women's Tag). A wrestler CAN hold titles across different divisions of the same gender (e.g., Men's World + Men's Mid-Card + Insanity).
- A wrestler can hold multiple titles across divisions (e.g., Men's World + Insanity), but cannot hold two titles of the same gender/division that conflict (enforced at booking: a champion booked in a non-title match while holding a title is fine; booked in a title match for a title they don't own is a challenge).

### 6.3 Championship Prestige Levels
- `prestigeLevel` (1-10): World titles start at 8, Mid-Card at 5, Tag-Team at 4, Insanity at 6.
- Prestige increases with: long reigns, many defenses, famous champions, high-grade title matches.
- Prestige decreases with: vacant titles, short reigns, low-grade title matches.
- Higher prestige = more fan draw per title defense, higher title multiplier in fan formula.
- Belt design customizable: colors, plates, side plates, leather color.

### 6.4 Crowning a Champion
- When a title is unlocked with no champion: first title match for that crown determines the inaugural champion (winner becomes champion).
- Title changes hands when the champion loses a title match.
- Vacating: `wrestling:vacateTitle` (champion stripped, title vacant, next title match crowns new champion).
- Champion retiring / released: title becomes vacant automatically.
- Reign tracked by days held and defenses.

### 6.5 Title Prestige / Draw
- World titles draw more fans per defense than mid-card; insanity draws niche (hardcore) fans.
- Title match fan bonus multiplier: World 1.5x, Mid-Card 1.2x, Insanity 1.1x, Tag-Team 1.1x.
- Undefeated reigns and long reigns increase prestige (stored per title).

## 7. Weekly Events

### 7.1 Show Structure
- One show per week, on the promotion's `airingDay`.
- Max **4 matches** per weekly show (`promotion.weeklyShow.matches` array, max length 4).
- Each match: `{ id, matchType, stipulation, titleKey|null, participants: [{ wrestlerId, team }], winnerId|null, fansGained, matchGrade, injuries }`.
- `promotion.lastShowDay` tracks the last game day a show aired (used to compute next airing day).

### 7.2 Booking Flow
- User books matches during the week (any day before airing).
- `wrestling:bookMatch` validates:
  - Promotion active.
  - It is not past the airing day for the current week (booking window closes at airing).
  - Match count < 4.
  - Wrestlers belong to promotion roster, not injured, not already booked on this week's card.
  - Title match restrictions (section 6.2).
  - Ladder rule only for title.
- `wrestling:removeMatch` to unbook (before airing only).
- `wrestling:setWeeklyCard` to finalize/reorder.

### 7.3 Show Simulation
- On `airingDay`, `processWeeklyShow()` simulates all booked matches in order using the match grading engine (section 10).
- Computes winners, fans gained (charisma + grade + stipulation), injuries (section 11), XP/skill gains.
- Updates title reigns if title changed (title changes persist; only the match card is cleared).
- Emits `wrestling:showCompleted` with full results.
- Match card cleared after simulation; new card can be booked for next week.
- `promotion.lastShowDay` updated to current day.

### 7.4 Monthly Nation PPV
- Each promotion runs its own monthly PPV (nation-based), separate from weekly shows.
- Occurs once per month (~30 game days) on the promotion's airing day.
- Max **6 matches** (double the weekly cap of 4).
- Higher fan draw than weekly shows, bigger injury risk.
- Wrestlers selected by the user from their roster.
- **Monthly PPV replaces that week's weekly show** (no weekly show that week).
- Not part of the weekly 4-match cap (separate event).
- Emits `wrestling:monthlyPpvCompleted`.

### 7.5 Quarterly Mass PPV (Cross-Nation)
- Every 3 months (approx. every ~90 game days / ~13 weeks), a Mass PPV occurs involving **every nation with an active wrestling promotion**.
- Mass PPV is **globally synced**: all participating promotions run it on the same game day, tracked by `wrestlingSystem.massPpvCycleDay` (not per-promotion timers).
- Each participating nation selects **exactly 1 wrestler** from their roster via `wrestling:massPpvRegisterWrestler` before the Mass PPV day.
- AI nations auto-select their top-rated available wrestler.
- **Match assignment**: With 1 wrestler per nation, the system randomly groups registered wrestlers into matches:
  - **Singles**: 2 wrestlers from different nations
  - **Tag-Team**: 4 wrestlers (2 teams of 2) — same-gender pairs (each team's two wrestlers must be same gender; teams can be cross-nation but each wrestler represents their own nation)
  - **Tricky Trio**: 3 wrestlers from different nations
  - **Fatal Four**: 4 wrestlers from different nations
  - Match type and stipulation are randomly drawn from the full pool for each match.
- **Title-on-the-line option**: The registering nation may choose to put one of that wrestler's held championships on the line.
  - **If wrestler wins**: Extra currency + bonus fans.
  - **If wrestler loses**: Loses fans (regardless of match performance) AND the lost championship is **blocked from use** (cannot be defended or booked) until after the next Mass PPV cycle completes.
- **Performance-based payout** (applies to all participants, title or not):
  - **Win / Strong performance**: Currency + fans gained.
  - **Poor performance**: No currency gained AND fans lost.
  - **Very poor performance**: No currency + significant fan loss.
- Not part of weekly 4-match cap or monthly PPV cap (separate event).
- If a registered wrestler is injured on Mass PPV day, they are replaced by the promotion's next top-rated available wrestler.
- Blocked titles are unblocked after the Mass PPV cycle completes (all promotions' Mass PPV matches resolved).
- Emits `wrestling:massPpvCompleted` with per-wrestler results (currency change, fan change, title won/lost, title blocked).

## 8. Wrestler System

### 8.1 Wrestler Definition
```js
{
  id: string,
  name: string,
  gender: 'men' | 'women',
  wrestlerType: 'brawler' | 'highflyer' | 'tank' | 'showboat' | 'icon',
  featuredMatch: {
    matchType: 'singles' | 'tagteam' | 'trickytrio' | 'fatalfour',
    stipulation: '1fall' | '2of3falls' | 'insanity' | 'ladder' | 'table' | 'cage' | 'deathmatch' | 'firstblood' | 'lastmanstanding' | 'ironman' | 'submissiononly' | 'knockout' | 'nocountout' | 'nodq',
  },

  // Core skills (1-99) — INDEPENDENT of sports player skills
  strength: number,
  agility: number,
  endurance: number,
  charisma: number,

  // Derived / tracked
  level: number,
  xp: number,
  potential: number,
  morale: number, // 0-100, affects match grade and fan gain
  happiness: number, // 0-100, wrestler satisfaction with contract/booking/promotion

  // Career
  matchesWrestled: number,
  wins: number, losses: number, // no draws in wrestling (Iron Man excepted)
  fansGainedTotal: number,
  personalFans: number, // wrestler's individual fan count (separate from promotion.fans)
  titleReigns: [{ titleKey, startDay, endDay, defenses }],
  injuries: [], // injury history
  isInjured: boolean, injuryWeeksLeft: number, injuryType: string,
  isRetired: boolean,
  contractWeeksRemaining: number, // weeks until contract expires
  salary: number, // per-week salary
  signingBonus: number, // one-time payment on signing

  // Draft
  isDrafted: boolean,
  draftRate: number,
  demographic: 'teen'|'youngAdult'|'adult'|'middleAged'|'older',
  age: number,

  // Tag team
  tagTeamId: string | null,

  // Persona / Gimmick
  alignment: 'face' | 'heel', // Face = fan favorite, Heel = villain
  gimmick: 'hardcore' | 'technical' | 'highflyer' | 'powerhouse' | 'charismatic' | 'monster' | 'comedic',
  crowdReaction: number, // -100 to +100 (heat/popularity meter)

  // Moves
  signatureMove: { id: string, name: string, type: string, damage: number, fanImpact: number },
  finisherMove: { id: string, name: string, type: string, damage: number, fanImpact: number, finisherRating: number },
  moveSet: [{ id: string, name: string, type: string, damage: number, learnedAtLevel: number }],

  // Rivalries
  rivalries: [{ rivalWrestlerId: string, intensity: number, type: string, startedDay: string }],
}
```

### 8.2 Skills (Independent — Not Tied to Player Skills)
Wrestler skills are **completely separate from sports player skills** and are NOT derived from or tied to them. No cross-referencing with sports player attributes.

- **Strength** + **Agility**: determine match results (win probability).
- **Endurance**: injury chance and durability (higher = less injury, faster recovery).
- **Charisma**: fans gained per match the wrestler is in.
- **Morale**: affects match grade (higher = better performance) and fan gain multiplier.

### 8.3 Wrestler Types & Base Stat Spreads
| Type | Primary Strength | Description |
|------|-----------------|-------------|
| Brawler | Strength | High strength, lower agility |
| High-Flyer | Agility | High agility, lower strength |
| Tank | Endurance | High endurance, durable |
| Showboat | Charisma | High charisma, big fan draw |
| Icon | Average | Average all stats; synergizes with all types |

Generation: primary stat rolled high (75-90), others mid (40-65), Icon all mid-high (55-75).

### 8.4 Type Matchups (Fighting & Teaming)
Fight synergy (how well two wrestlers perform against each other / in a match together as opponents):
- Brawler vs High-Flyer: **fight well** (classic clash).
- Tank vs Showboat: **fight well**.
- High-Flyer vs Showboat: **fight poorly**.
- Brawler vs Tank: **fight poorly**.
- Icon: fights well with all types.

Team synergy (tag team / trio partners):
- Brawler + High-Flyer: **poor team**.
- Tank + Showboat: **poor team**.
- High-Flyer + Showboat: **good team**.
- Brawler + Tank: **good team**.
- Icon: good team with all types.

These modifiers apply to match grading (section 10) as synergy bonuses/penalties for teammates, and opponent style advantage for singles.

### 8.5 Featured Match
- Each wrestler has ONE featured match combination: a `matchType` + `stipulation` pair (e.g., `{ matchType: 'singles', stipulation: 'ladder' }` or `{ matchType: 'tagteam', stipulation: 'deathmatch' }`).
- Any match type can pair with any stipulation — all 4 match types × 13 stipulations = 52 possible featured combinations.
- When wrestling in their featured match (both matchType AND stipulation match): +grade bonus, +fans bonus, better performance.
- When wrestling in featured matchType but different stipulation: half bonus.
- When NOT in featured matchType: slight penalty.
- Set at draft/generation; can be changed via retraining (cost).

### 8.6 Personas & Gimmicks
- **Alignment**: `face` (fan favorite) or `heel` (villain). Faces gain more fans when winning cleanly; Heels gain fans when winning dirty/cheating and lose fans when losing cleanly.
- **Gimmick archetypes**: `hardcore`, `technical`, `highflyer`, `powerhouse`, `charismatic`, `monster`, `comedic`. Each gives passive bonuses in certain match types/stipulations and affects crowd reaction.
- **Crowd Reaction** (`crowdReaction`): -100 to +100 heat/popularity meter. Positive = over with crowd; Negative = heat. Affects fan gain multiplier and match grade.
- Gimmick affects which stipulations the wrestler performs better in (e.g., Hardcore gimmick excels in Insanity/Death Match, Technical excels in Submission Only).

### 8.7 Wrestler Happiness
- `happiness` (0-100): wrestler satisfaction with contract, booking, and promotion.
- **Factors that increase happiness**: winning matches, title reigns, high salary, featured match bookings, main event spots, good contract terms.
- **Factors that decrease happiness**: losing streaks, being jobbed (consistently losing), low salary, injuries, not being booked, title being taken away, being underutilized.
- Happiness affects: match performance (lower happiness = worse grade), fan gain (unhappy wrestlers gain fewer fans), contract renewal likelihood, risk of leaving the promotion.
- If happiness drops below 20, wrestler may request release or refuse to wrestle.

### 8.8 Individual Wrestler Fans
- `personalFans`: each wrestler's individual fan count, separate from `promotion.fans`.
- Wrestlers gain personal fans from: match wins, high match grades, title reigns, being in their featured match, crowd reactions, storyline involvement.
- Wrestlers lose personal fans from: losses, poor match grades, being jobbed, long injuries, title losses.
- Personal fans drive **merchandise revenue** — more personal fans = more merch sold per show.
- Personal fans are tracked per wrestler and persist across contracts/releases.

### 8.9 Draft System (Shared with Sports DraftPool)
- Wrestling uses the **existing Sports `DraftSystem`** infrastructure (`systems/Sports/draft-system.js`) — a new `wrestling` sport type is added alongside basketball, hockey, soccer, football.
- **Prerequisite**: `wrestling` must be added to:
  - `SportsSystem.sportTypes` (systems/Sports/sports-system.js)
  - `TeamPlayerSystem.sportTypes`, `TeamPlayerSystem.sportAttributes.wrestling`, `TeamPlayerSystem.playerPositions.wrestling` (systems/Sports/team-player-system.js)
- Global wrestling draft board (`wrestlingDraftBoard`) is managed by `DraftSystem`, using the same `calculateTargetPlayerCount()` pattern as sports (scales by team count and global skill standard).
- Populated when a nation unlocks the arena wonder and regenerated on retirements.
- Wrestlers generated with gender, wrestler type, featured match, skills (strength/agility/endurance/charisma), age/demographic, contract (1-12 weeks), salary, persona/gimmick, moves.
- Nations draft wrestlers onto their roster via `wrestling:draftWrestler` (pays signing salary from nation.money).
- Draft board visible to all users (`wrestling:getDraftBoard`).
- Free agents / released wrestlers return to the same `DraftSystem` board.
- Contract expiry: `contractWeeksRemaining` decrements weekly; at 0, wrestler becomes free agent (returned to draft board) unless contract extended.
- **Skills are NOT tied to player skills** — wrestlers have their own independent skill generation (Section 8.2/8.3). No cross-referencing with sports player attributes.

### 8.10 Moves & Finishers
- **Move Set**: Each wrestler has a move set of 5-10 moves learned over time through experience/training. Each move has: id, name, type, damage, fanImpact, learnedAtLevel.
- **Signature Move**: One designated signature move per wrestler. Provides a damage/performance boost in specific match situations. Higher signature move rating = better mid-match momentum.
- **Finisher Move**: One match-ending finisher per wrestler. Has `finisherRating` (1-100). Higher finisher rating = better win probability in close matches, especially late in matches. Finisher can only be used once per match (or when conditions met).
- Moves generate match text: "{WrestlerName} hits the {MoveName}!" — used for text generation of match results.
- New moves learned as wrestler levels up or through training.

### 8.11 Tag Team Management
- Tag teams are created via `wrestling:createTagTeam({ name, wrestlerIdA, wrestlerIdB })`.
- Both wrestlers must be same gender, on the same promotion roster, and not already in another tag team.
- Tag teams have their own `teamChemistry` score (starts at 50, improves with matches wrestled together).
- Tag teams can be dissolved via `wrestling:dissolveTagTeam`.
- Only wrestlers in a tag team can compete for Tag-Team Championships together.
- Tag team chemistry decreases if team members don't wrestle together for 4+ weeks.

### 8.12 Roster Management
- `promotion.roster`: plain object `{ [wrestlerId]: true }` (signed wrestlers) for JSON serialization; full wrestler objects live in `WrestlingSystem.wrestlers` Map (wrestlerId -> wrestler object).
- No position slots; roster is a flat list. Practical limit enforced by salary budget (nation.money).
- `wrestling:signWrestler`, `wrestling:releaseWrestler`, `wrestling:extendContract`, `wrestling:trainWrestler` (attribute), `wrestling:changeFeaturedMatch`, `wrestling:createTagTeam`, `wrestling:dissolveTagTeam`, `wrestling:setMoveSet`, `wrestling:setSignatureMove`, `wrestling:setFinisherMove`.

## 9. Match Types & Stipulations (Rules)

### 9.1 Match Types
| Match Type | Participants | Description |
|------------|--------------|-------------|
| Singles | 1v1 | One vs one |
| Tag-Team | 2v2 | Teams of 2 (gender must match for tag titles) |
| Tricky Trio | 1v1v1 | Three-way |
| Fatal Four | 1v1v1v1 | Four-way |

### 9.2 Stipulations (Rules) — layered on top of match type
Stipulations determine how a match is won and affect injury risk, fan gain, and match grade. Any stipulation can be applied to any match type (subject to title restrictions in 9.3).

| Stipulation | Description | Injury Risk | Fan Gain | Title Restriction |
|-------------|-------------|-------------|----------|-------------------|
| 1 Fall | Standard pinfall/submission | Low | Baseline | Allowed |
| 2 Out of 3 Falls | Best of 3 falls | Medium | +10% | Allowed |
| Insanity | No DQ, weapons allowed | High | +20% | Allowed (Insanity title requires this) |
| Ladder | Climb ladder to retrieve title belt | Medium | +25% | **Title matches only** |
| Table | Win by putting opponent through table | Medium | +15% | Allowed |
| Cage | Win by escape or pinfall in cage | Medium-High | +15% | Allowed |
| Death Match | Extreme, weapons, barbed wire, fire | Very High | +50% | Allowed |
| First Blood | Winner is first to draw blood | High | +20% | Allowed |
| Last Man Standing | No pinfalls — win by 10-count knockout | High | +20% | Allowed |
| Iron Man | 30-minute time limit, most falls wins | Medium | +15% | Allowed |
| Submission Only | Win only by submission | Medium | +10% | Allowed |
| Knockout | Win only by KO | High | +20% | Allowed |
| No Count-Out | Count-outs disabled | Low | +5% | Allowed |
| No Disqualification | Disqualifications disabled | High | +15% | Allowed |

### 9.3 Booking Validation Matrix
```
Singles title       → matchType: singles,    stipulation: any (except Insanity title which requires Insanity)
Tag team title      → matchType: tagteam,    stipulation: any, gender match required, both wrestlers same gender as title
Insanity title      → matchType: singles,    stipulation: insanity ONLY (No DQ)
Ladder stipulation  → titleKey must be non-null (title matches only)
Iron Man            → can end in draw (tied falls) — only non-title match that allows draw
```

### 9.4 Fans Gained Per Match
Formula:
```
baseFans = 500 + (arena.seatingLevel * 50) + (fanExperienceLevel * 100)
charismaFactor = 1 + (sum(charisma of participants) / 100) * 0.5  // charisma 1-99, scaled
matchGradeMultiplier = based on grade (F=0.5 ... S+=2.0)
stipulationMultiplier: Death Match 1.5, Insanity 1.2, Ladder 1.3, First Blood 1.2, Last Man Standing 1.2, Knockout 1.2, Cage 1.1, Table 1.1, 2/3 falls 1.1, Iron Man 1.1, Submission Only 1.1, No DQ 1.1, No Count-Out 1.05, 1 fall 1.0
titleMultiplier: World 1.5, Mid-Card 1.2, Insanity 1.1, Tag 1.1, non-title 1.0
featuredMatchBonus: 1.2 if wrestler's featuredMatch matches both matchType AND stipulation; 1.1 if only matchType matches; 1.0 otherwise
winBonus: 1.3 for winners
fansGained = baseFans * charismaFactor * matchGradeMultiplier * stipulationMultiplier * titleMultiplier * featuredMatchBonus * winBonus
```
Fans distributed to each participant by charisma share; `promotion.fans` accumulates (capped at `nation.population`, 100% max). **Each wrestler also gains/loses personalFans individually** based on their charisma share and performance (Section 8.8).

### 9.5 Ticket Pricing & Revenue
- Users set ticket price for **Weekly Show** (`promotion.ticketPrice.weekly`) and **Monthly Nation PPV** (`promotion.ticketPrice.monthlyPPV`). NOT Mass PPV (free/cross-nation).
- Ticket price bounds: min $1, max $500.
- **Attendance formula**: `attendance = floor(arenaSeatingLevel * 5000 * drawFactor * priceFactor)`
  - `drawFactor` = f(promotionFans / nation.population, avgWrestlerSkill / 100, showGrade / 100, recentWinRate) — ranges 0.1 to 1.0
  - `priceFactor` = max(0, 1 - (ticketPrice / (basePriceTolerance * showGradeMultiplier))) — basePriceTolerance starts at $25, scales with show grade
  - If priceFactor drops to 0, attendance = 0 (nobody shows up at that price)
- **Ticket Revenue** = attendance × ticketPrice
- **Concessions Revenue** = attendance × concessionsLevel × perAttendeeRate ($2 base)
- **Merchandise Revenue** = sum of each participant's personalFans × merchMultiplier × concessionsBonus
- **PPV Buy Revenue** (Monthly PPV only): based on card star power, match stipulations, and show grade.
- All revenue flows to `nation.money`.

### 9.6 Wrestler Contracts (Well-Rounded)
- `contractWeeksRemaining`: weeks until contract expires (decrements weekly).
- `salary`: per-week salary paid from `nation.money`.
- `signingBonus`: one-time payment on signing.
- **Contract negotiation**: Users can offer new contracts before expiry. Wrestler happiness affects renewal likelihood.
- **Contract buyouts**: Pay to release a wrestler early (cost = remaining salary × buyoutMultiplier).
- **No-compete clauses**: Released wrestler can't sign with rival promotions for X weeks.
- **Downside guarantees**: Minimum weekly pay regardless of shows worked.
- **Merchandise splits**: Wrestler gets % of their merch revenue (paid weekly).
- **Contract tiers**: Rookie (low salary, short term), Veteran (higher salary, longer term), Star (premium salary, merchandise split), Legend (top salary, creative control).
- If `contractWeeksRemaining` reaches 0 and not extended, wrestler becomes free agent (returned to draft board).
- Wrestler contract auto-renews at expiry if happiness > 60 and user has sufficient funds (auto-renew can be disabled).

### 9.7 Merchandise Revenue
- Each wrestler has `personalFans` (Section 8.8) — drives their individual merch sales.
- **Merch per show** = sum over participants of (personalFans × merchMultiplier × wrestlerMerchSplit).
- Merch multiplier affected by: wrestler popularity, gimmick, show grade, concessions level.
- Title holders sell more merch (prestige bonus).
- Merch revenue paid weekly from show revenue to `nation.money`, with wrestler split paid from that.

## 10. Match Grading System

A cohesive, complex match grade computed from all factors. Grade scale: `F, D-, D, D+, C-, C, C+, B-, B, B+, A-, A, A+, S-, S, S+`.

### 10.1 Grade Inputs
- **Wrestler skills**: average strength+agility of participants (performance), endurance (durability during match), charisma (entertainment).
- **Match type**: Singles (baseline), Tag-Team (+teamwork), Tricky Trio (+chaos), Fatal Four (+chaos, lower individual shine).
- **Stipulation**: Death Match & Insanity (+brutality grade), Ladder (+spotfest), Table/Cage (+), 2/3 Falls (+endurance), Iron Man (+time-limit drama), First Blood (+brutality), etc.
- **Title match**: +prestige (based on title prestige level).
- **Type synergy**: teammate synergy (good team bonus, poor team penalty); opponent style advantage (fight well vs fight poorly).
- **Featured match**: participants whose featuredMatch matches both matchType AND stipulation perform better; half bonus if only matchType matches.
- **Morale**: higher morale = better grade.
- **Happiness**: unhappy wrestlers perform worse (grade penalty).
- **Injury status**: injured wrestlers perform worse (or can't compete).
- **Finisher usage**: using finisher in match increases grade and win probability late.
- **Crowd reaction**: face/heel alignment and crowdReaction affect grade.
- **Random variance**: ±10% roll for unpredictability.
- **Move variety**: using signature moves and diverse move set increases grade.

### 10.2 Grade → Effects
- Grade determines:
  - Fans gained multiplier (section 9.4).
  - XP gained by wrestlers (higher grade = more XP).
  - Injury risk modifier (brutal stipulations + low endurance = higher risk).
  - Momentum / morale gain/loss for wrestlers.
  - **Show rating** (aggregate of all match grades on a show).
  - **Revenue multiplier** — higher show grade = higher PPV buyrate, higher merch sales, higher ticket price tolerance next show.
  - PPV buyrate and future ticket price ceiling.

### 10.3 Show Rating Calculation
- **Show rating** = average of all match grades on the card, weighted by match position (main event = 2x weight, opener = 0.5x weight).
- Bonus factors: title matches on card (+5% per title match), stipulation variety (+2% per unique stipulation), star power (top 3 wrestlers by personalFans, +1% each).
- Show rating scale: 0-100, mapped to letter grade F-S+.
- Show rating affects: PPV buyrate (Monthly PPV), ticket price tolerance for next show, merch sales multiplier, promotion prestige, fan gain for all participants.

### 10.4 Match Text Generation (Narrative)
Every match generates text describing how it ended:
- **Result text**: `"{WinnerName} defeated {LoserName} by {method} in a {matchType} ({stipulation}) match."`
- **Winning methods**: Pinfall, Submission, Knockout, Count-out, Disqualification, Escape (Cage), Ladder retrieval, Table put-through, First Blood, Iron Man decision.
- **Move text**: `"{WrestlerName} hits the {MoveName}!"` for signature moves and finisher.
- **Finisher text**: `"{WinnerName} hits the {FinisherName} — that's it!"` when finisher ends the match.
- **Stipulation-specific text**: First Blood — `"{WinnerName} drew first blood!"`; Last Man Standing — `"{LoserName} couldn't answer the 10-count!"`; Iron Man — `"Final score: {WinnerName} {X} - {Y} {LoserName} falls."`
- **Full match narrative**: Sequence of moves, near-falls, finisher attempt, and finish described in text for UI display.
- Match text is stored in match result and shown in `wrestling:matchCompleted` / `wrestling:showCompleted` events.

### 10.5 Winner Determination
- Win probability based on relative (strength + agility) of participants, modified by endurance (durability in long matches), featured match bonus (full if matchType+stipulation match, half if matchType only), type synergy vs opponent, finisherRating, and random variance.
- **Singles**: higher strength/agility wins; direct comparison.
- **Tag-Team**: team strength = sum of members with synergy modifier; winning team determined first, then the wrestler who scored the fall is determined within the winning team (based on individual performance rating).
- **Tricky Trio (1v1v1)**: all three compete; winner determined by three-way probability (each wrestler's chance proportional to their strength+agility).
- **Fatal Four (1v1v1v1)**: all four compete; winner determined by four-way probability (each wrestler's chance proportional to their strength+agility).
- **Iron Man**: can end in draw if falls are tied after time limit. Only stipulation that allows draws.
- No draws in other match types (every match produces a winner).

## 11. Injury System (Adapted from Sports Injury Patterns)

Wrestling adapts the injury logic from the Sports `TeamPlayerSystem` injury code (`systems/Sports/team-player-system.js`) — **not** a direct call to `inflictInjury()` because that requires a `team` object with `team.stadium.medicalCenter` and uses `player.attributes.endurance`/`stamina` which wrestling wrestlers do not have. Wrestling implements its own injury calculation using the same severity 1-5 scale, injury data file (`assets/data/Sports/injuries.js`), and recovery logic, parameterized for wrestling:

- Time unit: **weeks** (not games/seasons) — `injuryWeeksLeft` decrements weekly on day_passed.
- Injury risk factors adapted for wrestling: endurance (inverse), match stipulations (Death Match >> Insanity > Cage > Table > Ladder > 2/3 Falls > 1 Fall), wrestler age, consecutive matches (fatigue), charisma (showboats take bigger bumps), previous injuries.
- Medical Center arena level reduces weeks (each level -10%, min 1 week for severity 2+).
- Endurance reduces natural recovery time.

### 11.1 Injury Severity & Weeks Out
| Severity | Description | Weeks Out |
|----------|-------------|-----------|
| 1 | Minor | 0 (no time) |
| 2 | Mild | 1 week |
| 3 | Moderate | 2-3 weeks |
| 4 | Major | 4-8 weeks (season-ish) |
| 5 | Career Ending | permanent (retire) |

### 11.2 Recovery
- `injuryWeeksLeft` decrements each week (on day_passed / weekly cycle), not per game.
- Severity 1 (Minor): 0 weeks out — no time missed.
- Severity 2-4: Medical Center arena level reduces weeks (each level -10%, min 1 week for severity 2+).
- Endurance reduces natural recovery time (higher endurance = faster healing).
- Severity 4 (Major) may have a "season-ending" feel but not career.
- Severity 5 = `isRetired = true`, removed from roster, title vacated if champion.

### 11.3 Injury Tracking
- `promotion.injuries`: object `{ [wrestlerId]: { type, weeksLeft, severity, date, matchId } }`.
- `wrestler.injuryHistory` array.
- Nation statistic `wrestlingInjuriesTotal` incremented.
- Emits `wrestling:wrestlerInjured`, `wrestling:wrestlerRetired`, `wrestling:wrestlerReturned`.
- WrestlingSystem implements its own `inflictInjury`/`healInjuries` methods (adapted from TeamPlayerSystem patterns) — does not call TeamPlayerSystem methods directly.

## 12. Data Model (Promotion Serialization)

Stored on `nation.wrestlingPromotion` and serialized via `Nation.serialize()`:

```js
wrestlingPromotion: {
  id, name, airingDay, foundedDay, isActive, lastShowDay,
  lastMonthlyPpvDay,
  fans, maxFansEver,
  ticketPrice: { weekly: number, monthlyPPV: number }, // user-set ticket prices
  arena: { seating, gym, medicalCenter, youthAcademy, fanExperience, concessions, technologyCenter },
  roster: { [wrestlerId]: true },   // object of wrestlerId -> true (signed wrestlers); full wrestler objects in wrestling.wrestlers map
  tagTeams: [{ id, name, wrestlerIdA, wrestlerIdB, chemistry }],
  championships: {
    unlocked: [keys],
    titles: { [key]: titleDefinition },
    vacantTitles: [keys],
    blockedTitles: [keys], // titles blocked from use after Mass PPV loss, unblock after next Mass PPV
  },
  weeklyShow: { matches: [], weekStartDay },
  showHistory: [ { week, day, matches: [full match results], fansGained, showRating, ticketRevenue, concessionsRevenue, merchRevenue, ppvBuyRevenue, attendance } ],
  monthlyPpvHistory: [ { day, matches: [full match results], fansGained, showRating, ticketRevenue, concessionsRevenue, merchRevenue, ppvBuyRevenue, attendance } ],
  massPpvHistory: [ { day, wrestlerId, matchType, stipulation, result, currencyChange, fanChange, titleWon, titleLost, titleBlocked } ],
  titleHistory: [],
  rivalries: [{ wrestlerIdA, wrestlerIdB, intensity, type, startedDay }], // promotion-level rivalries
  storylines: [{ id, name, type, wrestlers[], startDay, endDay, active }], // active storylines
  injuries: { [wrestlerId]: { type, weeksLeft, severity, date, matchId } },
  statistics: { showsHeld, totalMatches, titleChanges, fansGainedTotal, injuriesTotal, massPpvWins, massPpvLosses, totalRevenue, totalTicketRevenue, totalMerchRevenue },
  airingDayChangedDay: number,
}
```

**System-level state** (on WrestlingSystem instance, not per-promotion):
- `massPpvCycleDay`: next global Mass PPV game day (initial value = foundingDay + 90, advances by 90 each cycle)
- `massPpvRegistrations`: Map nationId -> { wrestlerId, titleOnTheLineKey|null } for current cycle

`wrestling.wrestlers` Map (wrestlerId -> full wrestler object) lives on the Wrestling System instance, serialized separately in system state (like sports.players). Each wrestler includes: `personalFans`, `happiness`, `morale`, `alignment`, `gimmick`, `crowdReaction`, `signatureMove`, `finisherMove`, `moveSet`, `rivalries`.

`WrestlingSystem.getState()` / `setState()`: promotions (rebuilt from nation.wrestlingPromotion), wrestlers, `massPpvCycleDay`, PPV state.

## 13. Natural Rivalries & Storylines

### 13.1 Rivalry System
- **Rivalry tracker**: Track feuds between two wrestlers (`wrestler.rivalries` array).
- **Natural spawning**: Rivalries can spawn naturally from:
  - Two wrestlers facing each other multiple times with close finishes
  - A heel cheating to beat a face (or vice versa)
  - Title changes hands between two wrestlers
  - Interference in another wrestler's match
  - Both wrestlers chasing the same title
  - Crowd reactions clashing (face vs heel heat)
- **Rivalry intensity** (0-100): Increases with each encounter, title exchange, or interference. Higher intensity = more fan draw for matches between rivals.
- **Feud bonus**: Matches in an active feud (intensity > 50) draw more fans and higher match grades.
- **Storyline angles**: Turn heel/face, betrayal, alliance formation, injury angles, title pursuits.
- **Contender tournaments**: #1 contender match/tournament for each title can spark rivalries.

### 13.2 Storyline System
- Storylines are narrative arcs involving multiple wrestlers over several weeks.
- **Storyline types**: Title pursuit, grudge match, faction war, redemption arc, rookie push, veteran put-over.
- **Storyline progression**: Each weekly show advances the storyline (segments, confrontations, match outcomes).
- **Storyline conclusion**: Payoff match (often at Monthly PPV or Mass PPV) that resolves the feud.
- **Storyline bonus**: Wrestlers in active storylines gain more fans and have higher match grades.
- AI promotions also generate storylines and rivalries automatically.

### 13.3 Happiness & Storylines
- Being in a prominent storyline increases wrestler happiness.
- Being jobbed (consistently losing) in a storyline decreases happiness.
- Wrestlers want to be featured in storylines — lack of storyline involvement decreases happiness over time.

## 14. System Integration Points

### 14.1 EventBus
- `wonder_built` / `wonder_demolished` → unlock/lock wrestling promotion.
- `wrestling:promotionUnlocked`, `wrestling:promotionCreated`.
- `wrestling:createPromotion`, `wrestling:bookMatch`, `wrestling:removeMatch`, `wrestling:setWeeklyCard`.
- `wrestling:upgradeArena`.
- `wrestling:draftWrestler`, `wrestling:signWrestler`, `wrestling:releaseWrestler`, `wrestling:extendContract`, `wrestling:trainWrestler`, `wrestling:changeFeaturedMatch`.
- `wrestling:createTagTeam`, `wrestling:dissolveTagTeam`.
- `wrestling:setMoveSet`, `wrestling:setSignatureMove`, `wrestling:setFinisherMove`.
- `wrestling:vacateTitle`.
- `wrestling:processWeeklyShow` (triggered by day processing when current day == airing day).
- `wrestling:processMonthlyPpv` (nation-based monthly PPV).
- `wrestling:monthlyPpvCompleted`.
- `wrestling:massPpvRegistered`, `wrestling:massPpvCompleted` (quarterly cross-nation Mass PPV with per-wrestler currency/fan/title results).
- `wrestling:matchCompleted`, `wrestling:showCompleted`.
- `wrestling:championshipUnlocked`, `wrestling:titleChanged`, `wrestling:titleVacated`, `wrestling:titleBlocked` (title blocked after Mass PPV loss).
- `wrestling:wrestlerInjured`, `wrestling:wrestlerRetired`, `wrestling:wrestlerReturned`.
- `wrestling:aiPromotionAction` (AI booking/draft decisions).
- All `EventBus` calls guarded with `if (typeof EventBus !== 'undefined')` (server-safe, matches Sports System pattern).

### 14.2 Day Processing (wired into world.js)
- `turn(at, day)`: for each promotion:
  - If `day >= promotion.lastShowDay + daysUntilNextAiringDay(promotion.airingDay)`, trigger `processWeeklyShow()` (unless a monthly PPV falls on that day — monthly PPV replaces weekly show).
  - If `day >= promotion.lastMonthlyPpvDay + 30`, trigger `processMonthlyPpv()`.
  - If `day >= wrestlingSystem.massPpvCycleDay`, trigger `processMassPpv()` for all promotions with registered wrestlers, then advance `massPpvCycleDay` by 90.
- `daysUntilNextAiringDay(dayOfWeek)` computes days from current day to next occurrence of that weekday (1-7 days). Airing day computed from `lastShowDay + daysUntilNextAiringDay()`, **not** `day % 7`.
- Decrement `injuryWeeksLeft` weekly; check retirements; regenerate draft board on retirements.
- Recompute fan % vs population; unlock championships (monotonic).
- Wrestler salaries paid weekly from `nation.money`.
- AI promotions auto-manage rosters, draft, and booking each week/show cycle.
- WrestlingSystem `turn(at, day)` called from `world.js` day loop (alongside `this.sports.turn(at, this.state.day)`).

### 14.3 Population System Hook
- `window.PopulationSystem.getTotalPopulation()` or `nation.population` for fan % threshold. On server use `nation.population`.
- Listen to population changes to recompute thresholds (promotion.fans / population can cross thresholds even without a show if population drops — though unlocks are permanent, new thresholds only go up based on maxFansEver).

### 14.4 Wonders System
- Add `wrestlingArena` to `wonderTypes` in `systems/Building/wonders-system.js` (cost: money 90000000, techRequired 1200, resources { bronze-manufactured: 600, steel-manufactured: 300, copper-manufactured: 300 }, category: 'sports', maxCount: 1).
- Add `case 'wrestlingArena':` to `applyWonderEffects` switch setting `nation.wonderEffects.wrestlingPromotionUnlocked = true`.
- `hasWonder(nationId, 'wrestlingArena')` implemented as `nation.wonders.wrestlingArena > 0` on the nation object.
- Demolition: `wonders-system.js demolishWonder` decrements count; WrestlingSystem `onWonderDemolished` sets promotion `isActive = false`.

### 14.5 AI Nations Running Wrestling Promotions
- AI nations (non-player controlled) can build `wrestlingArena` and run wrestling promotions, using the **AITeamSystem** pattern (same as sports AI teams).
- AI promotion management:
  - Autodrafts wrestlers from the shared `DraftSystem` wrestling board.
  - Auto-books weekly shows (4 matches) using AI logic: books title defenses when champions exist, fills remaining slots with top-rated roster wrestlers.
  - Auto-selects 1 wrestler for Monthly Nation PPV and Quarterly Mass PPV (top-rated available wrestler, skipping injured; skips champions with blocked titles).
  - AI may put a title on the line at Mass PPV if the champion is among top-rated and AI confidence is high.
- AI teams are not "easy wins" — they scale competitively (middle-of-pack strength) so user promotions can win but aren't guaranteed.
- AI promotions participate fully in championship unlocks, title reigns, and Mass PPV payouts.
- Emits `wrestling:aiPromotionAction` for AI booking/draft decisions.

### 14.6 Save / Load
- `WrestlingSystem.getState()` / `setState()`: promotions, wrestlers, draft boards, `massPpvCycleDay`, PPV state.
- **`entities/Nation.js`**: `serialize()` must include `wrestlingPromotion`; `deserialize()` must restore it.
- Nation serialization includes `wrestlingPromotion`.
- Wrestler objects serialized plainly (no Maps — convert Maps to objects/arrays for JSON).

### 14.7 Icons & Assets (assets/images/Wrestling/)
- All wrestling UI uses icons from `assets/images/Wrestling/`.
- **Championship icons**: `wrestling-title-insanity.png`, `wrestling-title-mens-world.png`, `wrestling-title-womens-world.png`, `wrestling-title-mens-midcard.png`, `wrestling-title-womens-midcard.png`, `wrestling-title-mens-tag.png`, `wrestling-title-womens-tag.png`.
- **Match type icons**: `wrestling-singles.png`, `wrestling-tagteam.png`, `wrestling-trickytrio.png`, `wrestling-fatalfour.png`.
- **Stipulation icons**: `wrestling-1fall.png`, `wrestling-2of3falls.png`, `wrestling-insanity.png`, `wrestling-ladder.png`, `wrestling-table.png`, `wrestling-cage.png`, `wrestling-deathmatch.png`, `wrestling-firstblood.png`, `wrestling-lastmanstanding.png`, `wrestling-ironman.png`, `wrestling-submissiononly.png`, `wrestling-knockout.png`, `wrestling-nocountout.png`, `wrestling-nodq.png`.
- **Wrestler type icons**: `wrestler-brawler.png`, `wrestler-highflyer.png`, `wrestler-tank.png`, `wrestler-showboat.png`, `wrestler-icon.png`.
- **UI icons**: `wrestling-arena.png`, `wrestling-promotion.png`, `wrestling-weekly-show.png`, `wrestling-monthly-ppv.png`, `wrestling-mass-ppv.png`.
- Follows the same icon pattern as `docs/DEV/award-icons.md` for the Sports awards system.

### 14.8 Class Relationships
```
WrestlingSystem
  ├── promotions: Map nationId -> promotion
  ├── wrestlers: Map wrestlerId -> wrestler
  ├── massPpvCycleDay: number
  ├── massPpvRegistrations: Map nationId -> { wrestlerId, titleOnTheLineKey|null }
  ├── championships config
  └── config: match types, stipulations, wrestler types, grade scale
```

WrestlingSystem follows the same module export pattern as Sports System (`module.exports` / `window.WrestlingSystem`) and is registered in `server/world.js` alongside `Sports`.

### 14.9 world.js Wiring (required)
1. In `server/world.js` constructor (`restore`): add `this.wrestling = new WrestlingSystem(this, state.wrestling);` after `this.sports = new Sports(this, state.sports);`.
2. In `snapshot()`: add `wrestling: this.wrestling.snapshot()` to the returned clone.
3. In the day processing loop (after `this.sports.turn(at, this.state.day);` at line ~4131): add `this.wrestling.turn(at, this.state.day);`.
4. In `runAction` switch: add wrestling actions (`wrestlingCreatePromotion`, `wrestlingBookMatch`, `wrestlingRemoveMatch`, `wrestlingSetWeeklyCard`, `wrestlingUpgradeArena`, `wrestlingDraftWrestler`, `wrestlingSignWrestler`, `wrestlingReleaseWrestler`, `wrestlingExtendContract`, `wrestlingTrainWrestler`, `wrestlingChangeFeaturedMatch`, `wrestlingCreateTagTeam`, `wrestlingDissolveTagTeam`, `wrestlingSetMoveSet`, `wrestlingSetSignatureMove`, `wrestlingSetFinisherMove`, `wrestlingVacateTitle`, `wrestlingMassPpvRegisterWrestler`) delegating to `this.wrestling.action(id, action, data)`.
5. In `view(id)`: add `wrestling: this.wrestling.view(id)` to the returned view object.

### 14.10 Nation.js Serialization (required)
- `serialize()`: add `wrestlingPromotion: this.wrestlingPromotion` to the returned object.
- `deserialize(data)`: add `this.wrestlingPromotion = data.wrestlingPromotion || null;` and ensure it's initialized.

## 15. File Structure

```
systems/Sports/
  wrestling-system.js          # Main WrestlingSystem class
  wrestler-system.js           # Wrestler generation, skills, types, draft, tag teams, personas, happiness, moves, individual fans
assets/data/Wrestling/
  wrestler-names.js            # Wrestler name lists (male/female, gimmick names)
  match-types.js               # Match type & rule definitions
assets/images/Wrestling/
  wrestling-title-*.png        # Championship icons
  wrestling-*-match.png        # Match type icons
  wrestling-*-rule.png         # Rule icons
  wrestler-*-type.png          # Wrestler type icons
  wrestling-*.png              # UI icons (arena, promotion, shows, PPVs)
docs/DEV/
  wrestling-system-plan.md     # This document
```

Required edits to existing files:
- `systems/Sports/sports-system.js`: add `'wrestling'` to `sportTypes`.
- `systems/Sports/team-player-system.js`: add `wrestling` to `sportTypes`, `sportAttributes.wrestling = ['strength', 'agility', 'endurance', 'charisma']`, `playerPositions.wrestling = ['wrestler']`.
- `systems/Building/wonders-system.js`: add `wrestlingArena` wonder type + `case 'wrestlingArena'` in `applyWonderEffects`.
- `entities/Nation.js`: add `wrestlingPromotion` to `serialize()` and `deserialize()`.
- `server/world.js`: register WrestlingSystem, wire into `turn()` and `view()`, add action handlers.

## 16. Validation & Edge Cases

- A wrestler cannot be booked on two matches in the same weekly show.
- A champion cannot lose a title in a non-title match (titles only change on title matches).
- Insanity Championship requires Insanity stipulation only — cannot be defended under other stipulations.
- If a titleholder is injured for weeks, title remains theirs (no automatic stripping) — user may vacate.
- Death Match injury risk is significantly higher than Insanity (per spec).
- Ladder stipulation cannot be booked unless `titleKey` is set.
- Tag titles require gender-matched teams in tagteam match type; both wrestlers must match the title's gender.
- Icons have no type disadvantage and team well with all.
- A wrestler cannot hold opposing-gender titles simultaneously (e.g., Men's World + Women's World).
- Fans cap: `promotion.fans` cannot exceed `nation.population` (100%); percentage computed live.
- Championship unlocks are monotonic (once unlocked, never re-lock) based on `maxFansEver`.
- Mass PPV title-on-the-line: if champion loses, fans are lost AND the championship is blocked until after the next Mass PPV cycle completes.
- Mass PPV poor performance: no currency gained AND fans lost (even without title on the line).
- Mass PPV win: currency + fans gained; with title on the line: extra currency + bonus fans.
- Mass PPV is globally synced via `wrestlingSystem.massPpvCycleDay` (not per-promotion timers).
- Mass PPV match types assigned randomly; Tag-Team requires same-gender pairs (can be cross-nation).
- Medical Center "min 1 week" applies only to severity 2+; severity 1 is always 0 weeks.
- Contract uses `contractWeeksRemaining` (not seasons), decremented weekly.
- Tag teams require same-gender pair; only tag teams can compete for Tag-Team Championships.
- Airing day computed from `lastShowDay + daysUntilNextAiringDay()`, not `day % 7`.
- Injury system uses adapted TeamPlayerSystem patterns (not a direct call to `inflictInjury`).
- Wrestler skills are independent of sports player skills (no cross-tying).
- Featured match is a matchType + stipulation pair (52 possible combinations: 4 match types × 13 stipulations); full bonus only when both match, half bonus when matchType only matches.
- AI nations can run promotions and participate in Mass PPV via AITeamSystem pattern.
- All UI uses icons from `assets/images/Wrestling/` (championships, match types, stipulations, wrestler types).
- Ticket price too high → attendance drops toward 0; too low → revenue left on table.
- Ticket pricing applies to Weekly Show and Monthly PPV only (NOT Mass PPV).
- Wrestler happiness below 20 → may request release or refuse to wrestle.
- PersonalFans tracked per wrestler, separate from promotion.fans.
- Merch revenue based on participant personalFans, concessions level, and ticket price.
- Iron Man is the only stipulation that allows draws.
- Moves (Signature/Finisher) generate match text for narrative output.
- Rivalries spawn naturally from repeated encounters, title exchanges, cheating, interference.
- Storylines advance weekly and conclude with payoff matches at PPVs.
- Mass PPV: if a registered wrestler is injured on Mass PPV day, they are replaced by the promotion's next top-rated available wrestler.
- Mass PPV: blockedTitles are unblocked after the Mass PPV cycle completes (all promotions' Mass PPV matches resolved).
- Ticket price has min ($1) and max ($500) bounds to prevent extreme values.
- Show rating = weighted average of match grades (main event 2x, opener 0.5x) + title/stipulation/star power bonuses.
- Monthly PPV happens on the promotion's airing day and replaces that week's weekly show (no weekly show that week).
- AI Mass PPV selection skips injured wrestlers and champions with blocked titles.
- Championship prestige decreases if title is vacant for more than 4 weeks.
- Tag team chemistry decreases if team members don't wrestle together for 4+ weeks.
- Wrestler contract auto-renews at expiry if happiness > 60 and user has sufficient funds (auto-renew can be disabled).

## 17. Sports System Ticket Pricing (Complex)

The Sports System also needs complex ticket pricing, matching the wrestling model:

### 17.1 Ticket Price Setting
- Users set ticket price per team per sport: `team.ticketPrice` (applies to all home games).
- Ticket price bounds: min $1, max $500.
- **Attendance formula**: `attendance = floor(arenaSeatingLevel * 5000 * drawFactor * priceFactor)`
  - `drawFactor` = f(teamFans / nation.population, avgTeamSkill / 100, recentWinRate) — ranges 0.1 to 1.0
  - `priceFactor` = max(0, 1 - (ticketPrice / (basePriceTolerance * skillMultiplier))) — basePriceTolerance starts at $25, scales with team skill
  - If priceFactor drops to 0, attendance = 0 (nobody shows up at that price)
- Team skill level = average of starting players' skills (strength, agility, etc. per sport).
- Arena seating level determines capacity cap.
- Team fans (from population integration) affect baseline draw.
- Recent performance (win/loss streak) affects short-term draw.

### 17.2 Revenue Calculation
- **Ticket Revenue** = attendance × ticketPrice
- **Concessions Revenue** = attendance × concessionsLevel × perAttendeeRate
- **Merchandise Revenue** = teamFans × merchMultiplier
- All revenue flows to `nation.money`.

### 17.3 Price Sensitivity
- Each sport has a base price sensitivity coefficient.
- Higher skill teams can charge higher prices before attendance drops.
- Larger arenas (higher seating level) can support higher prices.
- Winning streaks temporarily increase price tolerance.
- Losing streaks decrease price tolerance.

## 18. Implementation Order (Suggested)

1. Add `wrestlingArena` wonder type to `wonders-system.js` (cost, tech, resources, effect handler — unified sports wonder pattern, exact sports stadium costs).
2. Add `wrestling` sport type to Sports `sportTypes` (`systems/Sports/sports-system.js`) and `TeamPlayerSystem` (`sportAttributes.wrestling`, `playerPositions.wrestling`, `sportTypes`).
3. Add ticket pricing to Sports System (`team.ticketPrice`, complex attendance model — Section 17).
4. Modify `entities/Nation.js` — add `wrestlingPromotion` to `serialize()` and `deserialize()`.
5. Create wrestling icon assets in `assets/images/Wrestling/` (championships, match types, stipulations, wrestler types, UI).
6. Create `systems/Sports/wrestler-system.js` (skills, types, names, generation, draft, tag teams, personas, happiness, moves, individual fans — skills independent of player skills).
7. Create `systems/Sports/wrestling-system.js` (promotion, arena upgrades, ticket pricing, booking, weekly show, monthly PPV, quarterly Mass PPV, match grading, text generation, injuries adapted from TeamPlayerSystem patterns, championships with prestige/history, population ties, rivalries/storylines, contracts, merch revenue, icons).
8. Wire AI nations into wrestling promotions via `ai-team-system.js` (autodraft, auto-booking, Mass PPV selection, auto-storylines).
9. Register in `server/world.js` alongside `Sports`; wire EventBus + day processing (`turn()`), `snapshot()`, `view()`, action handlers.
10. Add save/load state methods (`getState`/`setState` on WrestlingSystem).
11. Write tests for match grading, title unlock thresholds, injury weeks, booking validation, Mass PPV payouts/title blocking, ticket pricing attendance, merch revenue.

## 19. Completeness Ideas (Additional, Beyond Core Plan)

Ideas that go beyond the core plan for extra depth (not required for MVP):

### 19.1 Arena Naming & Presentation
- **Arena naming**: Name your arena (e.g., "The Hammer Dome").
- **Arena theme/theme song**: Custom arena entrance music.
- **Seating configurations**: Different arena layouts affect capacity and intimacy bonus.
- **Home crowd advantage**: Bonus to home promotion's wrestlers in weekly shows.

### 19.2 Rankings & Awards
- **Power rankings**: Weekly top 10 wrestlers per division based on wins, grade, fan gain.
- **Pound-for-pound list**: Overall best wrestlers regardless of division.
- **Year-end awards**: Wrestler of the Year, Match of the Year, Rookie of the Year, Feud of the Year.
- **Hall of Fame**: Induct retired wrestlers; Hall of Famers give prestige bonus to promotion.

### 19.3 Championship Belt Customization (Extended)
- **Belt design**: Colors, plates, side plates, leather color (stored in `championships.titles[].beltDesign`).
- **Title replica belts**: Sell replicas of championship belts for merch revenue.
- **Belt prestige history**: Track prestige level changes over time.

### 19.4 Backstage & Locker Room
- **Locker room morale**: Overall promotion mood affects show grade.
- **Backstage drama**: Conflicts between wrestlers reduce chemistry and match quality.
- **Veteran leadership**: Experienced wrestlers improve rookie development and locker room stability.

### 19.5 Broadcasting & Media
- **TV ratings**: Weekly show viewership based on match quality, star power, and time slot.
- **Social media buzz**: Wrestler and promotion trending — boosts fan gain temporarily.
- **Press conferences**: Hype upcoming matches, temporarily increase fan interest.
- **TV deal**: Negotiate broadcast contracts for weekly shows — larger deals = more revenue, wider fan reach.

---

*This plan is the authoritative design spec for the Wrestling System. Implementation should follow this document section-by-section. All integration points have been verified against the existing codebase (world.js, Nation.js, wonders-system.js, sports-system.js, team-player-system.js, draft-system.js, ai-team-system.js, population-system.js).*
