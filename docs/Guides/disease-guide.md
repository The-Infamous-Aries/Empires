# Disease Guide

Everything you need to know about diseases, outbreaks, and keeping your nation healthy. Diseases can strike your population, hurt your economy, weaken your military, and spread to other nations. This guide explains how the disease system works and how to protect your empire.

---

## Table of Contents

1. [How Diseases Work](#how-diseases-work)
2. [Disease Severity Levels](#disease-severity-levels)
3. [National vs Global Diseases](#national-vs-global-diseases)
4. [What Diseases Affect](#what-diseases-affect)
5. [How Diseases Spread](#how-diseases-spread)
6. [Curing Diseases](#curing-diseases)
7. [Prevention Strategies](#prevention-strategies)
8. [Disease Stats & Monitoring](#disease-stats--monitoring)
9. [Tips & Strategy](#tips--strategy)

---

## How Diseases Work

Diseases are random events that can strike your nation at any time. The game checks for new outbreaks on a regular schedule:

- **Minor diseases:** Checked every 2 game ticks with a 5% base chance
- **Major diseases:** Checked every 12 game ticks with a 2% base chance
- **Global events:** Checked every tick with a 1% base chance

Your nation's condition affects how likely you are to get sick:

| Condition | Effect on Disease Chance |
|-----------|-------------------------|
| High pollution (>50) | Increases chance |
| High existing disease (>30) | Increases chance |
| Low happiness (<40) | Increases chance |
| High happiness (>70) | Decreases chance |

Keep your cities clean, your citizens happy, and your existing disease levels low to reduce outbreak risk.

---

## Disease Severity Levels

### Minor Diseases

Minor diseases affect **2 properties** with values ranging from **1 to 8**. They're less dangerous but still impactful.

**Example minor disease:**
```
Crimson Cough
Severity: Minor | Scope: National
Effects: Population -3, Disease +7
Cure: $100,000 | 24 hours | 5 research points
```

### Major Diseases

Major diseases affect **5 properties** with values ranging from **10 to 25**. They're much more dangerous and expensive to cure.

**Example major disease:**
```
Crimson Plague
Severity: Major | Scope: National
Effects: Crime +19, Taxable Income -19, Hospital Upkeep +23, Environment -24, Happiness -14
Cure: $2,000,000 | 120 hours | 50 research points
```

### Severe Diseases

Severe diseases have the same impact as major diseases (5 properties, values 10-25) but are even harder to cure.

---

## National vs Global Diseases

### National Diseases

National diseases affect **only your nation**. They start locally but can evolve into global diseases after **72 hours** if not cured.

### Global Diseases

Global diseases affect **multiple nations simultaneously**. When a global disease event triggers, approximately 70% of all nations get infected at once. Global diseases are more expensive to cure and require **global cooperation** (international coordination).

---

## What Diseases Affect

Diseases modify your nation's properties. Here's what each property means:

### Good Metrics (Negative Values Are Bad)

| Property | What It Means | Disease Effect |
|----------|--------------|----------------|
| **Happiness** | Citizen satisfaction | Falls = unhappier population |
| **Taxable Income** | Money available to tax | Falls = less tax revenue |
| **Population** | Number of citizens | Falls = population loss |
| **Military Strength** | Raw military power | Falls = weaker military |
| **Military Morale** | Troop effectiveness | Falls = worse combat performance |
| **Stability** | Government stability | Falls = more unrest |
| **Literacy** | Education level | Falls = less educated populace |
| **Environment** | Environmental quality | Falls = more pollution/dirt |

### Bad Metrics (Positive Values Are Bad)

| Property | What It Means | Disease Effect |
|----------|--------------|----------------|
| **Crime** | Criminal activity | Rises = more crime |
| **Disease** | Existing disease level | Rises = more sickness |
| **Pollution** | Environmental damage | Rises = more pollution |
| **Hospital Upkeep** | Cost to run hospitals | Rises = more expensive healthcare |

**Example:** If a disease gives you `Crime +5` and `Happiness -3`, your crime rate goes up by 5 and your happiness goes down by 3.

---

## How Diseases Spread

### Neighbor Spread

Active outbreaks can spread to neighboring nations:
- Each active outbreak has a **2% chance per tick** to spread to each neighboring nation
- Nations that already have the disease won't get it again
- This means diseases can chain across borders

### Evolution to Global

If a national disease isn't cured within **72 hours**, it can evolve into a **global disease**:
- The disease scope changes from national to global
- It applies to ALL nations that don't already have it
- This is how local problems become worldwide crises

### Global Events

Every tick, there's a chance for a spontaneous global disease event:
- Base chance: **1% per tick**
- Higher if global pollution is above 60
- Higher if global health (average happiness) is below 40
- When triggered, ~70% of nations get infected at once

---

## Curing Diseases

To cure a disease, you must meet its cure requirements:

| Requirement | Minor Disease | Major Disease | Global Disease |
|-------------|--------------|---------------|----------------|
| Money | $70K - $150K | $2M - $80M | $32M - $80M |
| Time | 15 - 34 hours | 110 - 200 hours | 410 - 600 hours |
| Research Points | 3 - 10 | 45 - 80 | 140 - 300 |
| Global Cooperation | No | No | Yes |

When you cure a disease:
- All negative effects are removed
- Your nation's properties return to normal
- The outbreak is removed from your active diseases
- If it was a global disease and no other nation has it, the global threat ends

---

## Prevention Strategies

### Keep Pollution Low

Pollution is one of the biggest drivers of disease chance:
- Build **Recycling Centers** to reduce pollution
- Build **Parks** and **Tree Plantations** to improve environment
- Avoid overbuilding polluting industries
- Higher pollution = much higher disease risk

### Keep Citizens Happy

Happy nations resist disease better:
- Happiness above 70 reduces disease chance
- Build **Casinos** (but balance with Police Stations for crime)
- Build **Parks** for happiness boosts
- Maintain good **Hospital** coverage
- Keep crime and disease levels low

### Maintain Healthcare Infrastructure

Hospitals help both prevent and cure diseases:
- **Hospitals** reduce disease rate
- **Ambulance Hubs** provide additional disease reduction
- **Advanced Medical Hubs** give even stronger disease protection
- Higher hospital coverage = lower base disease rate

### Monitor Your Nation

Check your disease status regularly:
- Watch your pollution levels
- Track your happiness
- Monitor existing disease levels
- Cure diseases quickly before they evolve to global

---

## Disease Stats & Monitoring

Use the disease system to track:

- **Total diseases:** How many disease types exist in the game
- **Active outbreaks:** How many diseases your nation currently has
- **Global outbreaks:** How many diseases are spreading worldwide
- **By category:** Breakdown of national minor, national major, global minor, global major

Check these regularly to know when you're at risk.

---

## Tips & Strategy

### Early Game
- **Build Hospitals early** — disease protection is cheaper than cures
- **Don't overbuild polluting industries** — balance growth with environment
- **Keep happiness above 70** — this significantly reduces disease chance
- **Have emergency funds** — disease cures can be expensive

### Mid Game
- **Recycling Centers** are essential — they reduce both pollution and disease chance
- **Advanced Medical Hubs** provide strong disease resistance
- **Cure diseases immediately** — don't let them evolve to global (72-hour timer)
- **Research disease cures** — having research points ready saves time

### Late Game
- **Global diseases are expensive** — $32M-$80M to cure
- **International cooperation matters** — global diseases need global cooperation
- **Monitor global metrics** — if world pollution is high, expect more global events
- **Stockpile research points** — you'll need them for major cures

### Emergency Situations
- If a major disease hits, cure it **immediately** — the costs only go up over time
- If a disease evolves to global, it affects everyone — coordinate with other nations
- If multiple diseases hit at once, prioritize the ones affecting your economy (taxable income) and military (strength/morale)

---

## Quick Reference

| Question | Answer |
|----------|--------|
| How often are diseases checked? | Every game tick (1 minute real time) |
| What increases disease chance? | High pollution, high existing disease, low happiness |
| What decreases disease chance? | High happiness (>70) |
| Can diseases spread to neighbors? | Yes, 2% chance per tick per neighbor |
| Do diseases evolve? | Yes, national diseases become global after 72 hours |
| Can global diseases affect everyone? | Yes, ~70% of nations when triggered |
| How much does it cost to cure? | Minor: $70K-$150K; Major: $2M-$80M; Global: $32M-$80M |
| Do I need research points to cure? | Yes, varies by disease severity |
| What happens if I don't cure? | Effects persist, disease may evolve to global |

---

## Final Advice

**Prevention is cheaper than cure.** A few Hospitals and Recycling Centers cost far less than curing a major disease outbreak. Keep your nation clean, happy, and healthy, and diseases will be a rare nuisance rather than a civilization-ending catastrophe.

Good luck, and stay healthy!
