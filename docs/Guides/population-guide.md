# Population Guide

Everything you need to know about managing your nation's population. Citizens age in real time, pay taxes, can serve in the military, and eventually pass away. Your population grows or shrinks based on how well you manage happiness, disease, pollution, environment, crime, and the economy.

---

## Table of Contents

1. [How Population Works](#how-population-works)
2. [Age Groups & Life Cycle](#age-groups--life-cycle)
3. [Who Pays Taxes?](#who-pays-taxes)
4. [Military & Citizens](#military--citizens)
5. [Population Growth & Deaths](#population-growth--deaths)
6. [Migration](#migration)
7. [Population Situations](#population-situations)
8. [Tracking Population Stats](#tracking-population-stats)
9. [Tips & Strategy](#tips--strategy)

---

## How Population Works

Each citizen is an individual with a real-time birth timestamp. They age by actual days passing (wall-clock time), not game turns. Citizens progress through age groups from Newborn to Elderly — there is **no hard age cap**. Citizens of any age can die based on probability, with elderly citizens gaining extra death chance as they grow older.

When a citizen dies of old age, a replacement newborn is scheduled after a **2-turn buffer**, so your population doesn't instantly collapse when citizens pass away.

Your total population is the sum of all citizens across every age group. You can view it anytime in the population overview.

---

## Age Groups & Life Cycle

Citizens progress through these stages as they age:

| Stage | Days Since Birth | Pays Taxes? | Can Serve Military? | Can Work? |
|-------|-----------------|-------------|---------------------|-----------|
| Newborn | 0–5 | ❌ No | ❌ No | ❌ No |
| Infant | 5–12 | ❌ No | ❌ No | ❌ No |
| Toddler | 12–20 | ❌ No | ❌ No | ❌ No |
| Child | 20–35 | ❌ No | ❌ No | ❌ No |
| Teen | 35–105 | ✅ Yes | ✅ Yes | ✅ Yes |
| Young Adult | 105–175 | ✅ Yes | ✅ Yes | ✅ Yes |
| Adult | 175–245 | ✅ Yes | ✅ Yes | ✅ Yes |
| Middle Aged | 245–315 | ✅ Yes | ✅ Yes | ✅ Yes |
| Older | 315–335 | ✅ Yes | ✅ Yes | ✅ Yes |
| Senior | 335–355 | ❌ No | ❌ No | ❌ Retired |
| Elderly | 355+ | ❌ No | ❌ No | ❌ Retired |

**Key transitions:**
- **Newborn → Teen:** ~35 days (this is when they start paying taxes and can serve)
- **Teen → Senior:** ~300 days (~10 months)
- **Senior → Elderly:** ~20 days (~3 weeks)
- **Elderly:** No upper limit — probability-based death with increasing frailty

**Elderly frailty:** Once a citizen passes 375 days of age, they gain an extra 0.1% death chance per 3 days beyond that, capped at 5% extra. When an elderly citizen dies naturally, there's a chance one additional elderly citizen dies from age-related frailty at the same time.

Seniors and Elderly do not pay taxes and cannot serve in the military. They are dependents supported by the working population.

---

## Who Pays Taxes?

**Only Teen through Older citizens pay taxes.** This is your taxable population.

- Newborns, Infants, Toddlers, and Children pay nothing.
- Seniors and Elderly pay nothing.

Your turn revenue scales with your taxable population. A nation with lots of children and seniors but few working-age adults will generate less tax income even if the total population is high.

Keep an eye on your **taxable ratio** — the percentage of your total population that pays taxes. If this drops too low, your economy will struggle even with high total population.

---

## Military & Citizens

**Only Teen through Older citizens can serve in the military.** Children and below, plus Seniors and Elderly, cannot serve.

### Citizens Keep Their Jobs When They Serve

When you purchase military units (soldiers, tanks, aircraft, ships), citizens are **NOT removed** from the population. Instead, specific citizens are marked as military (`isMilitary = true`) and tied to that unit type (`unitType`). They keep their jobs, relationships, and everything else — they just wear a military flag.

Each unit = 1 citizen tied to that unit.

### Unit Losses Kill Citizens

When military units are destroyed in combat:

1. Citizens marked as military with matching unit type are killed first (e.g., dead tank → kills tank citizens first).
2. If there aren't enough military citizens of that type, non-military citizens from appropriate demographics are killed (tanks/aircraft/ships pull from Adult/MiddleAged/Older/YoungAdult/Teen first).
3. Each death notifies the Citizen Ties System so spouses become widowed/widowered (family roles like Mother/Father/Son/Daughter are preserved).
4. Citizens removed this way are permanently gone from your population — this is the **only** path (besides old age) that removes citizens.

### Veterans

When a military citizen reaches Senior age, they become a veteran:
- Their unit count is decremented (the military unit is decommissioned).
- They remain in the population as `isVeteran = true`, `isMilitary = false`.
- They keep their job and family ties.

### Draft Penalty

If more than **50%** of your military-eligible population is drafted into military units, your population growth rate is cut in **half**. You'll see a "Military Penalty Active" warning in the population overview.

**Strategy:** Don't over-draft. If you need a large military, balance it with population growth or your nation will shrink over time.

---

## Population Growth & Deaths

Your population grows or shrinks every day based on national conditions:

### Births

Births happen when conditions support positive growth. The daily birth rate is modified by:

| Condition | Good for Growth | Bad for Growth |
|-----------|----------------|----------------|
| Happiness | High (>70) | Low (<40) |
| Disease | Low | High |
| Pollution | Low | High |
| Environment | High | Low |

Each condition factor can add up to **25% extra death chance** (combined capped at 25% total).

### Deaths

Natural deaths always happen — they scale with disease, pollution, crime, and low happiness. Old-age deaths happen through the aging system (with replacement births after 2 turns).

Deaths are skewed toward older age groups, with ~60% of natural deaths coming from the Elderly group.

| Condition | Low → High Death Impact | Max Extra |
|-----------|------------------------|-----------|
| Happiness | Lower = more deaths | +25% |
| Disease | Higher = more deaths | +25% |
| Pollution | Higher = more deaths | +25% |
| Crime | Higher = more deaths | +25% |

---

## Migration

People move in and out of your nation based on how attractive it is:

**Immigration increases when:**
- Happiness is high
- Literacy is high
- Technology is advanced
- Pollution is low
- Disease is low
- Crime is low

**Emigration increases when:** the opposite of the above.

You can set a migration policy:

| Policy | Effect |
|--------|--------|
| Open | Double migration effects |
| Balanced | Normal migration |
| Restricted | Half migration effects |

Immigrants are typically working-age adults. Emigrants are typically young adults and adults leaving your workforce. Emigration is tracked separately from deaths.

---

## Population Situations

Every 3 days, your nation may face a population situation — events like:

- **Housing Shortage Crisis**
- **Disease Outbreak**
- **Teacher Shortage**
- **Automation Displaces Workers**
- **Gang Violence Surge**
- **Air Pollution Spike**

Every 5 days a nation situation may trigger. Every 4 days a military situation may trigger.

Each situation gives you **3 choices** with different effects on happiness, money, literacy, crime, disease, pollution, environment, employment, and economy. Some effects are immediate; others last for a set number of days.

Choose wisely — the wrong decision can hurt your population growth for weeks.

---

## Tracking Population Stats

The system keeps running totals you can monitor:

| Stat | What It Tells You |
|------|-------------------|
| **Born** | Total citizens added (births + immigrants + replacements) |
| **Died** | Total citizens lost (old age, natural causes, combat) |
| **Enlisted** | Total citizens marked as military |
| **Died in Combat** | Military personnel and citizens lost in battle |
| **Reached Senior** | Total citizens who aged into senior status |
| **Emigrated** | Total citizens who left your nation |

These are cumulative — they only go up. Check them daily to spot trends. If "Died" is climbing faster than "Born," your nation is shrinking and you need to fix your stats.

---

## Tips & Strategy

### Early Game
- **Focus on happiness and environment first.** These have the biggest impact on birth rates.
- **Don't over-draft early.** You need Young Adults working to build your economy.
- **Keep pollution low.** High pollution suppresses growth and increases deaths.

### Mid Game
- **Watch your taxable ratio.** If children and seniors outnumber workers, raise the retirement age or encourage immigration of working-age adults.
- **Balance military size.** A large military is powerful, but over 50% draft cuts growth in half. Time your expansions when population is high.
- **Use migration policy strategically.** Open policy when you need workers; restricted when your population is stable.

### Late Game
- **Monitor the aging index.** If too many citizens are Senior/Elderly, your taxable base will collapse. Encourage births through happiness and family policies.
- **Combat deaths matter.** Losing citizens in war reduces your population permanently — they are not replaced except through natural growth.
- **Population situations become critical.** With a large population, a single situation can swing happiness by several points and affect growth for days.

### Warning Signs

| Sign | Meaning | Fix |
|------|---------|-----|
| "Military Penalty Active" | Over 50% of eligible population in military units | Reduce military size or wait for population to grow |
| Died > Born (rising) | Population shrinking | Improve happiness, reduce disease/pollution/crime |
| Low taxable population | Few workers paying taxes | Encourage working-age immigration, reduce child/senior ratio |
| High emigration | Citizens leaving | Fix happiness, crime, pollution, disease |

### Quick Reference
- **Teenage citizens** = your taxpayers AND your potential soldiers. Protect this group.
- **~35 real days** = newborn becomes a taxpayer and military-eligible.
- **No age cap** = Elderly citizens can live indefinitely but face rising death probability.
- **50% draft** = growth penalty threshold.
- **2 turns** = replacement buffer after old-age death.
- **Each unit = 1 citizen** = when a unit dies, a citizen dies too.
