# Diplomacy System

The **Diplomacy System** (`DiplomacySystem`) manages all diplomatic relations, treaties, alliances, intelligence sharing, and aid between nations. It is the primary interface for nation-to-nation interaction outside of direct combat.

| Item | Value |
|------|-------|
| **Class:** | `DiplomacySystem` |
| **Global instance:** | `window.DiplomacySystem` |
| **Source file:** | `systems/diplomacy-system.js` |
| **Depends on:** | `EventBus`, `GameEvents`, `WarSystem` (war events), `AllianceSystem` (alliance records), `Nation` entities |

---

## Architecture

### Core Data Structures

| Map | Key | Value |
|-----|-----|-------|
| `activeTreaties` | `treatyId` | Active treaty record (nation-level) |
| `treatyProposals` | `proposalId` | Pending treaty proposal (nation-level) |
| `allianceInvitations` | `invitationId` | Pending alliance invitation |
| `aidProposals` | `aidId` | Pending financial aid proposal |
| `allianceTreaties` | `allianceId1:allianceId2` | Active alliance-to-alliance treaty |
| `nationDiplomacy` | `nationId` | Per-nation diplomacy data (relationships, treaties, slots, penalties) |
| `diplomacyScores` | `id1:id2` | Diplomacy score per nation pair (-100 to +100) |
| `_expirationWarnings` | `id:days` | Deduplicated treaty expiration warning tracker |
| `_boundHandlers` | handler name | Bound event handler references for proper cleanup |

### Nation Diplomacy Data Structure

```js
{
  treaties: Map<treatyId, treaty>,       // Active treaties this nation is party to
  treatySlots: {                         // Treaty slot capacity
    embassies: number,                   // Number of embassy improvements
    canModifyRelationships: boolean,     // Has Office of Relationships project
    maxFriends: number,
    maxFoes: number
  },
  relationships: {
    friends: string[],                   // Nation IDs considered friends
    bestFriend: string | null,           // Single best friend
    foes: string[],                      // Nation IDs considered foes
    nemesis: string | null               // Single nemesis
  },
  embassySlots: number,                  // Current embassy usage
  pendingProposals: [],                  // Proposals awaiting this nation's response
  aidSlots: [                            // Active aid proposal slots (max 3)
    { aidId, targetId, expiresAt }
  ],
  penalties: [                           // Active treaty violation penalties
    { type, treatyId, treatyType, amount, duration, appliedAt }
  ]
}
```

### Treaty Object Structure

```js
{
  id: string,                            // Unique treaty ID
  type: string,                          // Treaty type (see Treaty Types below)
  parties: string[],                     // Nation IDs involved
  terms: any,                            // Treaty-specific terms object
  createdAt: timestamp,                  // When treaty was signed
  expiresAt: timestamp | null,           // Expiration (null = permanent)
  violations: number,                    // Count of treaty violations
  status: 'active'                       // Treaty status
}
```

---

## Treaty Types

| Type | Max Per Nation | Max Per Alliance | Embassies Required | Category | Conflict With | Easter Egg |
|------|---------------|------------------|-------------------|----------|---------------|------------|
| `protectorate` | 1 | 2 | No | `protection` | protection, unity | No |
| `extension` | 1 | 2 | No | `unity` | protection, unity | No |
| `mutualDefense` | 6 | 10 | Yes (5) | `defense` | defense, aggression, peace | Yes |
| `mutualAggression` | 6 | 10 | Yes (5) | `aggression` | defense, aggression, peace | Yes |
| `optionalDefense` | 6 | 10 | Yes (5) | `defense` | defense, aggression, peace | No |
| `optionalAggression` | 6 | 10 | Yes (5) | `aggression` | defense, aggression, peace | No |
| `intelligence` | 2 | 0 | No | `intelligence` | None | No |
| `peace` | 3 | 5 | No | `peace` | defense, aggression, peace | No |

### Treaty Descriptions

- **Protectorate** — Protector guarantees protection in all wars to the protectorate. Failure penalty: -25 happiness for 7 days.
- **Extension** — Nations/alliances act as one entity, assisting in all affairs. Failure penalty: -15 happiness for 7 days.
- **Mutual Defense** — Both parties must engage in ALL defensive wars together. Requires 5 embassies. Failure penalty: -10 happiness for 7 days.
- **Mutual Aggression** — Both parties must engage in ALL offensive wars together. Requires 5 embassies. Failure penalty: -10 happiness for 7 days.
- **Optional Defense** — Parties may choose to engage in defensive wars, no penalties for declining. Requires 5 embassies. Failure penalty: -20 happiness for 7 days.
- **Optional Aggression** — Parties may choose to engage in offensive wars, no penalties for declining. Requires 5 embassies. Failure penalty: -20 happiness for 7 days.
- **Intelligence** — Share technology and intelligence between nations. Requires Financial Assistance Office project. 20% tech sharing per day (capped at 500 tech/day). Partners cannot spy on each other.
- **Peace** — Non-aggression agreement preventing war declarations. Max 30 days for nations, 180 days for alliances. Cannot be broken early.

### Category Conflict Rules

Certain treaty categories conflict with each other for the same nation pair:

| New Treaty Category | Conflicts With |
|---------------------|---------------|
| `protection` | protection, unity |
| `unity` | protection, unity |
| `defense` | defense, aggression, peace |
| `aggression` | defense, aggression, peace |
| `peace` | defense, aggression, peace |
| `intelligence` | None |

A nation cannot have active treaties of conflicting categories with the same partner nation.

---

## Diplomacy Score System

Each nation pair has a **diplomacy score** ranging from **-100 (hostile)** to **+100 (allied)**. Default is 0 (neutral). Scores affect relationship labels and treaty acceptance.

### Score → Relationship Label Mapping

| Score Range | Relationship Label |
|-------------|-------------------|
| +75 to +100 | Best Friend |
| +25 to +74 | Friend |
| -24 to +24 | Neutral |
| -74 to -25 | Foe |
| -100 to -75 | Nemesis |

### Score Modification Methods

| Method | Description |
|--------|-------------|
| `modifyDiplomacyScore(nationId1, nationId2, amount, reason)` | Adds `amount` to the score (clamped to [-100, 100]) |
| `setDiplomacyScore(nationId1, nationId2, score)` | Sets score directly |
| `getDiplomacyScore(nationId1, nationId2)` | Returns current score |

### Relationship Methods (also adjust scores)

| Method | Score Change |
|--------|-------------|
| `addFriend(nationId1, nationId2)` | +25 |
| `removeFriend(nationId1, nationId2)` | -10 |
| `removeFoe(nationId1, nationId2)` | +10 |
| `setBestFriend(nationId1, nationId2)` | +50 |
| `addFoe(nationId1, nationId2)` | -50 |
| `setNemesis(nationId1, nationId2)` | -75 |

The `_syncRelationshipFromScore()` method ensures relationship labels (friend/foe/bestFriend/nemesis) stay consistent with the current score. When a score crosses a threshold, labels are automatically added or removed.

---

## Treaty Lifecycle

### 1. Propose (`proposeTreaty`)

```js
diplomacySystem.proposeTreaty({
  proposerId: 'nation_A',
  targetId: 'nation_B',
  treatyType: 'mutualDefense',
  terms: {},
  duration: 30  // days (optional, null = permanent)
})
```

Validation checks:
- Treaty type is valid
- Both nations exist
- Not proposing to yourself
- No duplicate active treaty of same type with same nation
- No category conflicts
- Embassy requirements met
- Treaty count limits respected
- Friend/foe relationship requirements (for maxNation=6 types)
- Financial Assistance Office (for intelligence pacts)

On success: creates a pending proposal (7-day expiry) and emits `treaty_proposed`.

### 2. Accept (`acceptTreaty`)

```js
diplomacySystem.acceptTreaty(proposalId)
```

Validation:
- Proposal exists
- Status is 'pending'
- Not expired

On success: creates active treaty, adds to both nations' diplomacy records, updates Alliance objects if both nations are in alliances, checks alliance easter egg condition, emits `treaty_accepted` and `treaty_signed`.

### 3. Decline (`declineTreaty`)

```js
diplomacySystem.declineTreaty(proposalId)
```

Sets status to 'declined' and emits `treaty_declined`.

### 4. Removal (`removeTreaty`)

```js
diplomacySystem.removeTreaty(treatyId)
```

Removes from `activeTreaties` and from all parties' `nationDiplomacy.treaties` maps. Emits `treaty_removed`.

### 5. Expiration

Treaties with `expiresAt` set are automatically removed by `processExpiredTreaties()` (called daily via `DAY_PASSED` event). Warnings are emitted at 7 days and 1 day before expiry via `treaty_expiring_soon`.

---

## Alliance-to-Alliance Treaties

Alliance-level treaties operate between alliances rather than individual nations.

### Methods

| Method | Description |
|--------|-------------|
| `proposeAllianceTreaty(data)` | Propose treaty between two alliances |
| `acceptAllianceTreaty(proposalId)` | Accept a pending alliance treaty proposal |
| `declineAllianceTreaty(proposalId)` | Decline a pending alliance treaty proposal |
| `removeAllianceTreaty(allianceId1, allianceId2)` | Remove an active alliance treaty |
| `getAllianceTreaty(allianceId1, allianceId2)` | Get active alliance treaty |
| `hasAlliancePeaceTreaty(allianceId1, allianceId2)` | Check for peace treaty between alliances |

### Data Flow

Proposals are stored in `allianceTreaties` Map keyed by proposal ID. When accepted, the active treaty is stored keyed by `_allianceTreatyKey(allianceId1, allianceId2)` (sorted colon-joined string). Alliance objects in `AllianceSystem` are updated via `_updateAllianceAllianceTreatyRecords()` to record the relationship in their `treaties` array and `relations` map.

### Alliance-Level Treaty Expiration

Alliance treaties with `expiresAt` are processed daily. Warnings emitted at 7 and 1 day remaining (`alliance_treaty_expiring_soon`). Expired treaties are removed and `alliance_treaty_expired` is emitted.

---

## Alliance Easter Egg

A special condition enables alliance creation outside the normal `allianceFoundingWonder` requirement:

**Conditions:**
1. Nation A is Nation B's `bestFriend`
2. Nation A has at least 5 `friends`
3. All 5 friends have a mutual pact (`mutualDefense` or `mutualAggression`) with Nation A
4. Nation B has a mutual pact or protectorate with all 5 of Nation A's friends

When met, `alliance_easter_egg_available` is emitted with the two nations and a hint message.

---

## Intelligence Pacts

Intelligence pacts provide deep integration between two nations:

### Benefits

1. **Tech Sharing** — Each nation receives 20% (`techShareRatio`) of the partner's tech daily, capped at 500 tech per nation per day. Processed in `processIntelligencePacts()`.
2. **No Spying** — Partners cannot spy on each other. `canSpyOn(attackerId, targetId)` returns `{ allowed: false, reason: 'Cannot spy on intelligence pact partner' }`.
3. **Intel Sharing** — All `gatherIntel` spy operation results are shared with intelligence partners via `intel_shared_with_partner` events.

### Requirements

- `Financial Assistance Office` project must be built by the proposer nation.
- Max 2 intelligence pacts per nation.
- Alliances cannot sign intelligence pacts (`maxAlliance: 0`).

---

## Treaty Violations & Obligations

### Violation Checking (`checkTreatyViolations`)

Called when `war_declared` event fires. Checks:

1. **Peace Pacts** — If both warring nations have a peace pact between them, it's a violation (`peace_pact_violation`).
2. **Mutual Defense / Mutual Aggression** — If both parties to a mutual pact are now at war with each other, it's a conflict (`mutual_pact_conflict`).

### Post-War Obligations (`processTreatyObligations`)

Called when `war_ended` event fires. Checks:

| Treaty Type | Violation Condition | Penalized Party |
|-------------|-------------------|-----------------|
| `protectorate` | Protectorate lost, protector didn't win | Protector nation |
| `mutualDefense` | Ally was attacked (lost), defender didn't win | Non-participating ally |
| `mutualAggression` | Ally declared offensive war (won), aggressor didn't win | Non-participating ally |

### Penalty Application (`applyTreatyViolation`)

Each treaty type defines a `failurePenalty`:
- `protectorate`: -25 happiness, 7 days
- `extension`: -15 happiness, 7 days
- `mutualDefense`: -10 happiness, 7 days
- `mutualAggression`: -10 happiness, 7 days
- `optionalDefense`: -20 happiness, 7 days
- `optionalAggression`: -20 happiness, 7 days

Penalties are applied to responsible parties only (not both nations for one-sided violations). Penalties reduce nation happiness daily via `processHappinessPenalties()` and expire after their duration.

---

## Mutual Defense Auto-Join

When a war is declared, `_checkMutualDefenseAutoJoin()` checks if the defender has mutual defense pacts. For each pact partner, it emits `mutual_defense_activated` with:
- `warId`, `treatyId`, `defender`, `partner`, `partnerNation`, `message`

The partner nation can then choose to join the war on the defender's side.

---

## Aid System (with World Bank Tax)

Nations can send financial aid to other nations. The World Bank takes a tax on each transfer.

### Tax Calculation (`_calculateAidTax`)

**Base: 5%** + 5% per condition:

| Condition | Adds |
|-----------|------|
| Not in same alliance | +5% |
| Not friend/bestFriend | +5% |
| Is foe/nemesis | +5% |
| No ties at all (no treaties, friend/foe, alliance) | +5% |
| Different faction color | +5% |

**Maximum: 30%**

### Aid Lifecycle

1. **Propose** (`proposeAid`) — Deducts amount + tax from proposer immediately. Tax is kept by World Bank (not refundable). Creates aid proposal (7-day expiry). Consumes 1 aid slot.
2. **Accept** (`acceptAid`) — Transfers amount to target. Frees aid slot.
3. **Decline** (`declineAid`) — Refunds amount (not tax) to proposer. Frees aid slot.
4. **Expire** — Pending proposals past expiry refund amount to proposer.

### Requirements

- `Financial Assistance Office` project required.
- Max 3 concurrent aid proposals per nation.

---

## Event Reference

| Event | Data | When |
|-------|------|------|
| `treaty_proposed` | `{ proposal, message }` | Treaty proposed |
| `treaty_accepted` | `{ treaty, proposal }` | Treaty accepted |
| `treaty_signed` | `{ treaty, proposal, participants }` | Treaty signed (alliance-compatible) |
| `treaty_declined` | `{ proposal }` | Treaty declined |
| `treaty_proposal_expired` | `{ proposal }` | Treaty proposal expired |
| `treaty_expired` | `{ treaty }` | Active treaty expired |
| `treaty_removed` | `{ treatyId, treaty }` | Treaty manually removed |
| `treaty_expiring_soon` | `{ treatyId, treaty, daysRemaining }` | Treaty expiring in 7 or 1 days |
| `treaty_violation` | `{ treatyId, treatyType, violationType, nations, penalty }` | Treaty violation applied |
| `alliance_treaty_proposed` | `{ proposal, message }` | Alliance treaty proposed |
| `alliance_treaty_accepted` | `{ treaty, proposal }` | Alliance treaty accepted |
| `alliance_treaty_declined` | `{ proposal }` | Alliance treaty declined |
| `alliance_treaty_expired` | `{ treatyId, treaty }` | Alliance treaty expired |
| `alliance_treaty_removed` | `{ treatyId, treaty }` | Alliance treaty removed |
| `alliance_treaty_expiring_soon` | `{ treatyId, treaty, daysRemaining }` | Alliance treaty expiring soon |
| `alliance_easter_egg_available` | `{ nations, message }` | Easter egg condition met |
| `aid_proposed` | `{ aidProposal }` | Aid proposed |
| `aid_accepted` | `{ aidProposal }` | Aid accepted |
| `aid_declined` | `{ aidProposal }` | Aid declined |
| `aid_proposal_expired` | `{ aidProposal }` | Aid proposal expired |
| `relationship_changed` | `{ nationId1, nationId2, relationship }` | Relationship label changed |
| `diplomacy_score_changed` | `{ nationId1, nationId2, previousScore, newScore, change, reason }` | Score modified |
| `intelligence_tech_shared` | `{ treatyId, nationId1, nationId2, techSharedFrom1, techSharedFrom2 }` | Tech shared via intelligence pact |
| `intel_shared_with_partner` | `{ warId, sourceNation, partnerNationId, targetNationId, operation, result }` | Intel shared with intel partner |
| `mutual_defense_activated` | `{ warId, treatyId, defender, partner, partnerNation, message }` | Mutual defense pact triggered |
| `war_declared` | (from WarSystem) | War declared (triggers violation checks) |
| `war_ended` | (from WarSystem) | War ended (triggers obligation checks) |

---

## Methods Reference

### Treaty Management

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `proposeTreaty(data)` | `{ proposerId, targetId, treatyType, terms, duration }` | `proposalId` | Propose a treaty between two nations |
| `acceptTreaty(proposalId)` | `string` | `treatyId` | Accept a pending treaty proposal |
| `declineTreaty(proposalId)` | `string` | `boolean` | Decline a treaty proposal |
| `removeTreaty(treatyId)` | `string` | `void` | Remove an active treaty |
| `proposeAllianceTreaty(data)` | `{ proposerAllianceId, targetAllianceId, treatyType, terms, duration }` | `proposalId` | Propose treaty between two alliances |
| `acceptAllianceTreaty(proposalId)` | `string` | `treatyId` | Accept an alliance treaty proposal |
| `declineAllianceTreaty(proposalId)` | `string` | `boolean` | Decline an alliance treaty proposal |
| `removeAllianceTreaty(allianceId1, allianceId2)` | `string, string` | `void` | Remove an active alliance treaty |
| `getAllianceTreaty(allianceId1, allianceId2)` | `string, string` | `treaty \| null` | Get active alliance treaty |
| `hasAlliancePeaceTreaty(allianceId1, allianceId2)` | `string, string` | `boolean` | Check for alliance peace treaty |

### Relationships

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getRelationship(nationId1, nationId2)` | `string, string` | `string \| null` | Get relationship label |
| `getDiplomacyScore(nationId1, nationId2)` | `string, string` | `number` | Get diplomacy score (-100 to +100) |
| `modifyDiplomacyScore(nationId1, nationId2, amount, reason)` | `string, string, number, string` | `number` | Modify score (clamped) |
| `setDiplomacyScore(nationId1, nationId2, score)` | `string, string, number` | `number` | Set score directly |
| `addFriend(nationId1, nationId2)` | `string, string` | `boolean` | Add friend (+25 score) |
| `removeFriend(nationId1, nationId2)` | `string, string` | `boolean` | Remove friend (-10 score) |
| `setBestFriend(nationId1, nationId2)` | `string, string` | `boolean` | Set best friend (+50 score) |
| `addFoe(nationId1, nationId2)` | `string, string` | `boolean` | Add foe (-50 score) |
| `removeFoe(nationId1, nationId2)` | `string, string` | `boolean` | Remove foe (+10 score) |
| `setNemesis(nationId1, nationId2)` | `string, string` | `boolean` | Set nemesis (-75 score) |

### Intelligence

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `hasIntelligencePact(nationId1, nationId2)` | `string, string` | `boolean` | Check for active intel pact |
| `canSpyOn(attackerId, targetId)` | `string, string` | `{ allowed, reason }` | Check if spying is allowed |
| `getIntelligencePartners(nationId)` | `string` | `string[]` | Get all intel pact partners |

### War Integration

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `canDeclareWar(attackerId, defenderId)` | `string, string` | `{ allowed, reason }` | Check if war can be declared |
| `handleWarDeclared(data)` | `object` | `void` | Process war declaration (violations, mutual defense) |
| `handleWarEnded(data)` | `object` | `void` | Process war end (treaty obligations) |

### Aid

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `proposeAid(data)` | `{ proposerId, targetId, aidType, amount }` | `aidId` | Propose financial aid |
| `acceptAid(aidId)` | `string` | `boolean` | Accept aid proposal |
| `declineAid(aidId)` | `string` | `boolean` | Decline aid proposal |
| `validateAidProposal(data)` | `object` | `{ valid, reason }` | Validate aid proposal |

### Queries

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getNationDiplomacyStatus(nationId)` | `string` | `object` | Full diplomacy status for UI |
| `getPendingProposalsForNation(nationId)` | `string` | `proposal[]` | All pending proposals for a nation |
| `getNationTreatyCount(nationId, treatyType)` | `string, string` | `number` | Count active treaties of type |
| `calculateTreatySlots(nationId)` | `string` | `object` | Calculate treaty slot capacity |
| `refreshTreatySlots(nationId)` | `string` | `object` | Recalculate slots after building changes |
| `hasMutualPact(nationId1, nationId2)` | `string, string` | `boolean` | Check for mutual defense/aggression pact |
| `hasProtectorate(nationId1, nationId2)` | `string, string` | `boolean` | Check for protectorate pact |
| `findPeacePactTreaty(nationId1, nationId2)` | `string, string` | `treaty \| null` | Find active peace pact between nations |

### Lifecycle

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize system and bind events |
| `rebindEvents()` | Re-bind events (use if EventBus/GameEvents loaded late) |
| `destroy()` | Clean up all timers, maps, and event listeners |
| `processDailyDiplomacy(data)` | Daily processing (expired proposals, treaties, penalties, decay, intel, aid slots) |

---

## Cross-System Integration

### WarSystem Integration

`DiplomacySystem` is wired into `WarSystem`:

1. **`canDeclareWar()`** — Called before war declaration to check peace pacts and alliance peace treaties. Throws if war is not allowed.
2. **`handleWarDeclared()`** — Listens to `war_declared` event. Checks treaty violations and emits `mutual_defense_activated` for pact partners.
3. **`handleWarEnded()`** — Listens to `war_ended` event. Processes treaty obligations (protectorate, mutual defense, mutual aggression).

### AllianceSystem Integration

1. **`window.DiplomacySystem`** — Attached to `window` for cross-system access.
2. **`validateTreatyProposal` wrap** — AllianceSystem wraps this to block mutual pacts between alliance members.
3. **Alliance record updates** — When treaties are signed, Alliance objects in AllianceSystem are updated via `_updateAllianceTreatyRecords()` and `_updateAllianceAllianceTreatyRecords()`.

### EventBus Dependencies

Listens to:
- `GameEvents.DAY_PASSED` — Daily processing
- `war_declared` — Violation checking
- `war_ended` — Obligation processing

Emits all events listed in the Event Reference table above.

---

## Daily Processing

`processDailyDiplomacy()` is called each day via `DAY_PASSED` event and runs:

1. **`processExpiredProposals()`** — Cleans up expired treaty proposals, alliance treaty proposals, and aid proposals (refunds aid amounts)
2. **`processExpiredTreaties()`** — Removes expired treaties, emits expiration warnings at 7 and 1 day
3. **`processHappinessPenalties()`** — Applies daily happiness reductions from active penalties
4. **`processRelationshipDecay()`** — Fades relationships toward neutral based on diplomacy scores
5. **`processIntelligencePacts()`** — Shares tech between intelligence pact partners
6. **`processAidSlots()`** — Cleans up expired aid slots

---

## Design Notes

- **Missiles and nukes yield zero loot** — handled by War Terms System, not Diplomacy System
- **Only original attacker and defender** can offer/receive peace terms (enforced by WarSystem)
- **Treaty violations penalize responsible parties only** — not both nations for one-sided violations
- **Diplomacy scores clamp to [-100, +100]** — prevents runaway scores
- **`destroy()` cleans up all bound handlers** — prevents memory leaks from duplicate event listeners
- **`rebindEvents()` available** — use if EventBus/GameEvents load after DiplomacySystem construction
