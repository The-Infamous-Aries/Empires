# Alliance Entity

Represents an individual alliance with members, government structure, skills, progression, treasury, treaties, and war coordination. Each alliance is an instance of the `Alliance` class and is managed by the `AllianceSystem`.

## Overview

| Item | Value |
|------|-------|
| **Class:** | `Alliance` |
| **Constructor:** | `new Alliance(allianceId, founderId, allianceData?)` |
| **Managed by:** | `window.AllianceSystem` |
| **Entity file:** | `entities/Alliance.js` |

An alliance is more than just a group of nations — it has its own government, level, skills, treasury, statistics, and diplomatic relationships. Members can hold different roles with different permissions, and the alliance can grow in level to unlock skill points for upgrades.

---

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `allianceId` | string | Unique alliance identifier |
| `founderId` | string | Nation ID of the founder |
| `allianceData` | object | Optional: `{ name, acronym, description, governmentType }` |

## Instance Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Alliance ID |
| `name` | string | Alliance name |
| `acronym` | string | Alliance acronym |
| `description` | string | Alliance description |
| `founded` | number | Timestamp of creation |
| `foundedDay` | number | Game day of creation |

### Government Structure

| Property | Type | Description |
|----------|------|-------------|
| `governmentType` | string | Type: `democratic`, `trio`, `autocratic`, `custom`, `fellowship`, `hiveMind`, `honorTribe`, `oligarchy`, `militaryJunta`, `theocracy`, `republic` |
| `government.structure` | object | Deep-cloned template configuration |
| `government.roles` | Map | roleId → `{ members, permissions, requirements, maxCount }` |
| `government.customRoles` | array | User-defined roles for custom government |
| `government.founder` | string | Founder nation ID |
| `government.currentLeaders` | Map | roleId → nationId (unique roles only) |

### Members

| Property | Type | Description |
|----------|------|-------------|
| `members` | Map | nationId → `{ nationId, joinDate, memberType, role, contributions, permissions }` |
| `memberHistory` | array | Log of joins, leaves, kicks, exiles |
| `memberLimit` | number | Base: 6, upgradeable via Roster skill |
| `invitations` | Map | Pending invitations |

### Skills & Progression

| Property | Type | Description |
|----------|------|-------------|
| `level` | number | Alliance level (1-100) |
| `experience` | number | Current XP |
| `totalExperience` | number | Lifetime XP |
| `experienceToNext` | number | XP needed for next level |
| `skillPoints` | number | Unspent skill points (3 per level) |
| `skills` | object | All 10 alliance skills at level 0 |

### Customization

| Property | Type | Description |
|----------|------|-------------|
| `customization.banner` | object | `{ url, enabled }` |
| `customization.flag` | object | `{ design, colors, enabled }` |
| `customization.nameStyle` | object | `{ font, color, outlineColor, enabled }` |
| `customization.memberLevelsStyle` | object | `{ font, color, enabled }` |
| `customization.emblem` | object | `{ design, enabled }` |
| `customization.theme` | object | `{ palette, enabled }` |

### Diplomacy & Relations

| Property | Type | Description |
|----------|------|-------------|
| `treaties` | array | Alliance-wide treaties |
| `relations` | Map | allianceId → relationship data |
| `diplomaticStance` | string | `neutral`, `aggressive`, `defensive`, `isolationist` |

### War & Military

| Property | Type | Description |
|----------|------|-------------|
| `warParticipation` | Map | warId → participation data |
| `militaryCoordination` | object | `{ activeOperations, coordinatedAttacks, defensePacts }` |

### Statistics

| Property | Type | Description |
|----------|------|-------------|
| `statistics.warsWon` | number | Wars won |
| `statistics.warsLost` | number | Wars lost |
| `statistics.treatiesSigned` | number | Treaties signed |
| `statistics.territoryGained` | number | Territory gained |
| `statistics.totalDamageDealt` | number | Total damage dealt |
| `statistics.membersRecruited` | number | Members recruited |
| `statistics.projectsCompleted` | number | Projects completed |

### Member Stats (Leaderboards)

| Property | Type | Description |
|----------|------|-------------|
| `memberStats` | Map | nationId → snapshot of money, taxRevenue, militaryStrength, religion, etc. |

---

## Methods

### Government Setup

#### `setupGovernment(templateName)`

Sets up the government structure from a template. Deep-clones the template to avoid mutating shared templates. Custom alliances always get at least a base `member` role.

```javascript
alliance.setupGovernment('democratic');
alliance.setupGovernment('custom');
alliance.setupGovernment('honorTribe');
```

### Member Management

#### `addMember(nationId, memberType = 'member')`

Adds a nation to the alliance with the default role for the member type. Member types: `founder`, `coFounder`, `foundingMember`, `foundingFellow`, `member`.

In a Theocracy, new members are forced to adopt the High Priest's religion.

```javascript
alliance.addMember('nation_123', 'founder');
alliance.addMember('nation_456', 'member');
```

#### `removeMember(nationId, reason = 'left')`

Removes a nation from the alliance. Clears their roles, `allianceId`, logs the action, and emits `alliance_member_removed`.

**Guard:** If removing the only `all`-permission holder and there are other members, throws an error to prevent a leaderless alliance. Exception: if this is the last member, removal is allowed (alliance will auto-disband).

```javascript
alliance.removeMember('nation_456', 'kicked');
```

#### `kickMember(nationId)`

Convenience wrapper: `removeMember(nationId, 'kicked')`.

#### `leaveAlliance(nationId)`

Convenience wrapper: `removeMember(nationId, 'left')`.

#### `exileMember(nationId)`

Convenience wrapper: `removeMember(nationId, 'exiled')`.

### Role Assignment

#### `assignRole(nationId, roleId)`

Assigns a role to a member. Checks max capacity, removes from previous role, updates permissions. Only tracks unique roles in `currentLeaders`.

```javascript
alliance.assignRole('nation_456', 'grandChief');
```

#### `getRolePermissions(roleId)`

Returns the permissions array for a role, or `['basic']` if not found.

#### `hasPermission(nationId, permission)`

Checks if a member has a specific permission. Returns `true` if the member has `all` or the specific permission.

### Experience & Skills

#### `addExperience(amount, source = '', details = {})`

Adds XP and checks for level-ups. Each level grants 3 skill points.

#### `upgradeSkill(skillKey, levels = 1)`

Spends skill points to upgrade an alliance skill. Checks level limits and cost.

### Leaderboards

#### `updateMemberStats()`

Snapshots all members' current stats (called daily by AllianceSystem).

#### `getLeaderboard(metric, descending = true, limit = null)`

Returns ranked array for metrics: `money`, `taxRevenue`, `netRevenue`, `militaryStrength`, `gdp`, `population`, `tech`, `happiness`, `stability`.

#### `getMemberRank(nationId, metric, descending = true)`

Returns 1-based rank position for a member in a metric.

#### `getMemberStats(nationId)`

Returns a single member's stat snapshot.

### Activity

#### `getActiveMemberCount()`

Returns count of members active within the last 7 days.

#### `isNationActive(nation)`

Checks if a nation's `lastActive` is within 7 days.

### Daily Processing

#### `processDailyEffects()`

Applies skill bonuses, unity bonuses, and updates member activity tracking.

#### `applyMemberBonuses()`

Applies all alliance skill bonuses to every member nation.

#### `applyUnityBonuses()`

Applies happiness, crime reduction, and disease reduction from the Unity skill.

### Utility

#### `getNation(nationId)`

Retrieves a nation object from `window.Nation` or `window.DataManager.currentPlayer.nations`.

#### `serialize()`

Returns a plain object for saving to `world.json`. All Maps are converted to arrays of entries.

#### `static deserialize(data)`

Restores an Alliance from saved data. Calls `setupGovernment()` first to ensure roles exist, then overrides with saved state.

---

## Member Data Structure

Each member in the `members` Map stores:

```javascript
{
    nationId: "nation_123",
    joinDate: 1729958400000,
    memberType: "founder", // founder, coFounder, foundingMember, member
    role: "president",     // Current role ID
    contributions: {
        xp: 0,
        resources: 0,
        wars: 0,
        diplomacy: 0
    },
    permissions: ["all", "startVote"], // From role
    lastActiveWithinWeek: true
}
```

## Role Permission Reference

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

## Serialization Format

```json
{
    "id": "alliance_abc",
    "name": "My Alliance",
    "acronym": "MYA",
    "description": "A great alliance",
    "founded": 1729958400000,
    "foundedDay": 42,
    "governmentType": "democratic",
    "government": {
        "structure": { ... },
        "roles": [["president", { "members": ["nation_1"], "permissions": ["all"], ... }], ...],
        "customRoles": [],
        "founder": "nation_1",
        "currentLeaders": [["president", "nation_1"], ...]
    },
    "members": [["nation_1", { ... }], ["nation_2", { ... }]],
    "memberHistory": [...],
    "memberLimit": 6,
    "invitations": [],
    "level": 1,
    "experience": 0,
    "totalExperience": 0,
    "experienceToNext": 1000,
    "skillPoints": 0,
    "skills": { "roster": { "level": 0, "pointsSpent": 0, "effects": {} }, ... },
    "customization": { ... },
    "treaties": [],
    "relations": [],
    "diplomaticStance": "neutral",
    "warParticipation": [],
    "militaryCoordination": { ... },
    "statistics": { ... },
    "memberStats": [...]
}
```

## Events Emitted

| Event | Data | Description |
|-------|------|-------------|
| `alliance_member_added` | `{ allianceId, nationId, memberType }` | Member joined |
| `alliance_member_removed` | `{ allianceId, nationId, reason }` | Member left/kicked/exiled |
| `alliance_experience_gained` | `{ allianceId, amount, source, details, newLevel }` | XP awarded |
| `alliance_level_up` | `{ allianceId, newLevel, skillPointsGained }` | Alliance leveled up |
| `alliance_skill_upgraded` | `{ allianceId, skill, newLevel, cost }` | Skill upgraded |
| `alliance_skill_suggestions` | `{ allianceId, suggestions, availablePoints }` | Skill upgrade suggestions |
