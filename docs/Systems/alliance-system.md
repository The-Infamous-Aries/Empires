# Alliance System

Handles alliance creation, management, government types, member roles, XP, war integration, voting, coups, financial breakdowns, leaderboards, and special government mechanics (Honor Tribe challenges, Theocracy, Hive Mind AI, Oligarchy/Junta council rotations).

## Overview

| Item | Value |
|------|-------|
| **System class:** | `AllianceSystem` |
| **Global instance:** | `window.AllianceSystem` |
| **Primary config:** | `systems/alliance-system.js` |
| **Alliance entity:** | `entities/Alliance.js` |
| **Hive Mind AI entity:** | `entities/HiveMindAI.js` |
| **Event integration:** | `DAY_PASSED`, `war_declared`, `war_ended`, `treaty_signed`, `alliance_easter_egg_available`, `wonder_built` |

The Alliance System manages player-formed alliances, their internal governments, membership, diplomacy, warfare coordination, and progression. Alliances can have different government structures that determine how leadership, permissions, and decision-making work.

---

## Alliance Creation

### Requirements

A nation can create an alliance only if:

1. **Not already in an alliance** — `nation.allianceId` must be null
2. **Has Alliance Founding Wonder** OR **meets Easter Egg diplomatic conditions**

### Easter Egg Conditions

The Easter Egg path requires:

- Nation has a **best friend** in diplomacy
- Nation has **at least 5 friends** with mutual pacts
- The **best friend** has mutual pacts or protectorates with all 5 friends

Easter Egg alliances use the **Fellowship** government type where all founding members are Founding Fellows with equal control.

### Creation Flow

```javascript
const alliance = AllianceSystem.createAlliance(founderNationId, {
    name: "My Alliance",
    description: "Our description",
    governmentType: "democratic", // democratic, trio, autocratic, custom, fellowship, hiveMind, honorTribe
    // ... custom fields
});
```

The founder is added as the default leadership role for the chosen government type (e.g., `president` for democratic, `grandChief` for Honor Tribe).

---

## Government Templates

Eight government types are available. Each defines roles, permissions, and special behavior.

| Type | Description | Special Behavior |
|------|-------------|-----------------|
| **Democratic** | Elected leadership with specialized departments | President, VP, Secretaries |
| **Triumvirate** | Three equal leaders sharing power | Three triumvirs with `all` perms |
| **Autocratic** | Single supreme leader with appointed ministers | Supreme Leader + ministers |
| **Custom** | Fully customizable government structure | User-built roles |
| **Fellowship** | Easter-egg alliance; all founders share equal control | Founding Fellows (max 6) |
| **Oligarchy** | Wealth council rules every 30 days | Top 5 by net revenue → Penta of Prosperity |
| **Military Junta** | War council rules every 30 days | Top 5 by military strength → Penta of Pain |
| **Theocracy** | Single divine leader; religion forced to match leader | Divine intervention + unanimous no-faith vote |
| **Republic** | No leadership roles; all members equal; everything by vote | All members have `all` perms |
| **Hive Mind** | AI runs all decisions; users are Servants | AI entity controls everything |
| **Honor Tribe** | One Grand Chief until challenged via 1v1 war | Leadership changes through honor challenge wars |

### Role Permissions

| Permission | Description |
|------------|-------------|
| `all` | Full permissions (bypasses all checks) |
| `moderate` | Moderation actions |
| `military` | Military/war actions |
| `war` | War declaration/actions |
| `diplomacy` | Diplomatic actions |
| `treaties` | Treaty actions |
| `members` | Member management |
| `domestic` | Domestic affairs |
| `resources` | Resource viewing/management |
| `trade` | Trade actions |
| `economy` | Economic/financial viewing (revenue breakdowns) |
| `disputes` | Dispute resolution |
| `rules` | Rule enforcement |
| `research` | Research/technology |
| `intelligence` | Intelligence/spy actions |
| `basic` | Basic member actions |
| `startVote` | Can initiate alliance votes |

---

## Government-Specific Processing

### Oligarchy & Military Junta (Council Rotation)

Every 30 real days (from alliance creation date), the council rotates:

- **Oligarchy:** Top 5 members by **net revenue** (`taxRevenue − militaryBudget − upkeepTotal`) become `oligarch` (Penta of Prosperity)
- **Military Junta:** Top 5 members by **military strength** become `warlord` (Penta of Pain)

Remaining members are demoted to `member`. The rotation is recorded in `alliance.memberHistory` and emits `alliance_council_rotated`.

### Theocracy

- **High Priest** holds `all` permissions (unique role)
- All members' religions are forced to match the High Priest's religion daily
- **Divine Intervention:** 2–5% random chance daily that leadership changes to a random congregation member
- **Vote of No Faith:** Requires unanimous vote from all non-leader members; if unanimous, a new random leader is selected excluding the current leader
- High Priest religion changes propagate to all congregation members automatically

### Republic

- Single `citizen` role with `all` permissions (all members are equal leaders)
- Every alliance decision requires a majority vote (`requiresVoteForAll: true`)
- Coups are disabled

### Hive Mind

- No user nation leads; an AI entity (`HiveMindAI`) runs all decisions
- All human members are `Servant` with `basic` permissions only
- AI handles: treaties, war, membership kicks, treasury, settings, skills, applications, invitations, role assignment
- AI personality evolves over time (learns from decision outcomes)
- AI state persists across server restarts

### Honor Tribe

- **Grand Chief** holds `all` permissions (unique role, starts with founder)
- Leadership changes only through **1v1 solo nation wars** (honor challenges)
- Loser of a challenge war is **exiled** from the alliance
- If Grand Chief loses, leadership transfers before exile
- Coups are disabled (challenges are the only leadership change method)
- 7-day cooldown before a member can challenge; 24-hour window to complete the challenge

---

## Member Management

### Adding Members

`alliance.addMember(nationId, memberType)` — adds a nation with the default role for the member type (`founder`, `coFounder`, `foundingMember`, `foundingFellow`, or default).

### Role Assignment

`alliance.assignRole(nationId, roleId)` — assigns a role to a member. Handles both unique and non-unique roles, removes member from previous role, updates permissions.

### Resigning a Role

`AllianceSystem.resignRole(nationId)` — steps down from a leadership role to a fallback role. Prevents leaving the alliance leaderless if the resigning member is the only `all`-permission holder.

### Transferring a Role

`AllianceSystem.transferRole(fromNationId, toNationId, roleId)` — transfers a role to another member. Source steps down to a fallback role. Founding Fellow status cannot be transferred to non-founders.

---

## Alliance XP System

| Source | Base XP | Description |
|--------|---------|-------------|
| `treatyFulfillment` | 500 | Fulfilling treaty obligations |
| `collectiveWarfare` | 200 | Fighting together (33%+ participation) |
| `memberRetention` | 50 | Daily bonus per active member |
| `diplomaticSuccess` | 300 | Successful diplomatic negotiations |
| `sharedVictory` | 1000 | Winning wars together |
| `territorialGain` | 400 | Expanding alliance territory |
| `allianceProjects` | 800 | Completing alliance-wide projects |

XP is awarded via `alliance.addExperience(xpGained, description, details)`. Skill upgrades are checked daily via `alliance.checkSkillUpgrades()`.

---

## Alliance Skills

10 skills, each with 10 levels. Skills provide bonuses to all alliance members.

| Skill | Base Cost | Cost Multiplier | Max Level | Effects |
|-------|-----------|-----------------|-----------|---------|
| Roster Capacity | 1,000 | 1.5 | 10 | Member limit: `6 + (level × 2)` |
| Alliance Customization | 800 | 1.3 | 10 | Visual customization unlocks |
| Offensive Combat Training | 1,200 | 1.4 | 10 | Attack boost: `+2% per level` |
| Defensive Combat Training | 1,200 | 1.4 | 10 | Defense boost: `+2% per level` |
| Marksmanship | 1,000 | 1.35 | 10 | Aim boost: `+1.5% per level` |
| Fortune | 1,000 | 1.35 | 10 | Luck boost: `+1.5% per level` |
| Critical Strike Training | 1,400 | 1.45 | 10 | Crit damage: `+2% per level` |
| Critical Eye | 1,400 | 1.45 | 10 | Crit chance: `+1% per level` |
| Diplomatic Relations | 1,000 | 1.35 | 10 | Treaty success: `+5% per level`, duration: `+0.1 per level` |
| Territorial Expansion | 1,400 | 1.6 | 10 | Infra/land cost: `−2% per level` |
| Upkeep Reduction | 1,300 | 1.5 | 10 | Infra/land upkeep: `−2% per level` |
| Technology Research | 1,600 | 1.7 | 10 | Tech cost: `−2% per level` |
| Alliance Unity | 2,000 | 1.8 | 10 | Happiness: `+1 per level`, crime/disease: `−2% per level` |
| Intelligence Network | 1,100 | 1.45 | 10 | Spy efficiency: `+4% per level` |

Access bonuses via `AllianceSystem.getAllianceBonus(nationId, bonusType)`.

---

## Voting Mechanics

### Starting a Vote

`AllianceSystem.startVote(allianceId, voteType, targetNationId, initiatorNationId)`

- Available for: **Democratic, Triumvirate, Republic**
- Initiator must have `startVote` permission
- Vote duration: 3 days
- Quorum: 50% of members
- Majority: 60% yes votes
- Vote types: `elect`, `remove`, `changeGovernment`

### Casting a Vote

`AllianceSystem.castVote(allianceId, voteId, nationId, voteChoice)` — `'yes'`, `'no'`, or `'abstain'`.

### Resolving a Vote

`AllianceSystem.resolveVote(voteId)` — evaluates quorum and majority, executes result (e.g., elects target to an open leadership role for `elect` votes).

---

## Coup Mechanics

`AllianceSystem.attemptCoup(allianceId, coupLeaderNationId, supportingNationIds)`

- Requires at least 2 supporters besides the leader
- Leader must be in alliance for 7+ days
- Success chance based on: government type, leader/supporter roles, unity skill, member count
- **Disabled for:** Republic, Hive Mind, Theocracy, Honor Tribe
- On success: coup leader takes top role, supporters get elevated roles, previous leaders demoted
- On failure: conspirators lose 50% XP, leadership roles demoted to `member`

---

## Economic Permissions & Financial Breakdown

The `economy` permission (added to `secEconomy` and `economicMinister` roles alongside `resources`/`trade`) allows viewing a member's full financial breakdown.

`AllianceSystem.getMemberFinancialBreakdown(viewerNationId, targetNationId)`

Returns:
- money, taxRate, taxableIncome, taxRevenue, totalTaxEarned, gdp
- budget (income, expenses, balance), debt
- militaryBudget, buildingUpkeep, upkeepTotal
- netRevenue (taxRevenue − militaryBudget − upkeepTotal)
- resourceGeneration, militaryStrength, lastActive

Viewer must:
1. Be in the same alliance as the target
2. Hold `all`, `economy`, `resources`, or `trade` permission

Server-side enforcement via `allianceViewFinances` action in `server/world.js`.

---

## Leaderboards

`AllianceSystem.getAllianceLeaderboard(allianceId, metric, descending, limit)`

| Metric | Description |
|--------|-------------|
| `money` | Current cash |
| `taxRevenue` | Tax revenue |
| `netRevenue` | After upkeep, taxes, loans |
| `militaryStrength` | Military power |
| `gdp` | Gross domestic product |
| `population` | Nation population |
| `tech` | Technology level |
| `happiness` | Citizen happiness |
| `stability` | Nation stability |

Member snapshots are updated daily via `alliance.updateMemberStats()` and include role, join date, and all stats. `AllianceSystem.getAllianceMemberRank(nationId, metric)` returns 1-based rank.

---

## Hive Mind AI

No user nation leads. `HiveMindAI` entity runs all decisions autonomously.

### AI Capabilities

| Domain | Actions |
|--------|---------|
| Treaties | Propose/accept peace, protectorate, mutualDefense, mutualAggression, intelligence |
| War | Declare war on outside nations |
| Membership | Kick inactive/underperforming members |
| Treasury | Withdraw surplus (distribute to members) or deposit funds |
| Settings | Toggle open recruitment, update description |
| Skills | Spend alliance skill points autonomously |
| Applications | Accept/reject based on personality |
| Invitations | Send recruitment invitations |
| Roles | Assign Servant role to all members |

### Personality

- **Random base:** `weights: {econ, mil, diplo}` (sums to 1.0), `risk` (0-1), `learningRate`, 5 traits
- **Evolves:** Successful actions nudge weights toward that category; failed actions nudge away
- **Name:** 3 sets of 100 parts = 1,000,000 combinations (e.g., `NEXUS-PRIME-MIND`)
- **Persistence:** AI state saved in `alliance.ai` and restored on server restart

### Name Catalog

| Set | Count | Examples |
|-----|-------|----------|
| Prefixes | 100 | NEXUS, OMNI, QUANTUM, VOID, PRIME, CORE |
| Middles | 100 | PRIME, ALPHA, OMEGA, SIGMA, ULTIMATE |
| Suffixes | 100 | MIND, CORE, SYSTEM, SINGULARITY, INFINITY |

---

## Honor Tribe Challenge System

### Issuing a Challenge

`AllianceSystem.challengeLeadership(challengerId)`

- Only available in Honor Tribe alliances
- Challenger must not be the Grand Chief
- 7-day cooldown since joining
- 24-hour window to complete the challenge
- Only one pending challenge per alliance at a time

### Challenge Resolution

The 1v1 war is declared with `warType: 'honorChallenge'` (no outside interference, no alliance XP).

- **Winner:** Becomes the new Grand Chief
- **Loser:** Exiled from the alliance (allianceId set to null, removed from members)
- If Grand Chief loses: leadership transfers first, then they're exiled
- Events emitted: `alliance_honor_challenge_issued`, `alliance_honor_challenge_won`, `alliance_honor_challenge_lost`, `alliance_member_exiled`

---

## Custom Alliance Government

Fully customizable government structure for user-built alliances.

### Methods

| Method | Description |
|--------|-------------|
| `updateCustomGovernment(allianceId, updates)` | Customize role names/permissions, council settings (size, rotation days, rotation stat, role ID/name), leadership change method |
| `addCustomRole(allianceId, roleData)` | Add a new role with custom ID, name, permissions, unique/maxCount |
| `removeCustomRole(allianceId, roleId)` | Remove a role (blocked if unique role has members) |
| `getCustomRotationStat(allianceId)` | Get the configured rotation stat |

### Council Settings

| Setting | Description |
|---------|-------------|
| `councilSize` | Number of council members |
| `councilRotationDays` | Days between rotations |
| `rotationStat` | Stat to base rotation on (money, militaryStrength, taxRevenue, netRevenue, etc.) |
| `councilRoleId` | Role ID for council members |
| `councilRoleName` | Display name for council role |
| `leadershipChangeMethod` | `vote`, `challenge`, `rotation`, or `succession` |

---

## Serialization & Persistence

### `AllianceSystem.serialize()`

```json
{
    "alliances": [[id, allianceData], ...],
    "allianceInvitations": [[id, data], ...],
    "allianceDiplomacy": [[id, data], ...],
    "hiveMinds": [[id, aiData], ...]
}
```

### `AllianceSystem.deserialize(data)`

Restores alliances, invitations, diplomacy, and Hive Mind AI state. AI data is re-attached to alliances on the next daily tick.

---

## Member Access Compatibility (Map vs Plain Object)

The system uses compatibility helpers to work with both `Map` (client-side Alliance entities) and plain objects (server-side world state):

| Helper | Description |
|--------|-------------|
| `_membersGet(alliance, nationId)` | Get member data |
| `_membersSize(alliance)` | Get member count |
| `_membersKeys(alliance)` | Get member IDs |
| `_membersEntries(alliance)` | Get `[id, data]` pairs |
| `_membersForEach(alliance, cb)` | Iterate members |
| `_membersDelete(alliance, nationId)` | Remove a member |
| `_rolesGet(alliance, roleId)` | Get role data |
| `_rolesSet(alliance, roleId, data)` | Set role data |
| `_rolesDelete(alliance, roleId)` | Remove a role |
| `_rolesKeys(alliance)` | Get role IDs |
| `_rolesForEach(alliance, cb)` | Iterate roles |

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `alliance_created` | `{ alliance, founder, method }` | New alliance created |
| `alliance_xp_gained` | `{ allianceId, source, amount, description, details }` | XP awarded |
| `alliance_council_rotated` | `{ allianceId, governmentType, council, councilRole }` | Oligarchy/Junta rotation |
| `alliance_theocracy_leader_changed` | `{ allianceId, oldLeader, newLeader, reason }` | Theocracy leadership change |
| `alliance_theocracy_religion_propagated` | `{ allianceId, religion, leader }` | Religion propagated |
| `alliance_vote_started` | `{ allianceId, voteId, voteType, targetNationId, initiatorNationId, endTime }` | Vote initiated |
| `alliance_vote_cast` | `{ allianceId, voteId, nationId, voteChoice }` | Vote cast |
| `alliance_vote_resolved` | `{ allianceId, voteId, result, yesCount, noCount, abstainCount, totalVotes, quorumMet, majorityMet }` | Vote resolved |
| `alliance_coup_attempted` | `{ allianceId, coupLeader, supporters, success, roll, chance, timestamp }` | Coup attempted |
| `alliance_coup_successful` | `{ allianceId, newLeader, supporters, previousLeaderRole }` | Coup succeeded |
| `alliance_coup_failed` | `{ allianceId, coupLeader, supporters }` | Coup failed |
| `alliance_role_resigned` | `{ allianceId, nationId, previousRole, newRole }` | Role resigned |
| `alliance_role_transferred` | `{ allianceId, fromNationId, toNationId, role }` | Role transferred |
| `alliance_honor_challenge_issued` | `{ allianceId, challengerId, chiefId }` | Honor challenge issued |
| `alliance_honor_challenge_won` | `{ allianceId, newGrandChief, exiled }` | Challenger won |
| `alliance_honor_challenge_lost` | `{ allianceId, grandChief, exiled }` | Chief won |
| `alliance_member_exiled` | `{ allianceId, nationId }` | Member exiled |
| `alliance_custom_government_updated` | `{ allianceId, updates }` | Custom gov updated |
| `alliance_hive_mind_treaty` | `{ allianceId, targetAllianceId, treatyType }` | AI treaty action |
| `alliance_hive_mind_war` | `{ allianceId, attackerNationId, defenderNationId }` | AI war action |
| `alliance_hive_mind_kick` | `{ allianceId, nationId }` | AI kick action |
| `alliance_creation_unlocked` | `{ nations, method, message }` | Creation unlocked (wonder/easter egg) |

---

## Server-Side Integration

### `server/world.js` Actions

| Action | Permission | Description |
|--------|------------|-------------|
| `allianceCreate` | — | Create alliance (wonder/easter egg required) |
| `allianceRole` | `all` | Reassign roles (blocked for Republic/Hive Mind/Theocracy/Honor Tribe) |
| `allianceTransfer` | founder | Transfer leadership (blocked for special gov types) |
| `allianceReview` | `members` | Review applications (blocked for Hive Mind — AI controls) |
| `allianceWithdraw` | `resources` | Withdraw from alliance treasury |
| `allianceViewFinances` | `all`/`economy`/`resources`/`trade` | View member financial breakdown |

### Hive Mind Server Processing

During daily tick, each Hive Mind alliance's AI is deserialized, runs `tick()`, executes decisions (treaties, war, membership, treasury, settings, skills, applications, invitations, roles), and serializes back to `alliance.ai`.

---

## Key Files

| File | Purpose |
|------|---------|
| `systems/alliance-system.js` | Main alliance logic (2,700+ lines) |
| `entities/Alliance.js` | Alliance entity class |
| `entities/HiveMindAI.js` | AI entity for Hive Mind alliances |
| `docs/Entities/HiveMindAI.md` | Hive Mind AI documentation |
| `server/world.js` | Server-side alliance actions & AI processing |
| `server/rules.js` | Script loading (loads HiveMindAI.js) |
