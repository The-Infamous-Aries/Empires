# Population Guide

Everything you need to know about managing your nation's population. Citizens age in real time, pay taxes, can be drafted into the military, and eventually pass away. Your population grows or shrinks based on how well you manage happiness, disease, pollution, environment, and the economy.

---

## Table of Contents

1. [How Population Works](#how-population-works)
2. [Age Groups & Life Cycle](#age-groups--life-cycle)
3. [Who Pays Taxes?](#who-pays-taxes)
4. [Military & Drafting](#military--drafting)
5. [Population Growth](#population-growth)
6. [Migration](#migration)
7. [Population Situations](#population-situations)
8. [Tracking Population Stats](#tracking-population-stats)
9. [Tips & Strategy](#tips--strategy)

---

## How Population Works

Each citizen is an individual with a real-time birth timestamp. They age by actual days passing (wall-clock time), not game turns. A newborn takes **14 real days** to become a Teen, and citizens live roughly **178 real days** total before dying of old age.

When a citizen dies of old age, a replacement newborn is scheduled after a **2-turn buffer**, so your population doesn't instantly collapse when citizens pass away.

Your total population is the sum of all citizens across every age group. You can view it anytime in the population overview.

---

## Age Groups & Life Cycle

Citizens progress through these stages as they age:

| Stage | Real Days | Pays Taxes? | Can Be Drafted? | Can Work? |
|-------|-----------|-------------|-----------------|-----------|
| Newborn | 0–3 | ❌ No | ❌ No | ❌ No |
| Infant | 3–7 | ❌ No | ❌ No | ❌ No |
| Toddler | 7–10 | ❌ No | ❌ No | ❌ No |
| Child | 10–14 | ❌ No | ❌ No | ❌ No |
| Teen | 14–45 | ✅ Yes | ✅ Yes | ✅ Yes |
| Young Adult | 45–75 | ✅ Yes | ✅ Yes | ✅ Yes |
| Adult | 75–100 | ✅ Yes | ✅ Yes | ✅ Yes |
| Middle Aged | 100–120 | ✅ Yes | ✅ Yes | ✅ Yes |
| Older | 120–134 | ✅ Yes | ✅ Yes | ✅ Yes |
| Senior | 134–164 | ❌ No | ❌ No | ❌ Retired |
| Elderly | 164–178 | ❌ No | ❌ No | ❌ Retired |

**Key transitions:**
- **Newborn → Teen:** 14 days (this is when they start paying taxes and can be drafted)
- **Teen → Senior:** ~120 days (~4 months)
- **Senior → Elderly:** ~30 days (~1 month)
- **Elderly → Death:** ~14 days (~2 weeks)

Seniors and Elderly do not pay taxes and cannot be drafted. They are dependents supported by the working population.

---

## Who Pays Taxes?

**Only Teen through Older citizens pay taxes.** This is your taxable population.

- Newborns, Infants, Toddlers, and Children pay nothing.
- Seniors and Elderly pay nothing.

Your turn revenue scales with your taxable population. A nation with lots of children and seniors but few working-age adults will generate less tax income even if the total population is high.

Keep an eye on your **taxable ratio** — the percentage of your total population that pays taxes. If this drops too low, your economy will struggle even with high total population.

---

## Military & Drafting

**Only Teen through Older citizens can be drafted into the military.** Children and below, plus Seniors and Elderly, cannot serve.

### Enlistment Order

When you buy military units, citizens are taken from your population in this exact order:

1. **Young Adult** (first)
2. **Adult**
3. **Middle Aged**
4. **Older**
5. **Teen** (last)

Young Adults are drafted first. Teens are the last resort. This means drafting heavily will deplete your young workforce first, which can hurt your economy.

### Military Draft Penalty

If more than **50%** of your military-eligible population is drafted, your population growth rate is cut in **half**. You'll see a "Military Penalty Active" warning in the population overview.

**Strategy:** Don't over-draft. If you need a large military, balance it with population growth or your nation will shrink over time.

---

## Population Growth

Your population grows or shrinks every day based on national conditions:

| Condition | Good for Growth | Bad for Growth |
|-----------|----------------|----------------|
| Happiness | High (>70) | Low (<40) |
| Disease | Low | High |
| Pollution | Low | High |
| Environment | High | Low |
| Taxable income | High taxable share | Low taxable share |
| Military draft | Under 50% | Over 50% (growth cut in half) |

**Thriving nation:** High happiness, clean environment, low disease/pollution, strong taxable base → population grows steadily.

**Neglected nation:** Low happiness, high disease/pollution, over-drafted military → population shrinks.

Natural deaths always happen (from disease, pollution, and old age), but births only occur when conditions support positive growth. If your stats are bad enough, deaths will outnumber births and your population will decline.

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

**Emigration increases when:**
- The opposite of the above

You can set a migration policy:
| Policy | Effect |
|--------|--------|
| Open | Double migration effects (more immigrants and emigrants) |
| Balanced | Normal migration |
| Restricted | Half migration effects (fewer people moving) |

Immigrants are typically working-age adults. Emigrants are typically young adults and adults leaving your workforce.

---

## Population Situations

Every 3 days, your nation may face a population situation — events like:

- **Housing Shortage Crisis** — Build public housing, relax zoning, or rent control
- **Disease Outbreak** — Quarantine, fund healthcare, or public health education
- **Teacher Shortage** — Raise salaries, alternative certification, or tech-assisted learning
- **Automation Displaces Workers** — Retraining, UBI pilot, or new industry
- **Gang Violence Surge** — Police presence, community outreach, or economic opportunities
- **Air Pollution Spike** — Emission controls, green transport, or relocate industry

Each situation gives you **3 choices** with different effects on happiness, money, literacy, crime, disease, pollution, environment, employment, and economy. Some effects are immediate; others last for a set number of days.

Situations expire after 7 days if you don't make a choice. Choose wisely — the wrong decision can hurt your population growth for weeks.

---

## Tracking Population Stats

The system keeps running totals you can monitor:

| Stat | What It Tells You |
|------|-------------------|
| **Born** | Total citizens added (births + immigrants + replacements) |
| **Died** | Total citizens lost (old age, natural, combat, emigration) |
| **Enlisted** | Total citizens drafted into military |
| **Died in Combat** | Military personnel lost in battle |
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
- **Combat deaths matter.** `recordCombatDeath()` is tracked separately — losing soldiers in war reduces your population permanently.
- **Population situations become critical.** With a large population, a single situation can swing happiness by several points and affect growth for days.

### Warning Signs
| Sign | Meaning | Fix |
|------|---------|-----|
| "Military Penalty Active" | Over 50% of eligible population drafted | Reduce military size or wait for population to grow |
| Died > Born (rising) | Population shrinking | Improve happiness, reduce disease/pollution |
| Low taxable population | Few workers paying taxes | Encourage working-age immigration, reduce child/senior ratio |
| High emigration | Citizens leaving | Fix happiness, crime, pollution, disease |

### Quick Reference
- **Teenage citizens** = your taxpayers AND your soldiers. Protect this group.
- **14 real days** = newborn becomes a taxpayer.
- **~178 real days** = full citizen lifespan.
- **50% draft** = growth penalty threshold.
- **2 turns** = replacement buffer after old-age death.
