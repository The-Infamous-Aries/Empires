# Sovereignty Epochs — Build Your Empire. Rule the World.

**Sovereignty Epochs** is a living nation simulation where you are the supreme leader of your own country. Every choice you make — from the taxes your citizens pay to the missiles in your silos, from the wrestlers in your promotion to the laws you vote on in the World Forum — echoes across the globe. Every action saves the moment you make it. Nothing is ever lost.

Whether you want to be a peaceful trader building an economic superpower, a warmongering conqueror carving out an empire, a diplomatic mastermind weaving alliances and treaties, or a sports dynasty owner hoisting championship trophies — your choices write the history of your nation.

---

## Table of Contents

- [Your Nation — The Heart of the Game](#your-nation--the-heart-of-the-game)
- [🏗️ Build Your Nation](#-build-your-nation)
- [👥 Manage Your Citizens](#-manage-your-citizens)
- [⚔️ War & Military](#-war--military)
- [🤝 Diplomacy & Alliances](#-diplomacy--alliances)
- [📦 Resources](#-resources)
- [🏛️ Edicts](#-edicts)
- [💰 Economy & World Bank](#-economy--world-bank)
- [🎯 Government & Religion](#-government--religion)
- [🔬 Research & Technology](#-research--technology)
- [🏈 Sports Leagues](#-sports-leagues)
- [🤼 Wrestling Promotions](#-wrestling-promotions)
- [🗳️ World Politics — The World Forum](#-world-politics--the-world-forum)
- [💬 Chat & Forum](#-chat--forum)
- [🎲 World Events & Lottery](#-world-events--lottery)
- [🏆 Awards & Progression](#-awards--progression)
- [Your Player Character](#your-player-character)
- [World State](#world-state)
- [Time & Turns](#time--turns)
- [How Everything Saves](#how-everything-saves)
- [Documentation Map](#documentation-map)

---

## Your Nation — The Heart of the Game

Your nation is more than a number on a screen. It is your legacy. Every dollar in the treasury, every acre of land, every citizen going to work, every soldier training, every line of research, every diplomatic relationship — it all lives on your nation and updates continuously as the world turns.

You start with a blank slate and build from the ground up. Will you be a benevolent democracy loved by your people? A feared military junta with iron-fisted control? A theocratic republic guided by faith? The choice is yours, and the world will react accordingly.

**Read the full reference:** [docs/Entities/Nation.md](docs/Entities/Nation.md)

The [Nation System](docs/Systems/nation-system.md) is the engine under the hood — it handles daily turns, economy, population, military, research, and everything that keeps your country running.

---

## 🏗️ Build Your Nation

An empire isn't built in a day — but it is built one building at a time. You have **three tiers of construction** at your disposal: Improvements, Projects, and Wonders.

**Improvements** are permanent buildings that cost money only. From barracks and factories to schools and hospitals, they form the backbone of your nation's power. Each type has a maximum number you can build, and your infrastructure level determines how many you can support. They require daily upkeep, and many generate pollution that you'll need to keep in check.

**Projects** are advanced permanent buildings — not temporary boosts. Once built, they stay unless you demolish them. They cost money plus raw materials like steel, aluminum, and uranium, and require technology levels to unlock. Your territory count determines how many project slots you have, and there's a cooldown between starting new projects, so choose wisely.

**Wonders** are the crown jewels — expensive, nation-defining monuments with unique effects like nuclear weapons, sports stadiums, and universal education. They require technology levels and prerequisites such as specific projects, other wonders, or fully upgraded improvements. Wonders can be demolished, but losing one means losing its powerful benefits forever.

Every build decision shapes your nation's future. Build wisely.

- [Buildings System](docs/Systems/buildings-systems.md) — How construction works
- [Improvements System](docs/Systems/improvements-systems.md) — Permanent nation buildings
- [Projects System](docs/Systems/projects-systems.md) — Advanced permanent buildings
- [Wonders System](docs/Systems/wonders-systems.md) — Nation-defining monuments

**Player-facing guide:** [Building Guide](docs/Guides/building-guide.md)

---

## 👥 Manage Your Citizens

Your population isn't just a stat — it's thousands of individual lives. Citizens are born, grow up, get jobs, pay taxes, fall in love, serve in your military, grow old, and eventually die. Each one contributes to your tax revenue, your workforce, your literacy, your happiness, and your loyalty.

You have hundreds of jobs across building types to assign your citizens to. From entry-level workers to management, every citizen has a role to play in your nation's success. Form relationships, support citizens through grief when others pass, and even talk to your people directly through the citizen dialog system.

Keep them happy, keep them working, and they'll build your empire with you. Neglect them, and they'll leave — or worse, turn against you.

- [Population System](docs/Systems/population-systems.md) — Citizen lifecycle, aging, births, deaths
- [Citizen Job System](docs/Systems/citizen-job-systems.md) — Jobs and employment
- [Citizen Ties System](docs/Systems/citizen-ties-systems.md) — Citizen relationships and grief
- [Citizen Dialog System](docs/Systems/citizen-dialog-systems.md) — Talk to your citizens

**Player-facing guide:** [Population Guide](docs/Guides/population-guide.md)

**Citizen reference:** [docs/Entities/Citizen.md](docs/Entities/Citizen.md)

---

## ⚔️ War & Military

Diplomacy fails. That's when the generals step in.

Raise an army from your citizenry — soldiers, tanks, aircraft, ships, spies, missiles, and nukes. Each unit costs money, upkeep, and population to maintain. Train them, equip them, deploy them.

When war comes, you have options: solo nation wars (one-on-one, nobody else can join), nation wars (up to twenty-four nations per side), solo alliance wars, and alliance wars (up to five alliances per side). Wars progress in rounds — best of three, four hours per round — with damage, casualties, and real consequences.

Every war needs a reason — a casus belli — which determines damage multipliers, what you can loot, and what peace terms are on the table. When the dust settles, negotiate peace, demand reparations, or annex territory.

This isn't a game of chance. It's a game of strategy, timing, and will.

- [War System](docs/Systems/war-systems.md) — Declarations, battles, rounds, peace terms
- [War Terms System](docs/Systems/war-terms-system.md) — War reasons, loot, peace formulas
- [Military Unit](docs/Entities/MilitaryUnit.md) — Soldiers, tanks, aircraft, ships, spies, missiles, nukes

**Player-facing guide:** [Military & War Guide](docs/Guides/military-war-guide.md)

---

## 🤝 Diplomacy & Alliances

No nation is an island. Your survival depends on who you trust — and who you betray.

Sign non-aggression pacts to keep the peace. Forge mutual defense treaties so your allies fight when you do. Create alliances with your own government structure, member roles, treasury, and internal politics. Some alliances are run by humans. Others — the dreaded Hive Mind — are controlled entirely by AI, with every human member serving as a lowly "Servant" with no real power.

When nations need help, there's aid and trade. Send financial assistance to a struggling ally, or propose trade deals with other players. Each nation has a limited number of proposal slots shared between aid and trade — once a deal is accepted or rejected, that slot enters a cooldown. Choose your partners wisely; you only have so many irons in the fire.

Diplomacy isn't just about being nice. It's about leverage, timing, and knowing exactly when to strike a deal — or break one.

- [Diplomacy System](docs/Systems/diplomacy-system.md) — Treaties, aid, relations, intelligence
- [Alliance System](docs/Systems/alliance-system.md) — Alliance creation, governments, war coordination
- [Hive Mind AI](docs/Entities/HiveMindAI.md) — AI-controlled alliances
- [Trade & Aid System](docs/Systems/trade-aid-system.md) — Nation-to-nation transfers

**Player-facing guides:** [Alliance & Diplomacy Guide](docs/Guides/Alliance-Diplomacy-Guide.md) | [World Economy Guide](docs/Guides/world-economy-guide.md)

**Alliance reference:** [docs/Entities/Alliance.md](docs/Entities/Alliance.md)

---

## 📦 Resources

Your nation runs on stuff. Steel. Aluminum. Uranium. Gasoline. Food. Water.

There are seven minerals — steel, bronze, lead, aluminum, copper, uranium, and gasoline — each moving through stages from raw ore to manufactured product. Iron ore becomes pig iron, then steel billet, then rolled steel, then finished steel. Crude oil becomes naphtha, then refinery blend, then finished gasoline. Each stage is more valuable than the last, but requires infrastructure and know-how to produce.

Plus food and water — the basics that keep your population alive and working. Production, consumption, and bonuses keep your pantries full or leave your citizens hungry.

Prices fluctuate based on global supply, demand, and currency exchange rates. Corner the market on uranium before a war breaks out, or flood the market with steel to crash a rival's construction plans. Resources are power — and power is everything.

- [Resource System](docs/Systems/resource-systems.md) — Staged minerals, food/water production, pricing

---

## 🏛️ Edicts

You don't just rule — you legislate.

Edicts are nation-wide policies that shape how your country runs on a fundamental level. Each edict category has three stances, and your choice affects taxes, crime, disease, literacy, military strength, research, land costs, and more. Want to boost research at the cost of happiness? Tighten crime control at the cost of population efficiency? It's your call.

But power has limits. You can only change edicts occasionally, so every decision weighs heavily. Some changes — like altering sexual orientation or marriage laws — trigger a happiness penalty for affected citizens. You get one free pass when you first unlock edicts, so make your first change count.

Rule with wisdom. Your citizens will feel every word you write into law.

- [Edict System](docs/Systems/edict-systems.md) — Nation-wide policy stances and effects

---

## 💰 Economy & World Bank

Money makes the world go round — and in Sovereignty Epochs, it runs on six currencies: Aurel, Velt, Krona, Drachma, Sovereign, and Talon. Each has its own value, fluctuating based on usage, circulation, recent spending, and global events. The World Bank sets the canonical rates, and your nation's economy rides those waves.

Take loans from the World Bank to fund your ambitions. Interest accrues daily based on global conditions: war, peace, disease, and crime all push rates up or down. Borrow in peacetime, repay in war, and watch your debt spiral.

Invest in currencies, watch markets shift, and build an economic empire that dwarfs your neighbors' armies. The richest nation doesn't always win the war — but it always has the most options.

- [Economy System](docs/Systems/economy-systems.md) — Currency markets, industry, trade flows
- [World Bank System](docs/Systems/world-bank-systems.md) — Loans, interest rates, territory costs

**Player-facing guide:** [World Economy Guide](docs/Guides/world-economy-guide.md)

---

## 🎯 Government & Religion

How you govern defines who you are.

Choose from government types including Liberal Democracy, Constitutional Monarchy, Communist State, Theocratic Republic, Military Junta, Corporatist State, Direct Democracy, Technocracy, Federal Republic, and Single-Party State. Each gives you boosts and penalties that ripple through your nation — affecting tax collection, military strength, population efficiency, pollution, disease, building upkeep, and happiness.

Choose from religions including Atheism, Monotheism, Polytheism, Buddhism, Hinduism, Shintoism, Islam, Christianity, Shamanism, Judaism, and others. Each provides boosts and penalties affecting happiness, disease, environment, literacy, tax efficiency, crime, military morale, stability, population efficiency, and tech growth.

A Liberal Democracy boosts happiness and tax income but weakens the military. A Military Junta makes your army fearsome but crushes citizen joy. A Buddhist nation enjoys peace and health but fields a weaker military. Mix and match government and religion to craft a nation that plays exactly how you want.

- [Government System](docs/Systems/government-systems.md)
- [Religion System](docs/Systems/religion-systems.md)

**Player-facing guide:** [Government & Religion Guide](docs/Guides/government-religion-guide.md)

---

## 🔬 Research & Technology

Knowledge is power — and in this game, it's funded.

Fund research projects from your Laboratory income. Each project has a cost in research points, and your labs divert a percentage of your revenue until the goal is met. There are no timers, no waiting for days to pass — progress is measured in research points, and you control the pace.

Unlock technologies across economy, healthcare, war, and production categories. Each technology has costs, effects, prerequisites, and unlocks that reshape what your nation can do. The more you research, the further ahead of the competition you pull.

- [Research System](docs/Systems/research-system.md)
- [Technology](docs/Entities/Technology.md)

**Player-facing guide:** [Research & Tech Guide](docs/Guides/research-tech-guide.md)

---

## 🏈 Sports Leagues

War isn't the only arena where champions are made.

Own basketball, hockey, soccer, or football teams — one per nation per sport. Your teams draw directly from your nation's treasury for salaries, upgrades, and contracts. Draft players from global draft boards, build stadiums, train athletes, manage injuries, and compete in leagues and tournaments across seasons.

Build a Wrestling Arena wonder and suddenly you're not just a nation — you're a sports powerhouse with fans, revenue, and championships to chase.

- [Sports System](docs/Systems/sports-system.md) — Leagues, seasons, tournaments
- [Team Player System](docs/Systems/team-player-system.md) — Rosters, contracts, training, injuries
- [Draft System](docs/Systems/draft-system.md) — Global draft boards per sport
- [Team](docs/Entities/Team.md) — Your sports team state

**Player-facing guide:** [Sports Guide](docs/Guides/sports-guide.md)

---

## 🤼 Wrestling Promotions

Step into the spotlight.

Build a Wrestling Arena wonder, and you unlock the ability to run your own wrestling promotion. Book weekly shows, monthly pay-per-views, and quarterly Mass Pay-Per-Views — the biggest events on the calendar. Manage wrestler rosters, contracts, injuries, rivalries, and championships. Generate wrestlers with unique names, signatures, finishers, and personas.

This isn't a sideshow. It's a full entertainment empire within your nation, complete with rival promotions and a draft system that feeds fresh talent into your ranks.

Put on a show the world will remember.

- [Wrestling System](docs/Systems/wrestling-system.md) — Shows, pay-per-views, championships
- [Wrestler System](docs/Systems/wrestler-system.md) — Wrestler generation, skills, personas, moves

---

## 🗳️ World Politics — The World Forum

Your nation doesn't exist in a vacuum. It exists in a world — and that world has laws.

The World Forum is where global governance happens. Congress proposes, debates, and votes on motions that affect every nation. Run for Congress, represent your faction, propose your vision, and vote on the motions that shape the world. Change faction colors, impose sanctions on rogue nations, and pass legislation that alters the game for everyone.

Politics isn't just a sideshow — it's how you exert influence beyond your borders.

- [World Forum System](docs/Systems/world-forum-system.md) — Congress, motions, elections
- [Motion System](docs/Systems/motion-system.md) — Motions and sanctions

**Player-facing guide:** [World Forum Guide](docs/Guides/world-forum-guide.md)

---

## 💬 Chat & Forum

You're not playing alone.

Talk to other players in world chat, alliance chat, private messages, or named group rooms. See who's typing, get read receipts, react to messages, and tip money to friends — all from a floating chat bubble that follows you across the game.

Post on the in-game Forum — create posts, comment with nested replies, react to content, tip other nations money, report harmful content, and receive notifications. Moderators can pin, lock, hide, and unhide posts, and review community reports.

Make allies. Make enemies. Make your voice heard.

- [Messaging System](docs/Systems/messaging-system.md) — World, alliance, private, and group chat
- [Forum System](docs/Systems/forum-system.md) — Posts, comments, tips, reports, moderation

**Player-facing guides:** [Messaging Guide](docs/Guides/messaging-guide.md) | [Forum Guide](docs/Guides/forum-guide.md)

---

## 🎲 World Events & Lottery

The world is unpredictable — and that's by design.

Random events hit nations every turn: economic shifts, disasters, miracles, and population situations where you choose from three options that steer your nation's fate. Diseases break out — national outbreaks that can evolve into global pandemics, or global events that strike multiple nations at once. Pollution, crime, and happiness all shift the odds.

Then there's the World Lottery — a weekly drawing funded by World Bank revenue and nation ticket sales. Buy tickets, pick your numbers, and winners have fourteen days to claim their prizes.

Fortune favors the bold — and the lucky.

- [Events System](docs/Systems/events-system.md) — Economic, sports, disaster, miracle, and situation events
- [World Lottery System](docs/Systems/world-lottery-system.md) — Weekly drawing
- [Disease System](docs/Systems/disease-systems.md) — National and global disease outbreaks

**Player-facing guides:** [Events Guide](docs/Guides/events-guide.md) | [Disease Guide](docs/Guides/disease-guide.md)

---

## 🏆 Awards & Progression

Every action matters.

Earn experience from wars, treaties, research, sports, forum activity, diplomacy, and more. Level up, unlock skill points, and watch your legend grow. Daily, weekly, and monthly goals give you fresh challenges and rewards.

Earn cosmetic awards for bragging rights across all game mechanics — military victories, population milestones, research breakthroughs, government achievements, sports championships, forum activity, and diplomatic triumphs. They don't give gameplay bonuses, but they show the world what you've accomplished.

Your legacy is measured in more than just land and money.

- [XP Goals System](docs/Systems/xp-goals-system.md) — Experience awards and goals
- [Award System](docs/Entities/AwardSystem.md) — Achievements across all game mechanics

**Player-facing guide:** [Awards Guide](docs/Guides/awards-guide.md)

---

## Your Player Character

You are more than a nation — you are a person.

Your Player entity tracks your account progression: levels, experience, skill point allocation, legendary prestige, energy, and intuition. You're separate from any single nation you control, and your identity persists across your journey. Combat calculation helpers support your military endeavors, and your skills grow as you play.

You are the constant in a changing world.

- [Player Entity](docs/Entities/Player.md) — Leveling, experience, skills, legendaries

---

## World State

Your nation is one piece of a living world.

The Global World tracks everything happening across the entire game — global happiness, pollution, disease, crime, environment, population density, education, literacy rates, recent strikes, government and religion tallies, war and peace statistics, military averages, currency stats, and sports stats.

This global state feeds back into your nation: interest rates shift with world war levels, event chances change with global disease, and world modifiers touch every border. You're not just managing a country — you're surviving in a world that reacts to everyone's choices.

- [Global World](docs/Entities/global-world.md) — World-level state holder
- [Global System](docs/Systems/global-system.md) — Global calculations and modifiers

**Player-facing guide:** [Global System Guide](docs/Guides/global-system-guide.md)

---

## Time & Turns

The world never stops ticking.

The Time System drives the daily cycle, month and year progression, and every time-dependent mechanic in the game. Your nation processes automatically — population ages, economies tick, research progresses, events fire — all while you're making your next big decision.

No manual saving needed. The world keeps moving whether you're online or asleep.

- [Time System](docs/Systems/time-systems.md) — Daily cycle, calendar, scheduled events

---

## How Everything Saves

Your progress is safe.

Every action you take — building a wonder, declaring war, sending aid, signing a treaty, drafting a player — is saved immediately. There is no manual save button. If the server crashes, you refresh, or the world keeps turning while you're away, nothing is lost. Your empire persists.

- [Core Overview — Databases & Persistence](docs/Core/core-overview.md)
- [Core Data & Databases](docs/Core/core-data-databases.md)
- [Core Backup & Sync](docs/Core/core-backup-sync.md)

---

## Documentation Map

### Systems (How the game works)

| System | Doc |
|--------|-----|
| Nation System | [docs/Systems/nation-system.md](docs/Systems/nation-system.md) |
| Population System | [docs/Systems/population-systems.md](docs/Systems/population-systems.md) |
| Economy System | [docs/Systems/economy-systems.md](docs/Systems/economy-systems.md) |
| War System | [docs/Systems/war-systems.md](docs/Systems/war-systems.md) |
| Diplomacy System | [docs/Systems/diplomacy-system.md](docs/Systems/diplomacy-system.md) |
| Alliance System | [docs/Systems/alliance-system.md](docs/Systems/alliance-system.md) |
| Research System | [docs/Systems/research-system.md](docs/Systems/research-system.md) |
| World Bank System | [docs/Systems/world-bank-systems.md](docs/Systems/world-bank-systems.md) |
| World Lottery System | [docs/Systems/world-lottery-system.md](docs/Systems/world-lottery-system.md) |
| Sports System | [docs/Systems/sports-system.md](docs/Systems/sports-system.md) |
| Wrestling System | [docs/Systems/wrestling-system.md](docs/Systems/wrestling-system.md) |
| Wrestler System | [docs/Systems/wrestler-system.md](docs/Systems/wrestler-system.md) |
| Government System | [docs/Systems/government-systems.md](docs/Systems/government-systems.md) |
| Religion System | [docs/Systems/religion-systems.md](docs/Systems/religion-systems.md) |
| Disease System | [docs/Systems/disease-systems.md](docs/Systems/disease-systems.md) |
| Events System | [docs/Systems/events-system.md](docs/Systems/events-system.md) |
| Motion System | [docs/Systems/motion-system.md](docs/Systems/motion-system.md) |
| World Forum System | [docs/Systems/world-forum-system.md](docs/Systems/world-forum-system.md) |
| Forum System | [docs/Systems/forum-system.md](docs/Systems/forum-system.md) |
| Messaging System | [docs/Systems/messaging-system.md](docs/Systems/messaging-system.md) |
| Buildings System | [docs/Systems/buildings-systems.md](docs/Systems/buildings-systems.md) |
| Citizen Job System | [docs/Systems/citizen-job-systems.md](docs/Systems/citizen-job-systems.md) |
| Citizen Ties System | [docs/Systems/citizen-ties-systems.md](docs/Systems/citizen-ties-systems.md) |
| Citizen Dialog System | [docs/Systems/citizen-dialog-systems.md](docs/Systems/citizen-dialog-systems.md) |
| Time System | [docs/Systems/time-systems.md](docs/Systems/time-systems.md) |
| Draft System | [docs/Systems/draft-system.md](docs/Systems/draft-system.md) |
| Team Player System | [docs/Systems/team-player-system.md](docs/Systems/team-player-system.md) |
| Trade & Aid System | [docs/Systems/trade-aid-system.md](docs/Systems/trade-aid-system.md) |
| XP Goals System | [docs/Systems/xp-goals-system.md](docs/Systems/xp-goals-system.md) |
| Data Integration System | [docs/Systems/data-integration-system.md](docs/Systems/data-integration-system.md) |
| War Terms System | [docs/Systems/war-terms-system.md](docs/Systems/war-terms-system.md) |
| Edict System | [docs/Systems/edict-systems.md](docs/Systems/edict-systems.md) |
| Improvements System | [docs/Systems/improvements-systems.md](docs/Systems/improvements-systems.md) |
| Projects System | [docs/Systems/projects-systems.md](docs/Systems/projects-systems.md) |
| Resource System | [docs/Systems/resource-systems.md](docs/Systems/resource-systems.md) |
| Wonders System | [docs/Systems/wonders-systems.md](docs/Systems/wonders-systems.md) |

### Entities (What you play with)

| Entity | Doc |
|--------|-----|
| Nation | [docs/Entities/Nation.md](docs/Entities/Nation.md) |
| Player | [docs/Entities/Player.md](docs/Entities/Player.md) |
| Alliance | [docs/Entities/Alliance.md](docs/Entities/Alliance.md) |
| Citizen | [docs/Entities/Citizen.md](docs/Entities/Citizen.md) |
| Military Unit | [docs/Entities/MilitaryUnit.md](docs/Entities/MilitaryUnit.md) |
| Building | [docs/Entities/Building.md](docs/Entities/Building.md) |
| Technology | [docs/Entities/Technology.md](docs/Entities/Technology.md) |
| Team | [docs/Entities/Team.md](docs/Entities/Team.md) |
| Award System | [docs/Entities/AwardSystem.md](docs/Entities/AwardSystem.md) |
| Hive Mind AI | [docs/Entities/HiveMindAI.md](docs/Entities/HiveMindAI.md) |
| Global World | [docs/Entities/global-world.md](docs/Entities/global-world.md) |

### Guides (How to play)

| Guide | Doc |
|-------|-----|
| Building Guide | [docs/Guides/building-guide.md](docs/Guides/building-guide.md) |
| Population Guide | [docs/Guides/population-guide.md](docs/Guides/population-guide.md) |
| Military & War Guide | [docs/Guides/military-war-guide.md](docs/Guides/military-war-guide.md) |
| Alliance & Diplomacy Guide | [docs/Guides/Alliance-Diplomacy-Guide.md](docs/Guides/Alliance-Diplomacy-Guide.md) |
| World Economy Guide | [docs/Guides/world-economy-guide.md](docs/Guides/world-economy-guide.md) |
| Government & Religion Guide | [docs/Guides/government-religion-guide.md](docs/Guides/government-religion-guide.md) |
| Research & Tech Guide | [docs/Guides/research-tech-guide.md](docs/Guides/research-tech-guide.md) |
| Sports Guide | [docs/Guides/sports-guide.md](docs/Guides/sports-guide.md) |
| Events Guide | [docs/Guides/events-guide.md](docs/Guides/events-guide.md) |
| Forum Guide | [docs/Guides/forum-guide.md](docs/Guides/forum-guide.md) |
| Messaging Guide | [docs/Guides/messaging-guide.md](docs/Guides/messaging-guide.md) |
| Disease Guide | [docs/Guides/disease-guide.md](docs/Guides/disease-guide.md) |
| Awards Guide | [docs/Guides/awards-guide.md](docs/Guides/awards-guide.md) |
| Global System Guide | [docs/Guides/global-system-guide.md](docs/Guides/global-system-guide.md) |
| World Forum Guide | [docs/Guides/world-forum-guide.md](docs/Guides/world-forum-guide.md) |

### Core Architecture (Backend)

| Doc | Covers |
|-----|--------|
| Core Overview | [docs/Core/core-overview.md](docs/Core/core-overview.md) |
| Core Auth | [docs/Core/core-auth.md](docs/Core/core-auth.md) |
| Core Admin | [docs/Core/core-admin.md](docs/Core/core-admin.md) |
| Core AI Nations | [docs/Core/core-ai-nations.md](docs/Core/core-ai-nations.md) |
| Core API & Query | [docs/Core/core-api-query.md](docs/Core/core-api-query.md) |
| Core Config & Engine | [docs/Core/core-config-engine.md](docs/Core/core-config-engine.md) |
| Core Data & Databases | [docs/Core/core-data-databases.md](docs/Core/core-data-databases.md) |
| Core Database Schemas | [docs/Core/core-database-schemas.md](docs/Core/core-database-schemas.md) |
| Core Backup & Sync | [docs/Core/core-backup-sync.md](docs/Core/core-backup-sync.md) |
| Core Events, Errors, Colors | [docs/Core/core-events-errors-colors.md](docs/Core/core-events-errors-colors.md) |
| Core Aid System | [docs/Core/core-aid-system.md](docs/Core/core-aid-system.md) |

---

## Ready to Rule?

Your nation awaits. Will you build an economic superpower that dominates the World Bank? A military empire that strikes fear into every border? A diplomatic web that controls the World Forum from the shadows? A sports dynasty with championship banners in every arena? A wrestling promotion that sells out Mass Pay-Per-Views?

The world is persistent. Every decision echoes. Every action saves. Your story starts now.

**Build your nation. Shape the epoch. Leave your mark.**

---

*Questions or bug reports? Check the in-game bug report modal or reach out to an admin. This game is actively developed with weekly updates and live events.*