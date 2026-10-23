# Dominion Wars â€” Complete Asset & Resource Checklist

> **Legend:** âœ… Done &nbsp;|&nbsp; â¬œ Needed &nbsp;|&nbsp; ðŸŽ¯ Priority  
> Color faction PNGs (aqua, black, blue, green, lime, orange, pink, purple, red, yellow) are âœ… â€” all 10 confirmed in `assets/images/Colors/`.  
> Everything else starts unchecked. Mark âœ… when added to the project.

---

## ðŸ“ TABLE OF CONTENTS
1. [Faction / Color Flags](#1-faction--color-flags)
2. [Government Type Icons](#2-government-type-icons)
3. [Religion Icons](#3-religion-icons)
4. [Military Unit Icons](#4-military-unit-icons)
5. [Resource Icons](#5-resource-icons)
6. [Building & Improvement Icons](#6-building--improvement-icons)
7. [Project Icons](#7-project-icons)
8. [Wonder Icons](#8-wonder-icons)
9. [Research / Technology Icons](#9-research--technology-icons)
10. [Player Skill Icons](#10-player-skill-icons)
11. [Nation Stat Icons](#11-nation-stat-icons)
12. [Diplomacy & Alliance Icons](#12-diplomacy--alliance-icons)
13. [Sports Icons](#13-sports-icons)
14. [Disease Icons](#14-disease-icons)
15. [Event Icons](#15-event-icons)
16. [UI / Menu Icons & Buttons](#16-ui--menu-icons--buttons)
17. [Map & Terrain Icons](#17-map--terrain-icons)
18. [Flag Designer Assets](#18-flag-designer-assets)
19. [Sound Effects](#19-sound-effects)
20. [Background Music / Ambient](#20-background-music--ambient)
21. [Where to Find Free Assets](#21-where-to-find-free-assets)

---

## 1. Faction / Color Flags

These are the 10 colored-square PNG badges shown in the World Forum / Congress.  
All 10 are **already complete** in `assets/images/Colors/`.

| Asset | File | Status |
|-------|------|--------|
| Aqua Federation flag | `assets/images/Colors/aqua.png` | âœ… |
| Black Empire flag | `assets/images/Colors/black.png` | âœ… |
| Blue Republic flag | `assets/images/Colors/blue.png` | âœ… |
| Green Alliance flag | `assets/images/Colors/green.png` | âœ… |
| Lime Dominion flag | `assets/images/Colors/lime.png` | âœ… |
| Orange Coalition flag | `assets/images/Colors/orange.png` | âœ… |
| Pink Realm flag | `assets/images/Colors/pink.png` | âœ… |
| Purple Sovereignty flag | `assets/images/Colors/purple.png` | âœ… |
| Red Confederation flag | `assets/images/Colors/red.png` | âœ… |
| Yellow Union flag | `assets/images/Colors/yellow.png` | âœ… |

> ðŸ’¡ **Upgrade idea:** Replace solid-color squares with stylized heraldic shields or banner designs for each faction (still color-coded but more unique). Not required but would greatly improve visual identity.

---

## 2. Government Type Icons

Each of the 12 government types needs a unique icon/emblem for the selection screen, demand hints, and nation overview.  
Suggested format: 64Ã—64 or 128Ã—128 PNG, ideally with transparent background.

> **âœ… All 12 governments now have emoji icons** stored as `icon` field in `systems/government-system.js` (single source of truth). Icons appear in: Nation overview stat card, government selection dropdown, government preview panel, Reference Encyclopedia cards, Demand Modal selection grid and header, Demand Handler toasts, Map nation info panel. Two helper methods added: `GovernmentSystem.getGovernmentIcon(id)` and `GovernmentSystem.getGovernmentLabel(id)`.

| Government | Emoji Icon | Where Used | Emoji Status | Custom PNG |
|------------|-----------|------------|:---:|--------|
| Liberal Democracy | ðŸ—³ï¸ | Nation popup, dropdown, preview, encyclopedia, demand modal, toast, map panel | âœ… | â¬œ |
| Constitutional Monarchy | ðŸ‘‘ | " | âœ… | â¬œ |
| Communist State | âš’ï¸ | " | âœ… | â¬œ |
| Theocratic Republic | ðŸ•Œ | " | âœ… | â¬œ |
| Military Junta | ðŸŽ–ï¸ | " | âœ… | â¬œ |
| Corporatist State | ðŸ­ | " | âœ… | â¬œ |
| Direct Democracy | ðŸ“œ | " | âœ… | â¬œ |
| Technocracy | ðŸ”¬ | " | âœ… | â¬œ |
| Federal Republic | âš–ï¸ | " | âœ… | â¬œ |
| Single-Party State | ðŸ´ | " | âœ… | â¬œ |
| Anarcho-Communism | ðŸŒ | " | âœ… | â¬œ |
| Absolute Monarchy | â™› | " | âœ… | â¬œ |

### Custom PNG Icons (future upgrade)
| Asset | File | Status |
|-------|------|--------|
| Liberal Democracy custom icon | `assets/images/governments/liberal_democracy.png` | â¬œ |
| Constitutional Monarchy custom icon | `assets/images/governments/constitutional_monarchy.png` | â¬œ |
| Communist State custom icon | `assets/images/governments/communist_state.png` | â¬œ |
| Theocratic Republic custom icon | `assets/images/governments/theocratic_republic.png` | â¬œ |
| Military Junta custom icon | `assets/images/governments/military_junta.png` | â¬œ |
| Corporatist State custom icon | `assets/images/governments/corporatist_state.png` | â¬œ |
| Direct Democracy custom icon | `assets/images/governments/direct_democracy.png` | â¬œ |
| Technocracy custom icon | `assets/images/governments/technocracy.png` | â¬œ |
| Federal Republic custom icon | `assets/images/governments/federal_republic.png` | â¬œ |
| Single-Party State custom icon | `assets/images/governments/single_party_state.png` | â¬œ |
| Anarcho-Communism custom icon | `assets/images/governments/anarcho_communism.png` | â¬œ |
| Absolute Monarchy custom icon | `assets/images/governments/absolute_monarchy.png` | â¬œ |

---

## 3. Religion Icons

12 religion types â€” each needs an icon for the religion picker, demand hints, and nation panel.

| Religion | Suggested Emoji (fallback) | Custom Icon File | Status |
|----------|---------------------------|-----------------|--------|
| State Atheism | ðŸ”­ | `assets/images/religions/state_atheism.png` | â¬œ ðŸŽ¯ |
| Monotheism (Abrahamic) | âœ¡ï¸ / âœï¸ / â˜ªï¸ | `assets/images/religions/monotheism.png` | â¬œ ðŸŽ¯ |
| Polytheism | ðŸ›ï¸ | `assets/images/religions/polytheism.png` | â¬œ ðŸŽ¯ |
| Buddhism | â˜¸ï¸ | `assets/images/religions/buddhism.png` | â¬œ ðŸŽ¯ |
| Hinduism | ðŸ•‰ï¸ | `assets/images/religions/hinduism.png` | â¬œ ðŸŽ¯ |
| Shinto | â›©ï¸ | `assets/images/religions/shinto.png` | â¬œ ðŸŽ¯ |
| Zoroastrianism | ðŸ”¥ | `assets/images/religions/zoroastrianism.png` | â¬œ ðŸŽ¯ |
| Sikhism | ðŸª¯ | `assets/images/religions/sikhism.png` | â¬œ ðŸŽ¯ |
| Taoism | â˜¯ï¸ | `assets/images/religions/taoism.png` | â¬œ ðŸŽ¯ |
| Judaism | âœ¡ï¸ | `assets/images/religions/judaism.png` | â¬œ ðŸŽ¯ |
| New Age Spirituality | ðŸŒ™ | `assets/images/religions/new_age.png` | â¬œ ðŸŽ¯ |
| Ancestor Worship | ðŸª¦ | `assets/images/religions/ancestor_worship.png` | â¬œ ðŸŽ¯ |

---

## 4. Military Unit Icons

7 core military unit types shown throughout the Military panel, war screens, and stats.

| Unit | Emoji Used | Where Applied | Status |
|------|-----------|---------------|--------|
| Soldiers | ðŸª– | Military popup unit grid, WarPanel intel results, spy ops, AlliancePanel, map panel | âœ… |
| Tanks | ðŸ›¡ï¸ | Military popup unit grid, WarPanel intel results, spy ops, AlliancePanel (fixed from ðŸš—), map panel | âœ… |
| Aircraft | âœˆï¸ | Military popup unit grid, WarPanel intel results, spy ops, AlliancePanel, map panel | âœ… |
| Ships | ðŸš¢ | Military popup unit grid, WarPanel intel results, spy ops, AlliancePanel, map panel | âœ… |
| Spies | ðŸ•µï¸ | Military popup unit grid, WarPanel action card, spy ops modal header & stats, AlliancePanel, notifications | âœ… |
| Missiles | ï¿½ | Military popup unit grid, WarPanel action card & button & count, spy ops, notifications, map fa-bomb, AlliancePanel | âœ… |
| Nuclear Warheads | â˜¢ï¸ | Military popup unit grid, WarPanel action card & button & count, intel results, map fa-radiation, AlliancePanel | âœ… |

> **Icon decisions:** Missiles use ðŸ’£ (bomb emoji) as requested â€” ðŸš€ is now reserved for rockets/spacecraft context only. Nukes keep â˜¢ï¸ (radiation). Tanks corrected from placeholder ðŸš— to ðŸ›¡ï¸. The FontAwesome icon for the map missile button was updated from `fa-rocket` â†’ `fa-bomb`.

### Military Status / Combat Icons
| Asset | Emoji | Where | Status |
|-------|-------|-------|--------|
| At War indicator | âš”ï¸ | WarPanel header, side labels, activity list | âœ… |
| Peace / No wars | ðŸ•Šï¸ | WarPanel no-wars message, war ended event | âœ… |
| Counter-damage / casualties | ðŸ©¸ | WarPanel attack result message, nuke hit notification, unit modal note | âœ… |
| Injured / casualties note | ðŸ©¸ | WarPanel defeat result, missile strike result, spy target descriptions | âœ… |
| Critical Hit | ðŸŽ¯ | WarPanel attack result message | âœ… |
| Missile intercepted — brick throw | 🧱 image | `throwBrick('missile')` — random PNG from `assets/images/Misses/` (22 colors), 50–80px, flies across screen | ✅ |
| Nuke intercepted — brick throw | 🧱 image | `throwBrick('nuke')` — same 22-color Misses pool, 80–120px, bigger/faster arc | ✅ |
| Nuclear strike hit | â˜¢ï¸ | WarPanel handleNukeHit notification | âœ… |
| Victory | ðŸ† | WarPanel war result | âœ… |
| Defeat | ðŸ’€ | WarPanel war result | âœ… |
| Military Morale | ðŸŽ–ï¸ | index.html military popup stat | âœ… |
| Military Strength | ðŸ’ª | index.html military popup stat | âœ… |

### Custom Icon Files (future upgrade from emojis)
| Asset | Custom File | Status |
|-------|-------------|--------|
| Soldiers custom icon | `assets/images/military/soldiers.png` | â¬œ |
| Tanks custom icon | `assets/images/military/tanks.png` | â¬œ |
| Aircraft custom icon | `assets/images/military/aircraft.png` | â¬œ |
| Ships custom icon | `assets/images/military/ships.png` | â¬œ |
| Spies custom icon | `assets/images/military/spies.png` | â¬œ |
| Missiles custom icon | `assets/images/military/missiles.png` | â¬œ |
| Nuclear Warheads custom icon | `assets/images/military/nukes.png` | â¬œ |

---

## 5. Resource Icons

### Basic Resources (10)
Each needs a small icon for the resource panel, trade screen, and building costs.

| Resource | Suggested Emoji | Custom Icon File | Status |
|----------|----------------|-----------------|--------|
| Iron | â›ï¸ | `assets/images/resources/iron.png` | â¬œ ðŸŽ¯ |
| Lead | ðŸ”© | `assets/images/resources/lead.png` | â¬œ ðŸŽ¯ |
| Lumber | ðŸªµ | `assets/images/resources/lumber.png` | â¬œ ðŸŽ¯ |
| Water | ðŸ’§ | `assets/images/resources/water.png` | â¬œ ðŸŽ¯ |
| Food | ðŸŒ¾ | `assets/images/resources/food.png` | â¬œ ðŸŽ¯ |
| Uranium | â˜¢ï¸ | `assets/images/resources/uranium.png` | â¬œ ðŸŽ¯ |
| Coal | ðŸª¨ | `assets/images/resources/coal.png` | â¬œ ðŸŽ¯ |
| Oil | ðŸ›¢ï¸ | `assets/images/resources/oil.png` | â¬œ ðŸŽ¯ |
| Limestone | ðŸ§± | `assets/images/resources/limestone.png` | â¬œ ðŸŽ¯ |
| Bauxite | ðŸ’Ž | `assets/images/resources/bauxite.png` | â¬œ ðŸŽ¯ |

### Manufactured Resources (7)
| Resource | Suggested Emoji | Custom Icon File | Status |
|----------|----------------|-----------------|--------|
| Steel | ðŸ”§ | `assets/images/resources/steel.png` | â¬œ ðŸŽ¯ |
| Ammo | ðŸ”« | `assets/images/resources/ammo.png` | â¬œ ðŸŽ¯ |
| Paper | ðŸ“„ | `assets/images/resources/paper.png` | â¬œ ðŸŽ¯ |
| Cooked Food | ðŸ² | `assets/images/resources/cooked_food.png` | â¬œ ðŸŽ¯ |
| Cement | ðŸ—ï¸ | `assets/images/resources/cement.png` | â¬œ ðŸŽ¯ |
| Gas | â›½ | `assets/images/resources/gas.png` | â¬œ ðŸŽ¯ |
| Aluminum | ðŸ¥« | `assets/images/resources/aluminum.png` | â¬œ ðŸŽ¯ |

### Currency
| Asset | Emoji | Custom File | Status |
|-------|-------|-------------|--------|
| Money / Treasury | ðŸ’° | `assets/images/resources/money.png` | â¬œ |
| National Debt indicator | ðŸ“‰ | â€” (emoji OK) | â¬œ |

---

## 6. Building & Improvement Icons

18 improvement types shown in the Build â†’ Improvements tab.

| Building | Suggested Emoji | Custom Icon File | Status |
|----------|----------------|-----------------|--------|
| Port | âš“ | `assets/images/buildings/port.png` | â¬œ ðŸŽ¯ |
| Mine | â›ï¸ | `assets/images/buildings/mine.png` | â¬œ ðŸŽ¯ |
| Assembly Plant | ðŸ­ | `assets/images/buildings/assembly_plant.png` | â¬œ ðŸŽ¯ |
| Barracks | ðŸ•ï¸ | `assets/images/buildings/barracks.png` | â¬œ ðŸŽ¯ |
| Factory | ðŸ”© | `assets/images/buildings/factory.png` | â¬œ ðŸŽ¯ |
| Airforce Base | âœˆï¸ | `assets/images/buildings/airforce_base.png` | â¬œ ðŸŽ¯ |
| Harbor | ðŸš¢ | `assets/images/buildings/harbor.png` | â¬œ ðŸŽ¯ |
| Embassy | ðŸ›ï¸ | `assets/images/buildings/embassy.png` | â¬œ ðŸŽ¯ |
| Foreign Affairs Office | ðŸŒ | `assets/images/buildings/foreign_affairs.png` | â¬œ ðŸŽ¯ |
| Internal Affairs Office | ðŸ›ï¸ | `assets/images/buildings/internal_affairs.png` | â¬œ ðŸŽ¯ |
| Hospital | ðŸ¥ | `assets/images/buildings/hospital.png` | â¬œ ðŸŽ¯ |
| Police Station | ðŸš” | `assets/images/buildings/police_station.png` | â¬œ ðŸŽ¯ |
| Recycling Center | â™»ï¸ | `assets/images/buildings/recycling_center.png` | â¬œ ðŸŽ¯ |
| School | ðŸ« | `assets/images/buildings/school.png` | â¬œ ðŸŽ¯ |
| Casino | ðŸŽ° | `assets/images/buildings/casino.png` | â¬œ ðŸŽ¯ |
| Park | ðŸŒ³ | `assets/images/buildings/park.png` | â¬œ ðŸŽ¯ |
| Research Laboratory | ðŸ”¬ | `assets/images/buildings/research_lab.png` | â¬œ ðŸŽ¯ |
| Tree Plantation | ðŸŒ² | `assets/images/buildings/tree_plantation.png` | â¬œ ðŸŽ¯ |

---

## 7. Project Icons

30+ projects shown in the Build â†’ Projects tab.

| Project | Suggested Emoji | Custom Icon File | Status |
|---------|----------------|-----------------|--------|
| Missile Silo | ðŸš€ | `assets/images/projects/missile_silo.png` | â¬œ |
| Iron Curtain Defense | ðŸ›¡ï¸ | `assets/images/projects/iron_curtain.png` | â¬œ |
| International Trade Hub | ðŸŒ | `assets/images/projects/trade_hub.png` | â¬œ |
| Military Command Center | ðŸ—ºï¸ | `assets/images/projects/command_center.png` | â¬œ |
| Office of Diplomatic Relations | ðŸ¤ | `assets/images/projects/diplomacy_office.png` | â¬œ |
| Advanced Military Academy | ðŸŽ–ï¸ | `assets/images/projects/military_academy.png` | â¬œ |
| National University | ðŸ“š | `assets/images/projects/university.png` | â¬œ |
| Emergency Medical Hub | ðŸš‘ | `assets/images/projects/ambulance_hub.png` | â¬œ |
| Government Monument / Statue | ðŸ—½ | `assets/images/projects/government_statue.png` | â¬œ |
| Religious Monument / Statue | â›ª | `assets/images/projects/religious_statue.png` | â¬œ |
| Intelligence Operations Center | ðŸ•µï¸ | `assets/images/projects/spy_operations.png` | â¬œ |
| Resource Reclamation Facility | â™»ï¸ | `assets/images/projects/salvage_yard.png` | â¬œ |
| SWAT Operations Center | ðŸš“ | `assets/images/projects/swat_center.png` | â¬œ |
| Advanced Research Institute | ðŸ§ª | `assets/images/projects/advanced_research.png` | â¬œ |
| Advanced Police Stations | ðŸ‘® | `assets/images/projects/enhanced_police.png` | â¬œ |
| Sports Betting Complex | ðŸŽ² | `assets/images/projects/sports_betting.png` | â¬œ |
| Advanced Mining Operations | â›ï¸ | `assets/images/projects/enhanced_mining.png` | â¬œ |
| Advanced Manufacturing Systems | ðŸ­ | `assets/images/projects/enhanced_assembly.png` | â¬œ |
| Advanced Recycling Operations | â™»ï¸ | `assets/images/projects/enhanced_recycling.png` | â¬œ |
| Elite Military Training Program | ðŸ’ª | `assets/images/projects/enhanced_barracks.png` | â¬œ |
| Advanced Tank Manufacturing | ðŸ›¡ï¸ | `assets/images/projects/enhanced_factories.png` | â¬œ |
| Advanced Aircraft Systems | âœˆï¸ | `assets/images/projects/enhanced_airforces.png` | â¬œ |
| Advanced Naval Operations | ðŸš¢ | `assets/images/projects/enhanced_navy.png` | â¬œ |
| National Broadcasting Network | ðŸ“¡ | `assets/images/projects/broadcasting.png` | â¬œ |
| Financial Assistance Office | ðŸ’¸ | `assets/images/projects/financial_assistance.png` | â¬œ |
| Military Salvage Operations | ðŸ”§ | `assets/images/projects/military_salvage.png` | â¬œ |

---

## 8. Wonder Icons

24 wonders shown in the Build â†’ Wonders tab.  
These are the most prestigious buildings and deserve the highest quality art.

| Wonder | Suggested Emoji | Custom Icon File | Status |
|--------|----------------|-----------------|--------|
| Government Monument (Wonder) | ðŸ›ï¸ | `assets/images/wonders/government_monument.png` | â¬œ ðŸŽ¯ |
| Religious Monument (Wonder) | â›©ï¸ | `assets/images/wonders/religious_monument.png` | â¬œ ðŸŽ¯ |
| Great Library | ðŸ“š | `assets/images/wonders/great_library.png` | â¬œ ðŸŽ¯ |
| Universal Education System | ðŸŽ“ | `assets/images/wonders/universal_education.png` | â¬œ |
| Universal Healthcare System | ðŸ¥ | `assets/images/wonders/universal_healthcare.png` | â¬œ |
| Enhanced Missile Silo Network | ðŸš€ | `assets/images/wonders/enhanced_silos.png` | â¬œ |
| Enhanced Intelligence Network | ðŸ•µï¸ | `assets/images/wonders/enhanced_spy.png` | â¬œ |
| Military Recovery Wonder | ðŸš‘ | `assets/images/wonders/military_recovery.png` | â¬œ |
| Advanced Resource Recovery Complex | â™»ï¸ | `assets/images/wonders/enhanced_salvage.png` | â¬œ |
| Nuclear Warhead Production Facility | â˜¢ï¸ | `assets/images/wonders/nuclear_facility.png` | â¬œ ðŸŽ¯ |
| Enhanced Nuclear Arsenal | ðŸ’¥ | `assets/images/wonders/enhanced_nuclear.png` | â¬œ |
| Atmospheric Water Generator | ðŸ’§ | `assets/images/wonders/water_generator.png` | â¬œ |
| Hydroponic Mega-Farm Complex | ðŸŒ¿ | `assets/images/wonders/hydroponic_farm.png` | â¬œ |
| Basketball Stadium | ðŸ€ | `assets/images/wonders/basketball_stadium.png` | â¬œ ðŸŽ¯ |
| Hockey Arena | ðŸ’ | `assets/images/wonders/hockey_arena.png` | â¬œ ðŸŽ¯ |
| Soccer Stadium | âš½ | `assets/images/wonders/soccer_stadium.png` | â¬œ ðŸŽ¯ |
| Alliance Headquarters | ðŸ¤ | `assets/images/wonders/alliance_hq.png` | â¬œ ðŸŽ¯ |
| Supreme Mining Complex | â›ï¸ | `assets/images/wonders/supreme_mining.png` | â¬œ |
| Clean Mining Operations Wonder | ðŸŒ¿ | `assets/images/wonders/clean_mining.png` | â¬œ |
| Supreme Manufacturing Complex | ðŸ­ | `assets/images/wonders/supreme_assembly.png` | â¬œ |
| Clean Manufacturing Operations Wonder | ðŸŒ± | `assets/images/wonders/clean_assembly.png` | â¬œ |
| Supreme Environmental Protection Complex | ðŸŒ | `assets/images/wonders/supreme_recycling.png` | â¬œ |
| Supreme Military Command Complex | âš”ï¸ | `assets/images/wonders/supreme_military.png` | â¬œ ðŸŽ¯ |
| Global Internet Network | ðŸŒ | `assets/images/wonders/internet.png` | â¬œ |

---

## 9. Research / Technology Icons

4 research branches with ~12 tiers each (40+ total techs). At minimum one icon per branch; ideally one per tier.

### Branch Icons (Minimum Required)
| Branch | Suggested Emoji | Custom Icon File | Status |
|--------|----------------|-----------------|--------|
| Economy Research (branch icon) | ðŸ“Š | `assets/images/research/branch_economy.png` | â¬œ ðŸŽ¯ |
| Healthcare Research (branch icon) | ðŸ©º | `assets/images/research/branch_healthcare.png` | â¬œ ðŸŽ¯ |
| Production Research (branch icon) | âš™ï¸ | `assets/images/research/branch_production.png` | â¬œ ðŸŽ¯ |
| War Research (branch icon) | âš”ï¸ | `assets/images/research/branch_war.png` | â¬œ ðŸŽ¯ |

### Tier Milestone Icons (Nice-to-Have)
| Asset | Description | Status |
|-------|-------------|--------|
| Ancient tier icon | Stone/clay tablet | â¬œ |
| Classical tier icon | Column / scroll | â¬œ |
| Medieval tier icon | Castle / siege weapon | â¬œ |
| Renaissance tier icon | Printing press | â¬œ |
| Industrial tier icon | Steam engine / factory | â¬œ |
| Modern tier icon | Computer / atom | â¬œ |
| Future tier icon | Hologram / space | â¬œ |

### Research UI Elements
| Asset | Emoji | Custom File | Status |
|-------|-------|-------------|--------|
| Research Points icon | ðŸ”¬ | â€” (emoji OK) | â¬œ |
| Active research spinner / animation | â€” | `assets/images/research/researching.gif` | â¬œ |
| Tech unlocked badge | âœ… | â€” (emoji OK) | â¬œ |

---

## 10. Player Skill Icons

12 skills â€” all already have emoji fallbacks assigned in `entities/Player.js`. These could be upgraded to custom icons for the Skills panel.

| Skill | Current Emoji | Custom Icon File | Status |
|-------|--------------|-----------------|--------|
| Attack | âš”ï¸ | `assets/images/skills/attack.png` | â¬œ |
| Defense | ðŸ›¡ï¸ | `assets/images/skills/defense.png` | â¬œ |
| Aim | ðŸŽ¯ | `assets/images/skills/aim.png` | â¬œ |
| Luck | ðŸ€ | `assets/images/skills/luck.png` | â¬œ |
| Critical Damage | ðŸ’¥ | `assets/images/skills/critical_damage.png` | â¬œ |
| Critical Chance | ðŸŽ² | `assets/images/skills/critical_chance.png` | â¬œ |
| Block | ðŸª– | `assets/images/skills/block.png` | â¬œ |
| Parry | ðŸ—¡ï¸ | `assets/images/skills/parry.png` | â¬œ |
| Energy | âš¡ | `assets/images/skills/energy.png` | â¬œ |
| Intuition | ðŸ§  | `assets/images/skills/intuition.png` | â¬œ |
| Taxation | ðŸ’° | `assets/images/skills/taxation.png` | â¬œ |
| Diplomacy | ðŸ¤ | `assets/images/skills/diplomacy.png` | â¬œ |

### Leveling / Prestige UI
| Asset | Description | Status |
|-------|-------------|--------|
| â¬œ | XP bar fill gradient (could be an image) | â¬œ |
| â¬œ | Level badge frame | â¬œ |
| â¬œ | Legendary prestige star / crown icon | `assets/images/skills/legendary_badge.png` | â¬œ |
| â¬œ | Skill point coin icon | `assets/images/skills/skill_point.png` | â¬œ |

---

## 11. Nation Stat Icons

Shown throughout the Nation Overview panel. Emojis are already in use â€” custom icons would be an upgrade.

| Stat | Current Emoji | Custom Icon | Status |
|------|--------------|-------------|--------|
| Population | ðŸ‘¥ | â¬œ | â¬œ |
| GDP / Money | ðŸ’° | â¬œ | â¬œ |
| Military Strength | âš”ï¸ | â¬œ | â¬œ |
| Happiness | ðŸ˜Š | â¬œ | â¬œ |
| Land / Territory | ðŸ—ºï¸ | â¬œ | â¬œ |
| Infrastructure | ðŸ—ï¸ | â¬œ | â¬œ |
| Technology Level | ðŸ’¡ | â¬œ | â¬œ |
| Stability | âš–ï¸ | â¬œ | â¬œ |
| Reputation | â­ | â¬œ | â¬œ |
| Pollution | ðŸŒ«ï¸ | â¬œ | â¬œ |
| Disease Rate | ðŸ¦  | â¬œ | â¬œ |
| Crime Rate | ðŸ”« | â¬œ | â¬œ |
| Literacy Rate | ðŸ“– | â¬œ | â¬œ |
| Environment Quality | ðŸŒ¿ | â¬œ | â¬œ |
| Tax Rate | ðŸ“‹ | â¬œ | â¬œ |
| Government type badge | varies | `assets/images/governments/[gov_id].png` | â¬œ |
| Religion type badge | varies | `assets/images/religions/[religion_id].png` | â¬œ |

---

## 12. Diplomacy & Alliance Icons

| Asset | Emoji | Custom File | Status |
|-------|-------|-------------|--------|
| Friend relationship | ðŸ‘ | `assets/images/diplomacy/friend.png` | â¬œ |
| Foe relationship | ðŸ‘Ž | `assets/images/diplomacy/foe.png` | â¬œ |
| Best Friend relationship | ðŸ’› | `assets/images/diplomacy/best_friend.png` | â¬œ |
| Nemesis relationship | ðŸ’¢ | `assets/images/diplomacy/nemesis.png` | â¬œ |
| Neutral / No relation | ðŸ˜ | â€” (emoji OK) | â¬œ |
| Alliance member badge | ðŸ›¡ï¸ | `assets/images/diplomacy/alliance_member.png` | â¬œ |
| Alliance leader badge | ðŸ‘‘ | `assets/images/diplomacy/alliance_leader.png` | â¬œ |
| Trade agreement icon | ðŸ¤ | â€” (emoji OK) | â¬œ |
| Treaty icon | ðŸ“œ | â€” (emoji OK) | â¬œ |
| Foreign aid (money) icon | ðŸ’¸ | â€” (emoji OK) | â¬œ |
| Foreign aid (tech) icon | ðŸ”¬ | â€” (emoji OK) | â¬œ |
| War declaration icon | ðŸ“£ | â€” (emoji OK) | â¬œ |
| Peace treaty icon | ðŸ•Šï¸ | â€” (emoji OK) | â¬œ |
| Intelligence Pact icon | ðŸ•µï¸ | â€” (emoji OK) | â¬œ |
| World Forum / Congress hall | ðŸ›ï¸ | `assets/images/diplomacy/world_forum.png` | â¬œ |
| Vote "Yes" | âœ… | â€” (emoji OK) | â¬œ |
| Vote "No" | âŒ | â€” (emoji OK) | â¬œ |

---

## 13. Sports Icons

3 sports with full team management, tournaments, and gambling.

| Asset | Emoji | Custom Icon File | Status |
|-------|-------|-------------|--------|
| Basketball (sport icon) | ðŸ€ | `assets/images/sports/basketball.png` | â¬œ ðŸŽ¯ |
| Hockey (sport icon) | ðŸ’ | `assets/images/sports/hockey.png` | â¬œ ðŸŽ¯ |
| Soccer (sport icon) | âš½ | `assets/images/sports/soccer.png` | â¬œ ðŸŽ¯ |
| Team Trophy / Championship | ðŸ† | `assets/images/sports/trophy.png` | â¬œ |
| League Standings icon | ðŸ“Š | â€” (emoji OK) | â¬œ |
| Player card background | â€” | `assets/images/sports/player_card_bg.png` | â¬œ |
| Injured player icon | ðŸ©¹ | â€” (emoji OK) | â¬œ |
| Youth Academy icon | ðŸ§’ | â€” (emoji OK) | â¬œ |
| Betting / Odds icon | ðŸŽ² | â€” (emoji OK) | â¬œ |
| Match in progress indicator | â±ï¸ | â€” (emoji OK) | â¬œ |
| Stadium capacity icon | ðŸŸï¸ | `assets/images/sports/stadium.png` | â¬œ |

---

## 14. Disease Icons

Used in the Health panel, disease popups, and news feed.

| Asset | Emoji | Custom Icon File | Status |
|-------|-------|-------------|--------|
| Minor disease indicator | ðŸ¤§ | `assets/images/health/disease_minor.png` | â¬œ |
| Major disease indicator | ðŸ¤’ | `assets/images/health/disease_major.png` | â¬œ |
| Catastrophic disease / pandemic | ðŸ’€ | `assets/images/health/disease_catastrophic.png` | â¬œ |
| Global disease / pandemic (World Forum) | ðŸŒ¡ï¸ | `assets/images/health/global_disease.png` | â¬œ |
| Disease cured badge | âœ… | â€” (emoji OK) | â¬œ |
| Healthcare spending icon | ðŸ’Š | â€” (emoji OK) | â¬œ |
| Quarantine icon | ðŸ”’ | â€” (emoji OK) | â¬œ |

---

## 15. Event Icons

Random events fire throughout the game across multiple categories.

| Event Category | Emoji | Custom Icon File | Status |
|----------------|-------|-------------|--------|
| Economic event (positive) | ðŸ“ˆ | â€” (emoji OK) | â¬œ |
| Economic event (negative) | ðŸ“‰ | â€” (emoji OK) | â¬œ |
| Technological breakthrough | ðŸ’¡ | â€” (emoji OK) | â¬œ |
| Natural disaster | ðŸŒªï¸ | `assets/images/events/natural_disaster.png` | â¬œ |
| Political event | ðŸ—³ï¸ | â€” (emoji OK) | â¬œ |
| Military event | âš”ï¸ | â€” (emoji OK) | â¬œ |
| Cultural event | ðŸŽ­ | â€” (emoji OK) | â¬œ |
| Religious event / demand | ðŸ› | â€” (emoji OK) | â¬œ |
| Government demand | ðŸ“£ | â€” (emoji OK) | â¬œ |
| Population event | ðŸ‘¶ | â€” (emoji OK) | â¬œ |
| Resource discovery | ðŸ’Ž | â€” (emoji OK) | â¬œ |
| Environmental event | ðŸŒ¿ | â€” (emoji OK) | â¬œ |
| Generic news icon | ðŸ“° | â€” (emoji OK) | â¬œ |
| Event notification bell | ðŸ”” | `assets/images/ui/notification_bell.png` | â¬œ |

---

## 16. UI / Menu Icons & Buttons

### Bottom Navigation Bar Tabs (currently emoji-based)
| Tab | Current Emoji | Custom Icon File | Status |
|-----|--------------|-----------------|--------|
| Nation | ðŸ›ï¸ | `assets/images/ui/tab_nation.png` | â¬œ ðŸŽ¯ |
| Build | ðŸ—ï¸ | `assets/images/ui/tab_build.png` | â¬œ ðŸŽ¯ |
| Military | âš”ï¸ | `assets/images/ui/tab_military.png` | â¬œ ðŸŽ¯ |
| Research | ðŸ”¬ | `assets/images/ui/tab_research.png` | â¬œ ðŸŽ¯ |
| Health | ðŸ¥ | `assets/images/ui/tab_health.png` | â¬œ ðŸŽ¯ |
| Diplomacy | ðŸ¤ | `assets/images/ui/tab_diplomacy.png` | â¬œ ðŸŽ¯ |
| Alliance | ðŸ›¡ï¸ | `assets/images/ui/tab_alliance.png` | â¬œ ðŸŽ¯ |
| Team (Sports) | ðŸ† | `assets/images/ui/tab_team.png` | â¬œ ðŸŽ¯ |
| Economy / Trade | ðŸ’¹ | `assets/images/ui/tab_economy.png` | â¬œ ðŸŽ¯ |
| World Forum | ðŸŒ | `assets/images/ui/tab_world.png` | â¬œ ðŸŽ¯ |
| News | ðŸ“° | `assets/images/ui/tab_news.png` | â¬œ ðŸŽ¯ |
| Chat | ðŸ’¬ | `assets/images/ui/tab_chat.png` | â¬œ ðŸŽ¯ |
| Settings | âš™ï¸ | `assets/images/ui/tab_settings.png` | â¬œ ðŸŽ¯ |

### Map Controls
| Button | Current | Custom File | Status |
|--------|---------|-------------|--------|
| Zoom In (+) | text | â€” (CSS only OK) | â¬œ |
| Zoom Out (-) | text | â€” (CSS only OK) | â¬œ |
| Center map | ðŸŽ¯ | â€” (emoji OK) | â¬œ |
| Toggle Grid | âŠž | â€” (emoji OK) | â¬œ |
| Toggle Resources | ðŸ’Ž | â€” (emoji OK) | â¬œ |

### General UI
| Asset | Description | Status |
|-------|-------------|--------|
| â¬œ | Game logo / wordmark (Dominion Wars) | `assets/images/ui/logo.png` | â¬œ ðŸŽ¯ |
| â¬œ | Nav bar background texture | `assets/images/ui/nav_bg.png` | â¬œ |
| â¬œ | Panel header background | `assets/images/ui/panel_header.png` | â¬œ |
| â¬œ | Loading screen background | `assets/images/ui/loading_bg.png` | â¬œ ðŸŽ¯ |
| â¬œ | Favicon / window icon | `assets/images/ui/favicon.ico` | â¬œ ðŸŽ¯ |
| â¬œ | Save icon | ðŸ’¾ â€” (emoji OK) | â¬œ |
| â¬œ | Bug report icon | ðŸ› â€” (emoji OK) | â¬œ |
| â¬œ | Close / X button | â€” (CSS only OK) | â¬œ |
| â¬œ | Hamburger menu icon | â˜° â€” (emoji OK) | â¬œ |

---

## 17. Map & Terrain Icons

Shown on the game map canvas tiles.

| Terrain Type | Emoji | Custom Tile | Status |
|--------------|-------|-------------|--------|
| Claimed Territory (player) | ðŸŸ¦ | map tile color | â¬œ |
| Unclaimed Territory | â¬œ | map tile texture | â¬œ |
| Rival Territory | ðŸŸ¥ | map tile color | â¬œ |
| Capital City marker | â­ | `assets/images/map/capital_marker.png` | â¬œ ðŸŽ¯ |
| City marker | ðŸ™ï¸ | `assets/images/map/city_marker.png` | â¬œ ðŸŽ¯ |
| Resource deposit icon (generic) | ðŸ’Ž | `assets/images/map/resource_marker.png` | â¬œ |
| Port tile indicator | âš“ | â€” (emoji overlay OK) | â¬œ |
| Military base indicator | ðŸŽ–ï¸ | â€” (emoji overlay OK) | â¬œ |
| War zone indicator | âš”ï¸ | `assets/images/map/war_zone.png` | â¬œ |
| Alliance territory border | â€” | color overlay | â¬œ |

---


---

## 4b. Misses — Brick Throw Assets (in use)

These 22 color-named PNG files live in `assets/images/Misses/` and are **already in use**.
`throwBrick()` in `WarPanel.js` randomly picks one each time a missile or nuke is intercepted
and flings it across the screen as an animated image.

| File | Color | Status |
|------|-------|--------|
| `assets/images/Misses/black.png` | Black brick | ✅ In use |
| `assets/images/Misses/blue.png` | Blue brick | ✅ In use |
| `assets/images/Misses/d-gold.png` | Dark gold brick | ✅ In use |
| `assets/images/Misses/d-orange.png` | Dark orange brick | ✅ In use |
| `assets/images/Misses/d-pink.png` | Dark pink brick | ✅ In use |
| `assets/images/Misses/d-sky.png` | Dark sky brick | ✅ In use |
| `assets/images/Misses/forest.png` | Forest green brick | ✅ In use |
| `assets/images/Misses/gold.png` | Gold brick | ✅ In use |
| `assets/images/Misses/green.png` | Green brick | ✅ In use |
| `assets/images/Misses/grey.png` | Grey brick | ✅ In use |
| `assets/images/Misses/l-blue.png` | Light blue brick | ✅ In use |
| `assets/images/Misses/l-grey.png` | Light grey brick | ✅ In use |
| `assets/images/Misses/l-pink.png` | Light pink brick | ✅ In use |
| `assets/images/Misses/l-red.png` | Light red brick | ✅ In use |
| `assets/images/Misses/l-sky.png` | Light sky brick | ✅ In use |
| `assets/images/Misses/lime.png` | Lime brick | ✅ In use |
| `assets/images/Misses/orange.png` | Orange brick | ✅ In use |
| `assets/images/Misses/pink.png` | Pink brick | ✅ In use |
| `assets/images/Misses/red.png` | Red brick | ✅ In use |
| `assets/images/Misses/sky.png` | Sky blue brick | ✅ In use |
| `assets/images/Misses/white.png` | White brick | ✅ In use |
| `assets/images/Misses/yellow.png` | Yellow brick | ✅ In use |

> **How it works:** `throwBrick(type)` picks a random filename from the 22-item array,
> creates a `<img>` at a random left-edge position, and animates it diagonally off the
> right side of the screen with rotation. Missile bricks are 50–80 px; nuke bricks are
> 80–120 px with a higher/faster arc. The element removes itself on `animationend`.
> `pointer-events: none` so it never blocks clicks.

## 18. Flag Designer Assets

The flag system has 50+ patterns and 100+ symbols per the docs. Custom SVG/PNG assets are needed for the flag designer.

| Asset Category | Count Needed | Folder | Status |
|----------------|-------------|--------|--------|
| Flag background patterns | 50+ | `assets/images/flags/patterns/` | â¬œ ðŸŽ¯ |
| Flag symbols / emblems | 100+ | `assets/images/flags/symbols/` | â¬œ ðŸŽ¯ |
| Flag overlay borders/stripes | ~20 | `assets/images/flags/overlays/` | â¬œ |
| Default/blank flag canvas | 1 | `assets/images/flags/blank.png` | â¬œ |
| Preview frame (flag display) | 1 | `assets/images/flags/frame.png` | â¬œ |

> ðŸ’¡ **Tip:** Flag symbols can largely be sourced from open-source heraldry SVG libraries (see Section 21). Many governments and nations use charges like eagles, lions, stars, crescents, wheels, etc.

---

## 19. Sound Effects

The `assets/sounds/` directory is **empty**. These sounds are needed for a polished feel.

### UI Interaction Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Button click (generic) | Any button press | `assets/sounds/ui/click.mp3` | â¬œ ðŸŽ¯ |
| Tab switch | Switching bottom tabs | `assets/sounds/ui/tab_switch.mp3` | â¬œ |
| Popup open | Panel opening | `assets/sounds/ui/popup_open.mp3` | â¬œ |
| Popup close | Panel closing | `assets/sounds/ui/popup_close.mp3` | â¬œ |
| Notification / alert | Event fires | `assets/sounds/ui/notification.mp3` | â¬œ ðŸŽ¯ |
| Error / denied | Can't afford, blocked | `assets/sounds/ui/error.mp3` | â¬œ |
| Save game | Save button | `assets/sounds/ui/save.mp3` | â¬œ |
| Settings toggle | Toggle switch | `assets/sounds/ui/toggle.mp3` | â¬œ |

### Nation & Building Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Building constructed | Improvement/project built | `assets/sounds/game/build_complete.mp3` | â¬œ ðŸŽ¯ |
| Building demolished | Demolish action | `assets/sounds/game/demolish.mp3` | â¬œ |
| Wonder completed | Wonder built | `assets/sounds/game/wonder_complete.mp3` | â¬œ ðŸŽ¯ |
| Research complete | Tech researched | `assets/sounds/game/research_complete.mp3` | â¬œ ðŸŽ¯ |
| Level up (player) | Player gains a level | `assets/sounds/game/level_up.mp3` | â¬œ ðŸŽ¯ |
| Legendary prestige | Go Legendary triggered | `assets/sounds/game/legendary.mp3` | â¬œ |
| New day / turn | Game day advances | `assets/sounds/game/day_tick.mp3` | â¬œ |
| Nation founded | First nation creation | `assets/sounds/game/nation_created.mp3` | â¬œ |
| Population milestone | Pop hit threshold | `assets/sounds/game/milestone.mp3` | â¬œ |

### Military & War Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Train soldiers | Soldiers recruited | `assets/sounds/military/troops_march.mp3` | â¬œ |
| Tank purchased | Tanks bought | `assets/sounds/military/tank_engine.mp3` | â¬œ |
| Aircraft purchased | Aircraft bought | `assets/sounds/military/jet_flyby.mp3` | â¬œ |
| Ship purchased | Ships bought | `assets/sounds/military/ship_horn.mp3` | â¬œ |
| War declared | War declaration | `assets/sounds/military/war_declared.mp3` | â¬œ ðŸŽ¯ |
| Battle won | Victory in combat | `assets/sounds/military/victory.mp3` | â¬œ ðŸŽ¯ |
| Battle lost | Defeat in combat | `assets/sounds/military/defeat.mp3` | â¬œ |
| Missile launched | Missile fired | `assets/sounds/military/missile_launch.mp3` | â¬œ |
| Missile intercepted — brick throw | 🧱 image | `throwBrick('missile')` — random PNG from `assets/images/Misses/` (22 colors), 50–80px, flies across screen | ✅ |
| Nuke intercepted — brick throw | 🧱 image | `throwBrick('nuke')` — same 22-color Misses pool, 80–120px, bigger/faster arc | ✅ |
| Nuclear launch | Nuke fired | `assets/sounds/military/nuke_launch.mp3` | â¬œ ðŸŽ¯ |
| Spy deployed | Spy sent on mission | `assets/sounds/military/spy_deploy.mp3` | â¬œ |

### Diplomacy Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Treaty signed | Diplomatic agreement | `assets/sounds/diplomacy/treaty_signed.mp3` | â¬œ |
| Trade agreed | Trade deal accepted | `assets/sounds/diplomacy/handshake.mp3` | â¬œ |
| Message received | Chat / diplomatic msg | `assets/sounds/diplomacy/message.mp3` | â¬œ ðŸŽ¯ |
| Alliance formed | Joined/created alliance | `assets/sounds/diplomacy/alliance_formed.mp3` | â¬œ |

### Event Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Positive event | Happy random event | `assets/sounds/events/positive_event.mp3` | â¬œ |
| Negative event | Bad random event | `assets/sounds/events/negative_event.mp3` | â¬œ |
| Natural disaster | Disaster event | `assets/sounds/events/disaster.mp3` | â¬œ |
| Disease outbreak | Disease event | `assets/sounds/events/disease_outbreak.mp3` | â¬œ |
| Government demand | Citizens demand change | `assets/sounds/events/crowd_chanting.mp3` | â¬œ |

### Sports Sounds
| Sound | Trigger | Suggested File | Status |
|-------|---------|----------------|--------|
| Match start whistle | Game begins | `assets/sounds/sports/whistle_start.mp3` | â¬œ |
| Goal / Score | Score event | `assets/sounds/sports/crowd_goal.mp3` | â¬œ |
| Final whistle | Match ends | `assets/sounds/sports/whistle_end.mp3` | â¬œ |
| Tournament win | Championship won | `assets/sounds/sports/crowd_cheer.mp3` | â¬œ |
| Bet won | Successful bet | `assets/sounds/sports/cash_register.mp3` | â¬œ |
| Bet lost | Failed bet | `assets/sounds/sports/negative_ding.mp3` | â¬œ |

---

## 20. Background Music / Ambient

| Track | Context | Suggested File | Status |
|-------|---------|----------------|--------|
| Main theme / menu music | Title / login screen | `assets/sounds/music/main_theme.mp3` | â¬œ ðŸŽ¯ |
| Peaceful gameplay loop | Standard play, no war | `assets/sounds/music/peaceful_loop.mp3` | â¬œ |
| War / tension loop | Active war state | `assets/sounds/music/war_loop.mp3` | â¬œ |
| Victory fanfare (short) | Win a war | `assets/sounds/music/victory_fanfare.mp3` | â¬œ |
| Diplomatic theme | World Forum / diplomacy | `assets/sounds/music/diplomacy_theme.mp3` | â¬œ |
| Research / science theme | Research panel open | `assets/sounds/music/research_theme.mp3` | â¬œ |
| Sports arena ambience | Sports tab | `assets/sounds/music/sports_arena.mp3` | â¬œ |

> ðŸ’¡ For royalty-free looping game music see Section 21.

---

## 21. Where to Find Free Assets

### ðŸ–¼ï¸ Icons & Images

| Source | Type | License | URL |
|--------|------|---------|-----|
| **Game-icons.net** | 4000+ game icons (SVG/PNG) | CC BY 3.0 (attribution) | https://game-icons.net |
| **Flaticon** | UI icons, emoji sets | Free plan available (attribution) | https://flaticon.com |
| **OpenMoji** | Open-source emoji set | CC BY SA 4.0 | https://openmoji.org |
| **Twemoji (Twitter)** | Emoji as SVG/PNG | CC BY 4.0 | https://github.com/twitter/twemoji |
| **Heroicons** | Clean UI icons (SVG) | MIT | https://heroicons.com |
| **Tabler Icons** | 4000+ open source icons | MIT | https://tabler.io/icons |
| **Wikimedia Commons** | Heraldry, flags, symbols | Varies (check each) | https://commons.wikimedia.org |
| **Openclipart** | Vector clip art | CC0 (public domain) | https://openclipart.org |
| **SVGRepo** | SVG icons & illustrations | Various (many MIT/CC0) | https://svgrepo.com |

### ðŸ›ï¸ Heraldry / Flag Symbols Specifically

| Source | Notes | URL |
|--------|-------|-----|
| **FOTW (Flags of the World)** | Flag design reference and images | https://www.crwflags.com/fotw/ |
| **FlagMaker** | Flag pattern templates and SVGs | https://flagmaker-print.com |
| **Heraldicon** | Open-source heraldic charges (SVG) | https://heraldicon.org |
| **Open Heraldry** | CC0 heraldic charges SVG collection | https://openheraldry.com |

### ðŸŽµ Sound Effects

| Source | Type | License | URL |
|--------|------|---------|-----|
| **Freesound.org** | Huge community SFX library | CC licenses (varies per sound) | https://freesound.org |
| **Zapsplat** | Professional SFX library | Free with attribution | https://zapsplat.com |
| **Mixkit** | Free sound effects | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/ |
| **SoundBible** | Free sounds | CC / Attribution | https://soundbible.com |
| **BBC Sound Effects** | Massive archive | RemArc licence (non-commercial) | https://sound-effects.bbcrewind.co.uk |

### ðŸŽµ Background Music (Loops)

| Source | Type | License | URL |
|--------|------|---------|-----|
| **OpenGameArt.org** | Game music loops (many 8-bit/epic) | CC / GPL | https://opengameart.org |
| **Pixabay Music** | Royalty-free tracks | Pixabay License (free commercial) | https://pixabay.com/music/ |
| **Free Music Archive** | Curated free music | Varies (CC filters available) | https://freemusicarchive.org |
| **Incompetech (Kevin MacLeod)** | Orchestral/epic loops | CC BY 4.0 (just credit) | https://incompetech.com |
| **Musopen** | Classical / orchestral | CC0 (public domain recordings) | https://musopen.org |

### ðŸŽ¨ AI Image Generation (for custom icons)

| Tool | Notes | URL |
|------|-------|-----|
| **DALL-E 3** | Great for consistent icon style sets | https://openai.com |
| **Stable Diffusion** | Open source, run locally | https://stability.ai |
| **Midjourney** | High quality, subscription | https://midjourney.com |
| **Adobe Firefly** | Good for transparent-bg icons | https://firefly.adobe.com |

> ðŸ’¡ **Pro tip for AI icons:** Give the same style prompt to every generation, e.g., *"flat vector icon, medieval fantasy style, dark outline, transparent background, 512x512"* â€” this keeps all your government/religion/building icons visually consistent.

---

## Summary Stats

| Category | Total Assets Needed | âœ… Complete | â¬œ Remaining |
|----------|--------------------|---------:|----------:|
| Faction color flags | 10 | 10 | 0 |
| Government icons | 12 | 12 | 0 |
| Religion icons | 12 | 0 | 12 |
| Military unit icons | 7 | 7 | 0 |
| Resource icons | 18 | 0 | 18 |
| Building icons | 18 | 0 | 18 |
| Project icons | 26 | 0 | 26 |
| Wonder icons | 24 | 0 | 24 |
| Research icons | 11 | 0 | 11 |
| Skill icons | 12 | 0 | 12 |
| Diplomacy icons | 16 | 0 | 16 |
| Sports icons | 11 | 0 | 11 |
| Disease icons | 7 | 0 | 7 |
| Event icons | 14 | 0 | 14 |
| UI / menu icons | ~20 | 0 | ~20 |
| Map markers | 10 | 0 | 10 |
| Flag designer assets | 170+ | 0 | 170+ |
| **Sound effects** | **~50** | **0** | **~50** |
| **Background music** | **7** | **0** | **7** |
| **TOTAL** | **~455** | **10** | **~445** |

> ðŸŽ¯ **Priority order recommendation:**  
> 1. Game logo + favicon (identity)  
> 2. Bottom tab icons (most visible UI)  
> 3. Government + Religion icons (unique to this game, used everywhere)  
> 4. Military unit icons (used constantly)  
> 5. Resource icons (used in every cost/income display)  
> 6. Basic sound effects (click, notify, build, level up)  
> 7. Stadium + Wonder icons (high prestige items)  
> 8. Background music loops  
> 9. Flag designer symbol library  
> 10. Everything else  

