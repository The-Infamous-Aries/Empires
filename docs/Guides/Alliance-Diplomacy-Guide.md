# Alliance & Diplomacy Guide

Everything you need to know about alliances, diplomacy, AI-led Hive Mind alliances, and running your own government. From creating your first alliance to managing complex treaties and AI-led empires.

---

## Table of Contents

1. [What Is an Alliance?](#what-is-an-alliance)
2. [Creating an Alliance](#creating-an-alliance)
3. [Government Types](#government-types)
4. [Roles & Permissions](#roles--permissions)
5. [Managing Members](#managing-members)
6. [Alliance XP & Skills](#alliance-xp--skills)
7. [Voting & Leadership Changes](#voting--leadership-changes)
8. [Honor Tribe Challenges](#honor-tribe-challenges)
9. [Hive Mind AI Alliances](#hive-mind-ai-alliances)
10. [Custom Alliances](#custom-alliances)
11. [Diplomacy & Treaties](#diplomacy--treaties)
12. [Alliance War Coordination](#alliance-war-coordination)
13. [Financial Breakdowns](#financial-breakdowns)
14. [Leaderboards](#leaderboards)
15. [Tips & Tricks](#tips--tricks)
16. [Common Questions](#common-questions)

---

## What Is an Alliance?

An alliance is a player-formed group of nations that work together under a shared government. Alliances provide:

- **Shared government structure** — Define who leads and what they can do
- **Alliance XP & skills** — Level up to unlock bonuses for all members
- **Treasury** — Shared funds for alliance activities
- **Diplomacy** — Sign treaties with other alliances
- **War coordination** — Fight together in coordinated wars
- **Leaderboards** — See how your members rank against each other

All nations in an alliance share a government, but each keeps their own nation stats, money, and military.

---

## Creating an Alliance

### Requirements

To create an alliance, a nation must:

1. **Not already be in an alliance**
2. **Meet one of these conditions:**
   - Build the **Alliance Headquarters wonder**, OR
   - Satisfy **Easter Egg diplomatic conditions** (have a best friend with mutual pacts to 5+ allied nations)

### Easter Egg Path

The Easter Egg path creates a **Fellowship** alliance where all founding members become **Founding Fellows** with equal control (`all` permissions). This is the fastest way to start an alliance without building a wonder.

### Creation Flow

```javascript
// Create a democratic alliance
const alliance = AllianceSystem.createAlliance('nation_123', {
    name: 'The Iron Pact',
    description: 'A military-focused alliance',
    governmentType: 'democratic'
});
```

The founder automatically gets the default leadership role for the chosen government (e.g., `president` for democratic, `grandChief` for Honor Tribe).

---

## Government Types

Choose your alliance's government carefully — it determines who leads, what they can do, and how leadership changes.

| Government | Leader Role | Members | Special Behavior |
|------------|-------------|---------|-----------------|
| **Democratic** | President | All members | President + VP + Secretaries; voting enabled |
| **Triumvirate** | 3 Triumvirs | All members | Three equal leaders share power |
| **Autocratic** | Supreme Leader | All members | One ruler with appointed ministers |
| **Custom** | User-defined | All members | Fully customizable roles & permissions |
| **Fellowship** | Founding Fellows | All members | Easter egg; all founders have `all` perms |
| **Oligarchy** | Penta of Prosperity | All members | Top 5 by net revenue rule every 30 days |
| **Military Junta** | Penta of Pain | All members | Top 5 by military strength rule every 30 days |
| **Theocracy** | High Priest | All members | One divine leader; religion forced to match |
| **Republic** | Citizen (all equal) | All members | No leaders; everything requires vote |
| **Hive Mind** | AI Entity | Servants only | AI runs everything; humans have no control |
| **Honor Tribe** | Grand Chief | Tribespeople | 1v1 challenge wars for leadership |

### Role Permissions

| Permission | What It Allows |
|------------|----------------|
| `all` | Full permissions — bypasses all checks |
| `startVote` | Initiate alliance votes |
| `members` | Kick, invite, manage members |
| `military` / `war` | Declare war, military actions |
| `diplomacy` / `treaties` | Propose and manage treaties |
| `resources` / `trade` | View and manage resources/trade |
| `economy` | View member financial breakdowns |
| `moderate` | Moderation actions |
| `disputes` / `rules` | Dispute resolution and rule enforcement |
| `research` / `intelligence` | Research and spy actions |
| `basic` | Basic member actions only |

---

## Managing Members

### Adding Members

Use `alliance.addMember(nationId, memberType)` to add a nation. The member gets the default role for their type:

- `founder` → Government's founder role (president, grandChief, etc.)
- `coFounder` → Vice President, Second Triumvir, etc.
- `foundingMember` → Secretary, Lieutenant, Officer, etc.
- `member` → Base member role (citizen, servant, member, etc.)

### Removing Members

| Method | Reason | Use Case |
|--------|--------|----------|
| `leaveAlliance()` | `left` | Member voluntarily leaves |
| `kickMember()` | `kicked` | Leadership removes a member |
| `exileMember()` | `exiled` | Admin/leadership exile (Honor Tribe loser) |

**Important:** If the last member leaves a non-Hive-Mind alliance, the alliance **automatically disbands**. Hive Mind alliances persist because the AI runs them.

### The Only-Member Exception

If an alliance has only one member, that member can always leave — even if they're the only one with `all` permissions. The alliance will then disband automatically.

---

## Alliance XP & Skills

### Earning XP

| Source | Base XP | Description |
|--------|---------|-------------|
| Treaty Fulfillment | 500 | Honoring treaty obligations |
| Collective Warfare | 200 | Fighting together (33%+ participation) |
| Member Retention | 50 | Daily bonus per active member |
| Diplomatic Success | 300 | Successful negotiations |
| Shared Victory | 1000 | Winning wars together |
| Territorial Gain | 400 | Expanding alliance territory |
| Alliance Projects | 800 | Completing alliance-wide projects |

### Leveling Up

- Each level costs more XP (formula: `1000 × 1.15^(level-1)`)
- Maximum level: 100
- **3 skill points per level**

### Alliance Skills (10 skills, 10 levels each)

| Skill | What It Does | Best For |
|-------|-------------|----------|
| **Roster Capacity** | `+2` member limit per level | Growing your alliance |
| **Offensive Combat** | `+2%` attack per level | Aggressive alliances |
| **Defensive Combat** | `+2%` defense per level | Defensive alliances |
| **Marksmanship** | `+1.5%` aim per level | Precision combat |
| **Fortune** | `+1.5%` luck per level | Random event bonuses |
| **Critical Strike** | `+2%` crit damage per level | Burst damage |
| **Critical Eye** | `+1%` crit chance per level | Consistent crits |
| **Diplomatic Relations** | `+5%` treaty success per level | Diplomacy-focused |
| **Territorial Expansion** | `-2%` infra/land cost per level | Expansion |
| **Upkeep Reduction** | `-2%` infra/land upkeep per level | Economy |
| **Technology Research** | `-2%` tech cost per level | Tech-focused |
| **Alliance Unity** | Happiness `+1`, crime/disease `-2%` per level | Large alliances |
| **Intelligence Network** | `+4%` spy efficiency per level | Espionage |

**Tip:** Spend skill points early on **Roster** if you plan to recruit many members. **Unity** is excellent for large alliances (happiness + crime/disease reduction).

---

## Voting & Leadership Changes

### Starting a Vote

Available in **Democratic, Triumvirate, and Republic** governments. The initiator must have `startVote` permission.

- Vote duration: 3 days
- Quorum: 50% of members must vote
- Majority: 60% yes votes needed
- Vote types: `elect`, `remove`, `changeGovernment`

### Electing a Leader

If an `elect` vote passes, the target is assigned to the first available unique leadership role.

### Coups

Available in **Democratic, Triumvirate, Autocratic** governments (not Republic, Hive Mind, Theocracy, Honor Tribe).

- Requires at least 2 supporters besides the coup leader
- Leader must be in alliance 7+ days
- Success chance depends on government type, roles, unity skill, and member count
- On success: coup leader takes top role, supporters get elevated roles
- On failure: conspirators lose 50% XP and are demoted

---

## Honor Tribe Challenges

### How It Works

Honor Tribe alliances have one **Grand Chief** with full permissions. Leadership changes only through **1v1 solo nation wars** — no coups, no votes.

### Issuing a Challenge

1. Any non-chief member who has been in the tribe 7+ days can challenge
2. Only one challenge can be pending at a time
3. The challenge expires after 24 hours
4. The war is a 1v1 duel — no outside interference, no alliance XP

### Challenge Resolution

| Outcome | Result |
|---------|--------|
| Challenger wins | Challenger becomes Grand Chief; former chief is exiled |
| Chief wins | Chief keeps leadership; challenger is exiled |

The loser is always kicked from the alliance. If the Grand Chief loses, leadership transfers first, then they're exiled.

**Tip:** Only challenge when you're confident you can win — losing means exile from your alliance!

---

## Hive Mind AI Alliances

### What Is a Hive Mind?

A Hive Mind alliance is led entirely by an AI entity (`HiveMindAI`). No real user nation holds leadership. All human members are **Servants** with `basic` permissions only — they cannot make any decisions.

### What the AI Does

| Domain | AI Actions |
|--------|-----------|
| **Treaties** | Propose and accept treaties with other alliances |
| **War** | Declare war on outside nations |
| **Membership** | Kick inactive/underperforming members |
| **Treasury** | Withdraw surplus and distribute to members |
| **Settings** | Toggle recruitment, update description |
| **Skills** | Spend alliance skill points autonomously |
| **Applications** | Accept/reject join applications based on personality |
| **Invitations** | Send recruitment invitations |
| **Roles** | Assign Servant role to all members |

### AI Personality

Each Hive Mind AI has a **randomly generated name** (1,000,000 combinations from 3 sets of 100 parts) and a **personality** that evolves over time:

- **Weights:** Economic, Military, Diplomatic (sum to 1.0)
- **Risk:** Aggression level (0-1)
- **Traits:** Expansionist, Militaristic, Diplomatic, Economic, Isolationist

A militaristic AI might start war-focused but become diplomatic over time if its diplomatic actions succeed. The AI learns from every decision.

### AI Persistence

Hive Mind AI state (name, personality, memory, decision history) is saved with the alliance and restored on server restart. The AI is just like a real player — it never goes away.

---

## Custom Alliances

Custom alliances let you build your own government from scratch.

### Customization Options

| Setting | Description |
|---------|-------------|
| Role names | Rename any role (e.g., "Emperor", "Warchief", "Councilor") |
| Role permissions | Assign any permission set to any role |
| Council size | How many members on the council |
| Rotation days | How often council rotates (Oligarchy/Junta style) |
| Rotation stat | What stat to rank by (money, militaryStrength, etc.) |
| Leadership change method | `vote`, `challenge`, `rotation`, or `succession` |

### Methods

- `updateCustomGovernment(allianceId, updates)` — Change roles and settings
- `addCustomRole(allianceId, roleData)` — Add a new role
- `removeCustomRole(allianceId, roleId)` — Remove a role (blocked if it has members)

**Tip:** Start with a small set of roles and add more as your alliance grows. Don't make too many unique roles early on.

---

## Diplomacy & Treaties

### Treaty Types

| Treaty | Description |
|--------|-------------|
| Peace | Non-aggression agreement |
| Protectorate | Stronger alliance protects weaker one |
| Mutual Defense | Come to each other's aid in war |
| Mutual Aggression | Coordinate attacks on third parties |
| Intelligence | Share intel and spy info |

### Treaty Rules

- Alliance members cannot sign Mutual Defense or Mutual Aggression with each other (they're already allies)
- Diplomatic Relations skill improves treaty success chance and duration
- The AI in Hive Mind alliances handles all treaty decisions autonomously

---

## Alliance War Coordination

### Participating in Wars

Alliance members can join wars together. When 33%+ of members participate, the alliance earns **Collective Warfare XP**.

### War Bonuses

Alliance skills provide combat bonuses to all members:
- Combat Offensive: Attack boost
- Combat Defensive: Defense boost
- Marksmanship: Aim boost
- Critical Strike/Eye: Critical damage/chance

### Hive Mind Wars

Hive Mind AI can declare war on outside nations autonomously. These wars are purely AI-directed — human members cannot participate in the decision.

---

## Financial Breakdowns

Members with `economy`, `resources`, `trade`, or `all` permission can view another member's full financial breakdown:

- Money, tax rate, taxable income, tax revenue
- GDP, budget (income/expenses/balance), debt
- Military budget, building upkeep, upkeep total
- **Net revenue** (tax revenue − military budget − upkeep)
- Resource generation, military strength, last active

This is useful for oligarchies to see who's contributing most, or for any alliance to check member activity.

---

## Leaderboards

View member rankings for any stat:

| Metric | Description |
|--------|-------------|
| Money | Current cash |
| Tax Revenue | Tax collected |
| Net Revenue | After upkeep and military costs |
| Military Strength | Military power |
| GDP | Gross domestic product |
| Population | Nation population |
| Tech | Technology level |
| Happiness | Citizen happiness |
| Stability | Nation stability |

Snapshots update daily. Use this to identify top contributors, spot inactive members, or decide who should lead in Oligarchy/Junta rotations.

---

## Tips & Tricks

### For New Alliances

1. **Start small** — Don't recruit too many members early. Keep it to 3-5 trusted nations.
2. **Roster first** — Spend your first skill points on Roster Capacity to increase your member limit.
3. **Choose your government wisely** — Republics are egalitarian but slow (everything needs a vote). Autocracies are fast but one person controls everything.
4. **Use Easter Eggs** — If you have the diplomatic connections, Fellowship alliances let you start with multiple equal leaders immediately.

### For Growing Alliances

5. **Use Unity skill** — Large alliances benefit from happiness boosts and crime/disease reduction.
6. **Set rotation stats** — In Oligarchy/Junta, the rotation stat determines who leads. Choose money for economic focus, military strength for war focus.
7. **Monitor leaderboards** — Check who's contributing most and who's gone inactive.
8. **Custom roles** — Create specialized roles (Treasurer, War Minister, Diplomat) instead of giving everyone `all` permissions.

### For Honor Tribe Alliances

9. **Only challenge when ready** — Losing means exile. Check military strength before challenging.
10. **7-day cooldown** — You can't challenge immediately after joining. Plan ahead.
11. **One challenge at a time** — Only one pending challenge per tribe. Time it carefully.

### For Hive Mind Alliances

12. **You have no control** — Accept that the AI makes all decisions. Don't try to influence it.
13. **Personality evolves** — A militaristic AI can become diplomatic over time based on outcomes.
14. **Servants are equal** — All human members have the same `basic` permissions. No one is special.

### General

15. **Watch your treasury** — Hive Mind AI may withdraw surplus and distribute it to members.
16. **Check diplomatic stance** — Neutral, Aggressive, Defensive, or Isolationist affects how your alliance interacts.
17. **Alliances auto-disband** — If all members leave a non-Hive-Mind alliance, it's gone forever.

---

## Common Questions

**Q: Can I change my alliance's government type?**
A: In a Republic, you can vote to `changeGovernment`. In other types, you cannot change it after creation.

**Q: What happens if the founder leaves?**
A: If the founder is the only `all`-permission holder, they cannot leave unless another member already has `all` permissions. Otherwise, the alliance would be leaderless.

**Q: Can I be in multiple alliances?**
A: No. A nation can only belong to one alliance at a time.

**Q: How do I join an alliance?**
A: Either be invited, apply (if recruitment is open), or be added by a member with `members` permission.

**Q: Can Hive Mind alliances be disbanded?**
A: Not by member departure — the AI keeps them running. They persist until the server deletes them or the AI is removed.

**Q: What happens to treaties when an alliance disbands?**
A: Treaties are typically voided when an alliance disbands. Check with your diplomacy system for specifics.

---

## Quick Reference

| Action | Command/Method | Permission Needed |
|--------|---------------|-------------------|
| Create alliance | `AllianceSystem.createAlliance()` | Wonder or Easter Egg |
| Add member | `alliance.addMember(id, type)` | `members` |
| Kick member | `alliance.kickMember(id)` | `members` |
| Leave alliance | `alliance.leaveAlliance(id)` | None (self) |
| Assign role | `alliance.assignRole(id, roleId)` | `all` |
| Start vote | `AllianceSystem.startVote()` | `startVote` |
| Challenge chief | `AllianceSystem.challengeLeadership(id)` | Honor Tribe member |
| View finances | `AllianceSystem.getMemberFinancialBreakdown()` | `economy`/`resources`/`trade`/`all` |
| Upgrade skill | `alliance.upgradeSkill(key, levels)` | `all` + skill points |

Good luck building your alliance! Remember: a strong alliance is built on trust, clear roles, and shared goals.