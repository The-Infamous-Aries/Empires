# World Forum System

Global governance and faction voting system for Dominion Wars. The World Forum is where Congress proposes, debates, and votes on motions that affect the entire game world. All motion effects are delegated to the Motion System engine.

## Overview

- **Class:** `WorldForumSystem`
- **Globally available as:** `window.WorldForum`
- **Constructor:** `new WorldForumSystem()`
- **File:** `systems/world-forum-system.js` (~1,175 lines)
- **Export:** `module.exports` (Node.js) / `window.WorldForum` (browser)
- **Truth source for motions:** `systems/motion-system.js` (all motion types, durations, and effects)

## Architecture

```
WorldForumSystem
├── congressSeats (Map)        — factionKey -> seat count
├── congressMembers (Map)      — factionKey -> [player representative IDs]
├── activeMotions (Map)        — motionId -> motion object
├── motionHistory (Array)      — completed motions
├── activeElections (Map)      — factionKey -> congressional election
├── activeColorNameVotes (Map) — factionKey -> color name vote
├── activeEffects (Map)        — motionId -> active effect (UI/history mirror)
├── worldSettings (Object)     — worldName, calendar settings
└── getMotionTypeInfo()        — delegates to motion-system.js (truth source)
```

## Initialization

```js
const worldForum = new WorldForum();
```

The constructor calls `initialize()` which:
1. Calls `updateCongressComposition()` — calculates Congress seats based on Broadcasting-enabled nations
2. Calls `initializeColorNames()` — loads faction color names from GAME_COLORS or GridMap
3. Calls `bindEvents()` — binds event listeners (guarded against undefined `EventBus`/`GameEvents`)

## Congress Composition

Congress seats are allocated to factions based on members who have the **Broadcasting Network** project built:

- **Minimum:** 1 seat per faction with at least 1 Broadcasting-enabled member
- **Additional seats:** Proportional to Broadcasting-enabled member count (out of 20 additional seats)
- **No seats:** Factions with zero Broadcasting-enabled members

Seats are recalculated when:
- A faction member joins/leaves (`faction_joined`, `faction_left`)
- A new account is created (`account_created`)
- Broadcasting project is built or demolished (`project_built`, `project_demolished`)
- Monthly elections trigger (`month_passed`)

## Congressional Elections

Elections run every 7 days per faction. Players with Broadcasting Network can:
- **Run as candidates** (if they have Broadcasting Network)
- **Vote** (up to `seatsToFill` candidates per election)

Election flow:
1. `startCongressionalElections()` — creates elections for all factions with seats
2. `voteInCongressionalElection(factionKey, voterId, candidateIds)` — cast votes
3. `finalizeCongressionalElection(factionKey)` — selects top candidates as winners

Elected representatives are stored in `congressMembers` and can propose/vote on `congress_only` motions.

## Motion Lifecycle

World Forum manages the full motion lifecycle. All actual effect application is delegated to `motionSystem.applyMotion()`.

### 1. Proposal (`proposeMotion`)

Any eligible player can propose a motion. Requirements are checked against `motion-system.js` templates:

| Requirement | Check |
|-------------|-------|
| Project (Broadcasting) | `player.projectEffects.worldForumAccess` |
| Wonder (Internet) | `player.wonderEffects.globalVotingEnabled` |
| Scope (world) | Requires Internet wonder |
| Proposer role | `all`, `faction_members`, `faction_representatives`, or `congress_only` |

Motion data stored:
- `id`, `type`, `proposer`, `proposerFaction`, `title`, `description`
- `scope` (`color` or `world`), `minSupport`, `targets`, `parameters`
- `status` (`faction_voting`, `world_voting`, `passed`, `failed`, `expired`)
- Voting maps, timing, results

### 2. Faction Voting (Color motions)

For `scope: 'color'` motions, only members of the proposer's faction can vote. Voting period is 24 hours.

- Each faction member votes `for`, `against`, or `abstain`
- Support percentage = `for / total`
- If `supportPercentage >= minSupport`, motion passes → implemented immediately
- Otherwise, motion fails

### 3. World Voting (World motions)

For `scope: 'world'` motions, after faction voting passes, the motion moves to world voting (48 hours).

- Each Congress faction casts a weighted vote based on their seat count
- Support percentage = `supportSeats / totalSeats`
- If `supportPercentage >= minSupport`, motion passes → implemented
- Otherwise, motion fails

### 4. Implementation (`implementMotion`)

When a motion passes, World Forum delegates all effect application to the Motion System:

```js
window.motionSystem.applyMotion(motion);
```

World Forum also mirrors the effect in its own `activeEffects` map for UI/history tracking, with `endTime` calculated from `motion.parameters.duration` via `motionSystem.parseDurationDays()`.

### 5. Completion (`completeMotion`)

Moves the motion from `activeMotions` to `motionHistory` and emits `motion_completed`.

## Motion Duration

Proposers select duration via `motion.parameters.duration`. All duration parsing is delegated to `motionSystem.parseDurationDays()`:

| Value | Days | Behavior |
|-------|------|----------|
| `30 days` | 30 | Expires after 30 days |
| `60 days` | 60 | Expires after 60 days |
| `90 days` | 90 | Expires after 90 days |
| `1 year` | 365 | Expires after 1 year |
| `Until Canceled` / `Permanent` | `null` | Never expires |

Default: **30 days** if not specified.

## Motion Revocation

Permanent or long-duration motions can be revoked via `motionSystem.revokeMotion(motionId, cancelSupport)`:

- **Not found:** returns `{ allowed: false, reason: 'Motion not found' }`
- **Amnesty motions:** must be active at least **30 days** before cancellation
- **Vote threshold:** `cancelSupport` must be >= `originalMinSupport` (the `minSupport` at proposal time)
- **Success:** removes effect, emits `motion_revoked`

## Sanctions

Sanctions (World Forum only) block specific actions on a target nation/faction:

| Blocked Action | Description |
|---------------|-------------|
| `attack` | Cannot declare war or execute attacks |
| `aid` | Cannot send financial aid |
| `diplomacy` | Cannot propose or accept treaties |
| `color_interaction` | Cannot engage in color/faction interaction |

Other systems (war, diplomacy, aid) call `motionSystem.canPerformAction(actorKey, targetKey, action)` to enforce sanctions.

## Event Emissions

| Event | When |
|-------|------|
| `motion_proposed` | New motion proposed |
| `vote_cast` | Player votes on a motion |
| `world_voting_started` | Motion moves to world voting |
| `motion_implemented` | Motion passes and effects applied |
| `motion_completed` | Motion moved to history |
| `motion_effect_expired` | Motion effect duration ended |
| `congressional_election_started` | New election begins |
| `congressional_vote_cast` | Vote in congressional election |
| `congressional_election_completed` | Election finalized |
| `color_name_vote_started` | Color name vote begins |
| `color_name_vote_cast` | Vote on color name |
| `color_name_changed` | Color name finalized |
| `congress_updated` | Congress seats recalculated |
| `world_calendar_changed` | Calendar settings changed |
| `world_name_changed` | World name changed |

All emissions are guarded by the `emit()` helper (checks `EventBus` exists).

## API Reference

### `proposeMotion(proposerId, motionType, motionData)`
Propose a new motion. Returns `motionId`.

### `canPlayerProposeMotion(player, motionType)`
Check if a player can propose a specific motion type. Returns `boolean`.

### `isPlayerRepresentative(player)`
Check if a player is a Congress representative. Returns `boolean`.

### `voteOnMotion(motionId, playerId, vote, justification)`
Vote on an active motion (`for`, `against`, `abstain`).

### `getMotionTemplates(playerId)`
Get all motion templates the player can propose, delegated from motion-system.js.

### `getMotionTypeInfo(motionType)`
Get a single motion template's info from motion-system.js.

### `getActiveMotions()`
Get all active (non-completed) motions.

### `getMotionHistory(limit = 50)`
Get completed motion history.

### `getCongressInfo()`
Get Congress stats: total seats, faction seats, representatives, active motions, motion types.

### `getActiveEffects(factionKey = null)`
Get active motion effects, optionally filtered by faction.

### `getVotingSummary(playerId)`
Get UI voting summary: player permissions, active motions, elections, color name votes.

### `serialize()` / `deserialize(data)`
Save/load system state.

## Related Systems

- **Motion System** (`systems/motion-system.js`) — Truth source for all motion types, effects, sanctions, and duration parsing. World Forum delegates all effect application here.
- **Forum System** (`systems/forum-system.js`) — General discussion forum (separate from World Forum governance).
- **Diplomacy System** (`systems/diplomacy-system.js`) — Checks sanctions before allowing treaties/aid.
- **War System** (`systems/war-systems.js`) — Checks sanctions before allowing attacks/missiles/nukes.
