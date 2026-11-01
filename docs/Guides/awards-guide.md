# Awards Guide — How Awards Work

Welcome to the Awards Guide! Awards are cosmetic achievements you earn by playing Dominion Wars. They give you **bragging rights** — no gameplay bonuses, just recognition for your accomplishments. This guide explains everything you need to know in plain language.

---

## Table of Contents

1. [What Are Awards?](#what-are-awards)
2. [How Do I Earn Awards?](#how-do-i-earn-awards)
3. [The "Highest Tier Only" Rule](#the-highest-tier-only-rule)
4. [The 7 Award Categories](#the-7-award-categories)
5. [Award Categories at a Glance](#award-categories-at-a-glance)
6. [How Awards Are Tracked](#how-awards-are-tracked)
7. [Viewing Your Awards](#viewing-your-awards)
8. [Tips & Strategy](#tips--strategy)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## What Are Awards?

Awards are **purely cosmetic** badges that show what your nation (and you as a player) have accomplished. They don't give you money, units, or any gameplay advantage — they're purely for showing off.

Think of them like trophies in a video game: you earn them by hitting milestones, and they stay on your profile forever.

---

## How Do I Earn Awards?

Awards are earned automatically as you play. You don't need to apply for them or claim them. The game constantly checks your stats and grants awards when you hit the required number.

### How it works:

1. **You play normally** — build your nation, fight wars, launch missiles, sign treaties, post on the forum, etc.
2. **The game tracks your stats** behind the scenes (wars won, population, money, friends, etc.)
3. **When you hit a threshold**, the award unlocks automatically
4. **You get a notification** via the `award_unlocked` event

For example:
- Win your first war → **First Victory** award
- Reach 100,000 citizens → **Baby Boom** award
- Launch 500 missiles → **Missile Devastation** award
- Maintain peace for 90 days → **Peace Champion** award

---

## The "Highest Tier Only" Rule

Many awards come in **tiers** — a ladder of progressively harder goals that all track the same thing.

### Example: Wars Won

| Award | Wars Won Needed | Tier |
|-------|----------------|------|
| First Victory | 1 | Tier 1 of 9 |
| Warrior | 10 | Tier 2 of 9 |
| Veteran | 25 | Tier 3 of 9 |
| Seasoned Warrior | 50 | Tier 4 of 9 |
| Battle-Hardened | 75 | Tier 5 of 9 |
| Warmonger | 100 | Tier 6 of 9 |
| Warlord | 250 | Tier 7 of 9 |
| Conqueror | 500 | Tier 8 of 9 |
| World Conqueror | 1000 | Tier 9 of 9 (highest) |

**Here's the important part:** You only hold the **highest tier you've unlocked** at any time.

If you win 250 wars, you hold **Warlord** (Tier 7) — not First Victory, Warrior, Veteran, Seasoned Warrior, Battle-Hardened, Warmonger, AND Warlord. The lower tiers are automatically removed when you unlock a higher one.

This keeps your award list clean and shows your current peak achievement, not every step along the way.

**Exceptions:** Some awards are **standalone** (single award, no tiers), such as:
- Mastering a skill at level 20
- Going legendary
- Forming your first alliance
- Using the "Circle of Friends" easter egg

These stay unlocked forever once earned.

---

## The 7 Award Categories

Awards are grouped into 7 categories. Here's what each covers:

| Category | What It Covers | Example Awards |
|----------|---------------|----------------|
| **Military & War** | Wars, missiles, nukes, military units, war/peace duration, espionage | World Conqueror, Missile Doomsday, Iron Dome, Spartan 300 |
| **Population & Citizen** | Population size, immigration, pollution/crime/disease/happiness | Ultimate Population, Immigrant Paragon, Eternal Peace |
| **Research & Technology** | Research %, literacy, technologies purchased | Tech Singularity, Wise Nation, Tech God |
| **Nation & Player** | Government/religion changes, maxed skills, legendary prestige, money | Policy Tyrant, Master Attacker, Multi Trillionaire |
| **Sports & Tournament** | Championships, seasons, games won, fans, drafts, injuries | God Champion, Sports Titan, Scarred for Life |
| **Forum & Messages** | Forum posts, threads, world forum motions | God Forum Legend, Emperor Kingmaker |
| **Diplomacy & Ties** | Treaties, alliances, friend count, best friend duration | Grandmaster Diplomat, Eternal Circle, World Citizen |

---

## Award Categories at a Glance

Below is a quick reference of every award, organized by category. "Tier" shows where it sits in its increment set (higher number = harder to get). Standalone awards don't have tiers.

### Military & War

**Wars Won** (track `statistics.warsWon`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Victory | 1 war | 1 of 9 |
| Warrior | 10 wars | 2 of 9 |
| Veteran | 25 wars | 3 of 9 |
| Seasoned Warrior | 50 wars | 4 of 9 |
| Battle-Hardened | 75 wars | 5 of 9 |
| Warmonger | 100 wars | 6 of 9 |
| Warlord | 250 wars | 7 of 9 |
| Conqueror | 500 wars | 8 of 9 |
| World Conqueror | 1000 wars | 9 of 9 (highest) |

**Wars Fought** (track `statistics.warsFought` — win OR lose):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Fight | 1 war | 1 of 9 |
| Combatant | 10 wars | 2 of 9 |
| Soldier | 25 wars | 3 of 9 |
| War Veteran | 50 wars | 4 of 9 |
| Battle Scarred | 75 wars | 5 of 9 |
| Warrior King | 100 wars | 6 of 9 |
| War Machine | 250 wars | 7 of 9 |
| Perpetual War | 500 wars | 8 of 9 |
| Eternal Warrior | 1000 wars | 9 of 9 (highest) |

**Missile Launches** (track `statistics.missileLaunches`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Missile | 1 | 1 of 9 |
| Missile Barrage | 25 | 2 of 9 |
| Missile Storm | 50 | 3 of 9 |
| Missile Rain | 100 | 4 of 9 |
| Missile Apocalypse | 250 | 5 of 9 |
| Missile Devastation | 500 | 6 of 9 |
| Missile Holocaust | 1000 | 7 of 9 |
| Missile Armageddon | 2500 | 8 of 9 |
| Missile Doomsday | 5000 | 9 of 9 (highest) |

**Nuke Launches** (track `statistics.nukeLaunches`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Nuke | 1 | 1 of 9 |
| Nuclear Winter | 25 | 2 of 9 |
| Nuclear Holocaust | 50 | 3 of 9 |
| Nuclear Devastation | 100 | 4 of 9 |
| Nuclear Apocalypse | 250 | 5 of 9 |
| Nuclear Armageddon | 500 | 6 of 9 |
| Nuclear Doomsday | 1000 | 7 of 9 |
| Nuclear Cataclysm | 2500 | 8 of 9 |
| Nuclear Annihilation | 5000 | 9 of 9 (highest) |

**Blocked Missiles/Nukes** (track `statistics.missilesBlocked`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Block | 1 | 1 of 8 |
| Blocker | 25 | 2 of 8 |
| Shield | 50 | 3 of 8 |
| Wall | 75 | 3 of 8 |
| Fortress | 100 | 5 of 8 |
| Bastion | 250 | 6 of 8 |
| Citadel | 500 | 7 of 8 |
| Iron Dome | 1000 | 8 of 8 (highest) |

**Special:**
| Award | Requirement | Type |
|-------|-------------|------|
| Spartan 300 | Exactly 300 soldiers for 30 days | Standalone |

**Military Units** (current count, peak type — no time requirement):
| Award | Unit Type | Threshold | Tier |
|-------|-----------|-----------|------|
| Small Army | Soldiers | 25,000 | 1 of 8 |
| Medium Army | Soldiers | 50,000 | 2 of 8 |
| Large Army | Soldiers | 100,000 | 3 of 8 |
| Massive Army | Soldiers | 250,000 | 4 of 8 |
| Horde Army | Soldiers | 500,000 | 5 of 8 |
| Legion Army | Soldiers | 1,000,000 | 6 of 8 |
| Titan Army | Soldiers | 5,000,000 | 7 of 8 |
| God Army | Soldiers | 10,000,000 | 8 of 8 (highest) |

Similar 8-tier ladders exist for Tanks, Aircraft, Ships, Spies, Missiles (stockpiled), and Nukes (stockpiled).

**War & Peace Duration** (days maintained):
| Award | Days | Tier |
|-------|------|------|
| Warmonger / Peacekeeper | 30 | 1 of 5 |
| War Veteran / Peace Advocate | 60 | 2 of 5 |
| Seasoned Warlord / Peace Champion | 90 | 3 of 5 |
| Elite Warlord / Peace Guardian | 180 | 4 of 5 |
| Grand Warlord / Peace Supreme | 365 | 5 of 5 (highest) |

**Espionage:**
| Award | Requirement | Tier |
|-------|-------------|------|
| Spymaster | 50 spy missions | 1 of 4* |
| Elite Spy | 100 spy missions | 2 of 4 |
| Grandmaster Spy | 250 spy missions | 3 of 4 |
| Emperor Spy | 500 spy missions | 4 of 4 (highest) |

\* Spymaster is tier 1; master_spy_* are tiers 2-4.

| Award | Requirement | Tier |
|-------|-------------|------|
| Invisible Hand | 250 espionage operations | 1 of 4 |
| Elite Invisible Hand | 500 ops | 2 of 4 |
| Grandmaster Invisible Hand | 1000 ops | 3 of 4 |
| Emperor Invisible Hand | 2500 ops | 4 of 4 (highest) |

---

### Population & Citizen

**Population** (track `population`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Baby Boom | 100,000 | 1 of 9 |
| Melting Pot | 500,000 | 2 of 9 |
| Citizen King | 1,000,000 | 3 of 9 |
| Global Population | 10,000,000 | 4 of 9 |
| World Population | 100,000,000 | 5 of 9 |
| Massive Population | 500,000,000 | 6 of 9 |
| Planet Population | 1 billion | 7 of 9 |
| Super Population | 10 billion | 8 of 9 |
| Ultimate Population | 100 billion | 9 of 9 (highest) |

**Immigration** (track `statistics.immigrantsAccepted`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Immigrant Nation | 5,000 | 1 of 9 |
| Immigrant Welcome | 10,000 | 2 of 9 |
| Immigrant Open | 25,000 | 3 of 9 |
| Immigrant Haven | 50,000 | 4 of 9 |
| Immigrant Refuge | 75,000 | 5 of 9 |
| Immigrant Sanctuary | 100,000 | 6 of 9 |
| Immigrant Paradise | 250,000 | 7 of 9 |
| Immigrant Utopia | 500,000 | 8 of 9 |
| Immigrant Paragon | 1,000,000 | 9 of 9 (highest) |

**Environmental** (days maintained at zero / perfect):
| Category | Awards | Days |
|----------|--------|------|
| Pollution | Clean Air → Untouched Wilderness | 30 / 60 / 90 (3 tiers) |
| Crime | Crime Free → Eternal Peace | 30 / 60 / 90 / 180 / 365 / 730 (6 tiers) |
| Disease | Disease Free → Immortal | 30 / 60 / 90 / 180 / 365 / 730 (6 tiers) |
| Happiness | Utopia Happiness → Infinite Joy | 30 / 60 / 90 / 180 / 365 / 730 (6 tiers) |

**Literacy** (track `statistics.literacyScore`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Scholar Nation | 50% | 1 of 4 |
| Literate Nation | 65% | 2 of 4 |
| Enlightened Nation | 80% | 3 of 4 |
| Wise Nation | 95% | 4 of 4 (highest) |

---

### Research & Technology

**Research Completion** (track `statistics.researchCompleted`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Atomic Age | 50% | 1 of 4 |
| Future Tech | 65% | 2 of 4 |
| Scientific Powerhouse | 80% | 3 of 4 |
| Tech Singularity | 95% | 4 of 4 (highest) |

**Literacy Rates** (same track as above — shared with Population category):
| Award | Threshold | Tier |
|-------|-----------|------|
| Scholar Nation | 50% | 1 of 4 |
| Literate Nation | 65% | 2 of 4 |
| Enlightened Nation | 80% | 3 of 4 |
| Wise Nation | 95% | 4 of 4 (highest) |

**Technologies Purchased** (track `statistics.techPurchased`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Researcher | 250 | 1 of 11 |
| Scholar | 500 | 2 of 11 |
| Academic | 750 | 3 of 11 |
| Scientist | 1,000 | 4 of 11 |
| Expert | 1,500 | 5 of 11 |
| Specialist | 2,000 | 6 of 11 |
| Authority | 2,500 | 7 of 11 |
| Master | 3,000 | 8 of 11 |
| Grandmaster | 3,500 | 9 of 11 |
| Legend | 4,500 | 10 of 11 |
| Tech God | 5,000 | 11 of 11 (highest) |

---

### Nation & Player

**Government Changes** (track `statistics.governmentChanges`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Policy Maker | 25 changes | 1 of 3 |
| Policy Architect | 50 changes | 2 of 3 |
| Policy Tyrant | 100 changes | 3 of 3 (highest) |

**Religion Changes** (track `statistics.religionChanges`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Faithful | 25 changes | 1 of 3 |
| Religious Zealot | 50 changes | 2 of 3 |
| Religious Fanatic | 100 changes | 3 of 3 (highest) |

**Uniform Population** (track `statistics.uniformPopulationDays`):
| Award | Requirement | Type |
|-------|-------------|------|
| Divine Population | 100% same-religion for 60 days | Standalone |

**Skill Maxes** (track `skills.<name>.level`, level 20 — 12 standalone awards):
| Award | Skill |
|-------|-------|
| Master Attacker | Attack |
| Master Defender | Defense |
| Master Marksman | Aim |
| Lucky Charm | Luck |
| Critical Overload | Critical Damage |
| Critical Eye | Critical Chance |
| Iron Wall | Block |
| Parry Master | Parry |
| Energized | Energy |
| Seer | Intuition |
| Taxman | Taxation |
| Master Diplomat | Diplomacy |

**Legendary Prestige** (track `totalLegendaryLevels`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Legendary | 1 | 1 of 6 |
| Five-Time Legendary | 5 | 2 of 6 |
| Ten-Time Legendary | 10 | 3 of 6 |
| Fifteen-Time Legendary | 15 | 4 of 6 |
| Twenty-Time Legendary | 20 | 5 of 6 |
| Twenty-Five-Time Legendary | 25 | 6 of 6 (highest) |

**Economy / Money** (track `money`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Millionaire | $1M | 1 of 11 |
| Cool Millionaire | $100M | 2 of 11 |
| Multi Millionaire | $500M | 3 of 11 |
| Billionaire | $1B | 4 of 11 |
| Tycoon | $10B | 5 of 11 |
| Cool Billionaire | $100B | 6 of 11 |
| Multi Billionaire | $500B | 7 of 11 |
| Trillionaire | $1T | 8 of 11 |
| Economic Superpower | $10T | 9 of 11 |
| Cool Trillionaire | $100T | 10 of 11 |
| Multi Trillionaire | $500T | 11 of 11 (highest) |

---

### Sports & Tournament

**World Championships Won** (track `statistics.worldChampionshipsWon`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Champion | 1 | 1 of 9 |
| Champion | 5 | 2 of 9 |
| Elite Champion | 10 | 3 of 9 |
| Legendary Champion | 25 | 4 of 9 |
| Grand Champion | 50 | 5 of 9 |
| Master Champion | 75 | 6 of 9 |
| Immortal Champion | 100 | 7 of 9 |
| Supreme Champion | 250 | 8 of 9 |
| God Champion | 500 | 9 of 9 (highest) |

**Season Tournaments Won** (track `statistics.seasonTournamentsWon`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Season | 1 | 1 of 9 |
| Season Winner | 5 | 2 of 9 |
| Season Master | 10 | 3 of 9 |
| Season Legend | 25 | 4 of 9 |
| Season King | 50 | 5 of 9 |
| Season Grandmaster | 75 | 6 of 9 |
| Season Emperor | 100 | 7 of 9 |
| Season Sovereign | 250 | 8 of 9 |
| Season God | 500 | 9 of 9 (highest) |

**Sports Games Won** (track `statistics.sportsGamesWon`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Win | 1 | 1 of 9 |
| Winner | 25 | 2 of 9 |
| Victor | 50 | 3 of 9 |
| Undefeated | 100 | 4 of 9 |
| Unbeatable | 250 | 5 of 9 |
| Immortal Athlete | 500 | 6 of 9 |
| God of Sport | 1,000 | 7 of 9 |
| Legend Athlete | 5,000 | 8 of 9 |
| Sports Titan | 10,000 | 9 of 9 (highest) |

**Sports Fans** (track `statistics.totalSportsFans`, peak — current fan count):
| Award | Threshold | Tier |
|-------|-----------|------|
| Fan Favorite | 5,000 | 1 of 9 |
| Popular | 10,000 | 2 of 9 |
| Well Known | 25,000 | 3 of 9 |
| Famous | 50,000 | 4 of 9 |
| Celebrity | 100,000 | 5 of 9 |
| Star | 250,000 | 6 of 9 |
| Superstar | 500,000 | 7 of 9 |
| Icon | 1,000,000 | 8 of 9 |
| Legend | 10,000,000 | 9 of 9 (highest) |

**Players Drafted** (track `statistics.playersDrafted`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Draft | 1 | 1 of 10 |
| Draft King | 25 | 2 of 10 |
| Elite Draft King | 50 | 3 of 10 |
| Grandmaster Draft King | 100 | 4 of 10 |
| Draft Architect | 250 | 5 of 10 |
| Draft Emperor | 500 | 6 of 10 |
| Draft Sovereign | 750 | 7 of 10 |
| Draft Titan | 1,000 | 8 of 10 |
| Draft God | 2,500 | 9 of 10 |
| Draft Legend | 5,000 | 10 of 10 (highest) |

**Injuries** (track `statistics.injuriesTotal`):
| Award | Threshold | Tier |
|-------|-----------|------|
| First Injury | 1 | 1 of 9 |
| Injured | 5 | 2 of 9 |
| Walking Wounded | 10 | 3 of 9 |
| Hurt | 25 | 4 of 9 |
| Battle Scarred | 50 | 5 of 9 |
| Bruised | 75 | 6 of 9 |
| Beaten Up | 100 | 7 of 9 |
| Battle Hardened | 250 | 8 of 9 |
| Scarred for Life | 500 | 9 of 9 (highest) |

---

### Forum & Messages

**Forum Posts** (track `statistics.forumPostsTotal`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Forum Legend | 25 posts | 1 of 9 |
| Elite Forum Legend | 50 posts | 2 of 9 |
| Grandmaster Forum Legend | 75 posts | 3 of 9 |
| Emperor Forum Legend | 100 posts | 4 of 9 |
| Titan Forum Legend | 150 posts | 5 of 9 |
| Overlord Forum Legend | 200 posts | 6 of 9 |
| Archon Forum Legend | 250 posts | 7 of 9 |
| Sovereign Forum Legend | 500 posts | 8 of 9 |
| God Forum Legend | 1000 posts | 9 of 9 (highest) |

**Forum Threads** (track `statistics.forumThreadsCreated`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Thread Starter | 25 threads | 1 of 9 |
| Elite Thread Starter | 50 threads | 2 of 9 |
| Grandmaster Thread Starter | 75 threads | 3 of 9 |
| Emperor Thread Starter | 100 threads | 4 of 9 |
| Titan Thread Starter | 150 threads | 5 of 9 |
| Overlord Thread Starter | 200 threads | 6 of 9 |
| Archon Thread Starter | 250 threads | 7 of 9 |
| Sovereign Thread Starter | 500 threads | 8 of 9 |
| God Thread Starter | 1000 threads | 9 of 9 (highest) |

**World Forum Motions Proposed** (track `statistics.worldForumMotionsProposed`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Statesman | 25 | 1 of 4 |
| Elite Statesman | 50 | 2 of 4 |
| Grandmaster Statesman | 75 | 3 of 4 |
| Statesman Emperor | 100 | 4 of 4 (highest) |

**World Forum Motions Passed** (track `statistics.worldForumMotionsPassed`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Kingmaker | 25 | 1 of 4 |
| Elite Kingmaker | 50 | 2 of 4 |
| Grandmaster Kingmaker | 75 | 3 of 4 |
| Emperor Kingmaker | 100 | 4 of 4 (highest) |

**World Forum Motions Voted** (track `statistics.worldForumMotionsVoted`):
| Award | Threshold | Tier |
|-------|-----------|------|
| United Nations | 100 | 1 of 4 |
| Elite United Nations | 250 | 2 of 4 |
| Grandmaster United Nations | 500 | 3 of 4 |
| Emperor United Nations | 1000 | 4 of 4 (highest) |

**Calendar Reform** (track `statistics.worldForumCalendarReforms`):
| Award | Requirement | Type |
|-------|-------------|------|
| Calendar Reformer | Pass 1 calendar reform motion | Standalone |

---

### Diplomacy & Ties

**Treaties Signed** (track `statistics.treatiesSigned`):
| Award | Threshold | Tier |
|-------|-----------|------|
| Diplomat | 25 | 1 of 3 |
| Elite Diplomat | 50 | 2 of 3 |
| Grandmaster Diplomat | 100 | 3 of 3 (highest) |

**Alliances Formed** (track `statistics.alliancesFormed`):
| Award | Requirement | Type |
|-------|-------------|------|
| Alliance Builder | Form 1 alliance | Standalone |
| Circle of Friends | Found alliance via best-friend easter egg | Standalone |

**Alliance Duration** (track `statistics.allianceDays`):
| Award | Days | Tier |
|-------|------|------|
| Alliance Partner | 180 | 1 of 4 |
| Alliance Loyal | 365 | 2 of 4 |
| Alliance Stalwart | 545 | 3 of 4 |
| Alliance Eternal | 730 | 4 of 4 (highest) |

**Friend Count** (track `statistics.friendsCount`):
| Award | Threshold | Type |
|-------|-----------|------|
| Social Butterfly | 5 friends | Standalone |

**Same 5 Friends Duration** (track `statistics.fiveFriendsDays`):
| Award | Days | Tier |
|-------|------|------|
| Steady Friends | 90 | 1 of 4 |
| Loyal Friends | 180 | 2 of 4 |
| Devoted Friends | 365 | 3 of 4 |
| Eternal Friends | 730 | 4 of 4 (highest) |

**5 Friends + 1 Best Friend** (track `statistics.fiveFriendsBestFriendDays`):
| Award | Requirement | Type |
|-------|-------------|------|
| Inner Circle | Have 5 friends + 1 best friend for 1 day | Standalone |

**Same Best Friend Duration** (track `statistics.bestFriendDays`):
| Award | Days | Tier |
|-------|------|------|
| Best Friend | 90 | 1 of 4 |
| Close Friend | 180 | 2 of 4 |
| Lifelong Friend | 365 | 3 of 4 |
| Soulmate Friend | 730 | 4 of 4 (highest) |

**Same 5 Friends + Best Friend Duration** (track `statistics.fiveFriendsBestFriendDays`):
| Award | Days | Tier |
|-------|------|------|
| Tight Circle | 90 | 1 of 4 |
| Close Circle | 180 | 2 of 4 |
| Devoted Circle | 365 | 3 of 4 |
| Eternal Circle | 730 | 4 of 4 (highest) |

**Positive Relations** (track `statistics.positiveRelationsCount`):
| Award | Threshold | Tier |
|-------|-----------|------|
| World Citizen | 15 nations | 1 of 4 |
| Global Citizen | 25 nations | 2 of 4 |
| Supreme Citizen | 50 nations | 3 of 4 |
| Ultimate Citizen | 75 nations | 4 of 4 (highest) |

---

## How Awards Are Tracked

The game tracks your stats in real time. Here's where each stat comes from:

| What You Do | Statistic Tracked | Where It's Counted |
|-------------|------------------|-------------------|
| Win a war | `warsWon` | War System |
| Join any war (win or lose) | `warsFought` | War System |
| Launch a missile | `missileLaunches` | War System / Projects |
| Launch a nuke | `nukeLaunches` | War System / Wonders |
| Block an enemy missile/nuke | `missilesBlocked` | War System |
| Gain population | `population` | Nation (live count) |
| Accept immigrants | `immigrantsAccepted` | Population System |
| Keep pollution at 0 | `zeroPollutionDays` | Nation (daily turn) |
| Keep crime at 0 | `zeroCrimeDays` | Nation (daily turn) |
| Keep disease at 0 | `zeroDiseaseDays` | Nation (daily turn) |
| Keep happiness at 100 | `perfectHappinessDays` | Nation (daily turn) |
| Research technologies | `researchCompleted` | Research System |
| Reach literacy % | `literacyScore` | Nation (synced daily) |
| Purchase technologies | `techPurchased` | Research System |
| Change government | `governmentChanges` | Nation (changeGovernment) |
| Change religion | `religionChanges` | Nation (changeReligion) |
| Accumulate money | `money` | Nation (live balance) |
| Sign treaties | `treatiesSigned` | Diplomacy System |
| Form an alliance | `alliancesFormed` | Alliance System |
| Maintain an alliance | `allianceDays` | Nation (daily turn) |
| Have positive relations | `positiveRelationsCount` | Nation (daily turn) |
| Have 5 friends | `friendsCount` | Nation (daily turn) |
| Have a best friend | `hasBestFriend` | Nation (daily turn) |
| Use friend easter egg | `easterEggAlliances` | Alliance System |
| Win world championship | `worldChampionshipsWon` | Sports System |
| Win season tournament | `seasonTournamentsWon` | Sports System |
| Win sports games | `sportsGamesWon` | Sports System |
| Gain sports fans | `totalSportsFans` | Sports System (peak) |
| Draft players | `playersDrafted` | Sports System |
| Suffer injuries | `injuriesTotal` | Sports System |
| Post forum messages | `forumPostsTotal` | Forum System |
| Create forum threads | `forumThreadsCreated` | Forum System |
| Propose world forum motions | `worldForumMotionsProposed` | Forum System |
| Pass world forum motions | `worldForumMotionsPassed` | Forum System |
| Vote on world forum motions | `worldForumMotionsVoted` | Forum System |
| Pass calendar reform | `worldForumCalendarReforms` | Forum System |
| Max out a skill (level 20) | `skills.<name>.level` | Player (skill upgrades) |
| Go legendary | `totalLegendaryLevels` | Player (goLegendary) |

---

## Viewing Your Awards

Awards are displayed on your nation profile and player profile. Only the **highest unlocked tier per increment set** is shown — you won't see all 9 "Wars Won" tiers listed at once, just the one you've reached.

Awards are saved with your game and persist across sessions via `serialize()` / `deserialize()`.

---

## Tips & Strategy

1. **Focus on one increment set at a time.** Since only the highest tier shows, there's no benefit to collecting lower tiers — they're automatically replaced.

2. **Peak awards can fluctuate.** Awards like `money`, `population`, and military unit counts track your *current* value. If your money drops below $1M, you still keep the Millionaire award (awards are never removed for falling below peak), but you won't unlock Cool Millionaire until you're back at $100M.

3. **Daily-turn awards need consistency.** Pollution, crime, disease, happiness, war/peace, and alliance duration awards are checked every game day. Missing one day resets the counter to 0.

4. **Counter awards only go up.** Wars won, missiles launched, immigrants accepted, etc. are cumulative — once you hit the threshold, you keep that tier (until a higher tier replaces it).

5. **The easter egg alliance is a one-time award.** If you form an alliance using the "best friend + 5 friends with mutual pacts" easter egg, you get the "Circle of Friends" award immediately — it's standalone and never expires.

---

## Frequently Asked Questions

**Q: Do awards give gameplay bonuses?**
A: No. Awards are purely cosmetic — bragging rights only.

**Q: Can I lose an award?**
A: Generally no. Once unlocked, an award stays. The only exception is tier replacement: unlocking a higher tier removes the lower tier from the same increment set.

**Q: Why don't I see all my war awards at once?**
A: Only the highest tier per increment set is displayed. If you've won 250 wars, you see "Warlord" — not all 9 war awards.

**Q: Are awards saved when I reload?**
A: Yes. Awards are serialized and restored on load.

**Q: How do I check my progress toward an award?**
A: Your stats are tracked live. Watch the relevant statistic (wars won, population, money, etc.) and compare it to the award thresholds listed in this guide.

**Q: What's the difference between counter and peak awards?**
A: Counter awards track lifetime totals that only increase (wars won, missiles launched). Peak awards track current live values that can go up and down (population, money, unit counts). Both stay unlocked once earned.

**Q: Are awards shown on leaderboards?**
A: No. Leaderboards are handled by a separate ranking system (`server/rankings.js`). Awards are personal achievements, not competitive rankings.

---

## Need More Help?

- **Full technical reference:** See `docs/Entities/AwardSystem.md` — the entity documentation with all methods, statistics wiring, and integration points.
- **Award icons:** See `docs/DEV/award-icons.md` — the icon theme guide with all award IDs, thresholds, and image filenames.
