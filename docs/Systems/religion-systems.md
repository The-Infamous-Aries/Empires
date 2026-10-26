# Religion System

Handles nation religion types — spiritual structures that provide mechanical bonuses and penalties affecting happiness, disease, environment, literacy, tax efficiency, crime, military morale, stability, population efficiency, and tech growth.

## Overview

- **System class:** `ReligionSystem`
- **Global instance:** `window.ReligionSystem`
- **Religion count:** 12 types
- **Balance rule:** Every religion has exactly **3 boosts** and **2 penalties**
- **Bonus application:** Additive percentage (0.10 = +10%) applied via multiplication `(1 + value)`
- **Penalty application:** Multiplicative (0.90 = -10%) applied via direct multiplication
- **Bad metrics** (pollution, disease, crime): Higher is worse. Bonuses reduce them, penalties increase them.
- **Good metrics** (happiness, stability, literacy, environment, taxEfficiency, tech, populationEfficiency, militaryStrength, militaryMorale): Higher is better. Bonuses increase them, penalties reduce them.
- **Nation integration:** Called via `Nation.applyReligionBonuses()` which delegates to `ReligionSystem.applyReligionBonuses()`

## Religion Reference

| Religion | Icon | Boost 1 | Boost 2 | Boost 3 | Penalty 1 | Penalty 2 |
|----------|------|---------|---------|---------|-----------|-----------|
| Atheism | ⚛️ | taxEfficiency +12% | tech +15% | happiness +10% | populationEfficiency -10% | militaryMorale -10% |
| Monotheism | ✝️ | happiness +12% | stability +10% | militaryMorale +10% | taxEfficiency -8% | tech -8% |
| Polytheism | 🏛️ | happiness +10% | environment +10% | populationEfficiency +10% | crime +15% | pollution +10% |
| Buddhism | ☸️ | happiness +15% | disease -15% | stability +10% | militaryStrength -12% | tech -10% |
| Hinduism | ☪️ | happiness +12% | populationEfficiency +12% | stability +10% | taxEfficiency -10% | tech -10% |
| Shintoism | 🎐 | environment +15% | stability +10% | crime -10% | tech -8% | militaryStrength -10% |
| Islam | ☪️ | happiness +12% | stability +12% | populationEfficiency +10% | taxEfficiency -10% | tech -10% |
| Christianity | ✝️ | happiness +10% | literacy +15% | stability +10% | tech -7% | militaryStrength -10% |
| Shamanism | 🍃 | environment +15% | happiness +10% | disease -12% | militaryStrength -12% | stability -10% |
| Judaism | ✡️ | literacy +20% | stability +15% | taxEfficiency +10% | militaryStrength -8% | tech -10% |
| Scientology | 🔬 | happiness +15% | tech +15% | populationEfficiency +10% | stability -12% | crime +12% |
| Pastafarianism | 🍝 | happiness +15% | tech +12% | crime -10% | militaryStrength -12% | stability -12% |

---

## Religions by Type

### 1. Atheism ⚛️
**Full name:** Secular Rationalist State  
**Theme:** Science, reason, secular progress  
**Image:** `assets/images/Religion/atheism.png`  

**Description:** A philosophy rejecting all supernatural claims, emphasizing science, reason, and material progress as the foundation for society. The state promotes secular values and rational inquiry.

**Bonuses:**
- **taxEfficiency +12%** — Rational administration improves tax collection efficiency
- **tech +15%** — No religious obstruction to research accelerates technology growth
- **happiness +10%** — Material progress increases citizen happiness

**Penalties:**
- **populationEfficiency -10%** — Secular values reduce population growth
- **militaryMorale -10%** — No divine cause lowers troop morale

**Practices:** None worship, 0 holy days, no dietary restrictions, secular dress

**Hint themes:** Reason, science, secular, progress, rational

---

### 2. Monotheism ✝️
**Full name:** Faith of the One True God  
**Theme:** Faith, shared moral law, divine covenant  
**Image:** `assets/images/Religion/monotheism.png`  

**Description:** Worship of a single, all-powerful deity who created and governs the universe. This faith emphasizes moral law, prophetic guidance, and divine covenant with believers.

**Bonuses:**
- **happiness +12%** — Spiritual fulfillment increases happiness
- **stability +10%** — Shared faith provides stability
- **militaryMorale +10%** — Divine cause boosts troop morale

**Penalties:**
- **taxEfficiency -8%** — Religious bureaucracy slows tax collection
- **tech -8%** — Religious resistance to new ideas slows tech growth

**Practices:** Congregational worship, 7 holy days, religious dietary rules, modest dress

**Hint themes:** One god, faith, morality, covenant, righteousness

---

### 3. Polytheism 🏛️
**Full name:** Pantheon of Divine Beings  
**Theme:** Pantheon, cultural richness, adaptability  
**Image:** `assets/images/Religion/polytheism.png`  

**Description:** Worship of multiple gods and goddesses, each governing different aspects of existence. Followers seek favor from various deities for different needs and circumstances.

**Bonuses:**
- **happiness +10%** — Variety of spiritual outlets increases happiness
- **environment +10%** — Nature reverence improves environment quality
- **populationEfficiency +10%** — Fertility gods boost population efficiency

**Penalties:**
- **crime +15%** — Competing sects increase crime
- **pollution +10%** — Temple industry increases pollution

**Practices:** Temple worship, 12 holy days, various dietary rules, ceremonial dress

**Hint themes:** Pantheon, gods, temples, ritual, culture

---

### 4. Buddhism ☸️
**Full name:** Path of Enlightened Awakening  
**Theme:** Enlightenment, meditation, compassion  
**Image:** `assets/images/Religion/buddhism.png`  

**Description:** A philosophy and religious practice centered on the teachings of the Buddha, seeking liberation from suffering through enlightenment, meditation, and ethical living.

**Bonuses:**
- **happiness +15%** — Inner peace increases happiness
- **disease -15%** — Mindful living and compassion reduce disease rate
- **stability +10%** — Non-violence provides stability

**Penalties:**
- **militaryStrength -12%** — Pacifism reduces military power
- **tech -10%** — Traditional focus slows tech growth

**Practices:** Meditation worship, 4 holy days, vegetarian dietary, simple dress

**Hint themes:** Enlightenment, meditation, compassion, suffering, peace

---

### 5. Hinduism ☪️
**Full name:** Eternal Dharmic Tradition  
**Theme:** Dharma, caste order, family values  
**Image:** `assets/images/Religion/hinduism.png`  

**Description:** A diverse religious tradition with multiple beliefs, practices, and sacred texts. It encompasses many deities, philosophical schools, and pathways to spiritual truth.

**Bonuses:**
- **happiness +12%** — Spiritual variety increases happiness
- **populationEfficiency +12%** — Family values boost population efficiency
- **stability +10%** — Social order provides stability

**Penalties:**
- **taxEfficiency -10%** — Caste bureaucracy slows tax collection
- **tech -10%** — Tradition slows tech growth

**Practices:** Multiple worship, 10 holy days, caste-based dietary, traditional dress

**Hint themes:** Karma, dharma, caste, deities, ritual

---

### 6. Shintoism 🎐
**Full name:** Way of the Kami  
**Theme:** Kami, nature harmony, purity  
**Image:** `assets/images/Religion/shintoism.png`  

**Description:** An indigenous religion worshipping kami — spirits dwelling in nature, ancestors, and sacred places. It emphasizes purity, harmony with nature, and reverence for tradition.

**Bonuses:**
- **environment +15%** — Nature reverence improves environment quality
- **stability +10%** — Tradition provides stability
- **crime -10%** — Moral purity reduces crime

**Penalties:**
- **tech -8%** — Tradition slows tech growth
- **militaryStrength -10%** — Isolationist stance reduces military power

**Practices:** Shrine worship, 6 holy days, pure dietary, ceremonial dress

**Hint themes:** Kami, spirits, purification, nature, ancestors

---

### 7. Islam ☪️
**Full name:** Submission to the Will of God  
**Theme:** Submission, community unity, divine law  
**Image:** `assets/images/Religion/islam.png`  

**Description:** A monotheistic Abrahamic faith teaching that God is one, and that Muhammad is the final prophet. Followers submit to divine will through the Five Pillars and Sharia guidance.

**Bonuses:**
- **happiness +12%** — Spiritual community increases happiness
- **stability +12%** — Shared faith provides stability
- **populationEfficiency +10%** — Family values boost population efficiency

**Penalties:**
- **taxEfficiency -10%** — Religious law complexity slows tax collection
- **tech -10%** — Traditional focus slows tech growth

**Practices:** Mosque worship, 6 holy days, halal dietary, modest dress

**Hint themes:** Prayer, charity, law, community, faith

---

### 8. Christianity ✝️
**Full name:** Faith of the Cross  
**Theme:** Salvation, charity, moral framework  
**Image:** `assets/images/Religion/christianity.png`  

**Description:** A monotheistic religion centered on the life and teachings of Jesus Christ, emphasizing salvation, love, forgiveness, and eternal life through faith.

**Bonuses:**
- **happiness +10%** — Hope and salvation increase happiness
- **literacy +15%** — Scripture study increases literacy
- **stability +10%** — Shared moral code provides stability

**Penalties:**
- **tech -7%** — Historical tensions slow tech growth
- **militaryStrength -10%** — "Turn the other cheek" reduces military power

**Practices:** Church worship, 8 holy days, varied dietary, modest dress

**Hint themes:** Salvation, love, charity, church, faith

---

### 9. Shamanism 🍃
**Full name:** The Spirit World Path  
**Theme:** Spirit world, nature harmony, healing  
**Image:** `assets/images/Religion/shamanism.png`  

**Description:** An ancient spiritual practice where shamans act as intermediaries between the human world and spirit world, seeking guidance through trance, ritual, and communion with nature spirits.

**Bonuses:**
- **environment +15%** — Nature respect improves environment quality
- **happiness +10%** — Natural harmony increases happiness
- **disease -12%** — Traditional healing reduces disease rate

**Penalties:**
- **militaryStrength -12%** — Pacifism reduces military power
- **stability -10%** — Anti-organization lowers stability

**Practices:** Natural worship, 4 holy days, traditional dietary, ceremonial dress

**Hint themes:** Spirits, harmony, nature, ancestors, healing

---

### 10. Judaism ✡️
**Full name:** Covenant of Abraham and Moses  
**Theme:** Covenant, learning, resilience  
**Image:** `assets/images/Religion/judaism.png`  

**Description:** An ancient monotheistic religion centered on the covenant between God and the Jewish people, governed by Torah law and rabbinic tradition.

**Bonuses:**
- **literacy +20%** — Torah study emphasis dramatically increases literacy
- **stability +15%** — Tribal identity provides stability
- **taxEfficiency +10%** — Legal tradition improves tax collection

**Penalties:**
- **militaryStrength -8%** — Historical factors reduce military power
- **tech -10%** — Particularism slows tech growth

**Practices:** Synagogue worship, 8 holy days, kosher dietary, modest dress

**Hint themes:** Covenant, torah, study, law, chosen

---

### 11. Scientology 🔬
**Full name:** Church of Scientology  
**Theme:** Personal growth, self-improvement, innovation  
**Image:** `assets/images/Religion/scientology.png`  

**Description:** A modern religious movement founded in the 20th century emphasizing personal spiritual growth, self-improvement, and the immortality of the spirit through a system of beliefs and practices.

**Bonuses:**
- **happiness +15%** — Personal fulfillment increases happiness
- **tech +15%** — Openness accelerates tech growth
- **populationEfficiency +10%** — Self-improvement boosts population efficiency

**Penalties:**
- **stability -12%** — Changeable beliefs lower stability
- **crime +12%** — Individualism increases crime

**Practices:** Personal worship, 0 holy days, variable dietary, eclectic dress

**Hint themes:** Personal, energy, healing, growth, eclectic

---

### 12. Pastafarianism 🍝
**Full name:** Church of the Flying Spaghetti Monster  
**Theme:** Humor, reason, freethinking  
**Image:** `assets/images/Religion/pastafarianism.png`  

**Description:** A satirical religion founded to challenge religious doctrine in public life, venerating the Flying Spaghetti Monster. Followers embrace reason, humor, and skepticism as sacred values.

**Bonuses:**
- **happiness +15%** — Humor and joy increase happiness
- **tech +12%** — Freethinking accelerates tech growth
- **crime -10%** — Inclusive attitude reduces crime

**Penalties:**
- **militaryStrength -12%** — Pacifism reduces military power
- **stability -12%** — Irreverence lowers stability

**Practices:** Noodly worship, 0 holy days, pasta dietary, pirate dress

**Hint themes:** Humor, reason, freedom, creativity, satire

---

## Mechanics

### How Bonuses and Penalties Are Applied

`ReligionSystem.applyReligionBonuses(nation, religionId)` processes all bonuses and penalties:

1. **Dot-notation support:** Keys like `'nationStats.taxEfficiency'` navigate nested objects on the nation
2. **Bad metrics** (pollution, disease, crime): Higher value is worse
   - Bonus: `value × (1 − bonus%)` — reduces the bad metric
   - Penalty: `value × (1 + penalty%)` — increases the bad metric
3. **Good metrics** (happiness, stability, literacy, environment, taxEfficiency, tech, populationEfficiency, militaryStrength, militaryMorale): Higher value is better
   - Bonus: `value × (1 + bonus%)` — increases the good metric
   - Penalty: `value × penalty%` — reduces the good metric (e.g. 0.90 = −10%)

### Nation Integration

`Nation.applyReligionBonuses()` (entities/Nation.js) delegates to `ReligionSystem.applyReligionBonuses()`:

- Called during nation initialization
- Applied when a nation changes its religion
- All bonus/penalty values are applied directly to `nation` object properties

### Example Calculation

If a nation with `happiness = 50` adopts Buddhism (happiness +15%):
```
nation.happiness = Math.floor(50 * (1 + 0.15)) = Math.floor(57.5) = 57
```

If a nation with `pollution = 30` adopts Hinduism (no pollution bonus) vs Shintoism (environment +15%, which does NOT affect pollution directly):
- Hinduism: pollution unchanged at 30
- Shintoism: pollution unchanged at 30 (environment bonus affects environment, not pollution)

---

## Methods

| Method | Description |
|--------|-------------|
| `getReligion(religionId)` | Returns religion config object by ID |
| `getAllReligions()` | Returns array of all 12 religion configs |
| `getReligionHints(religionId, count)` | Returns shuffled hints for puzzle mechanics (default: 5) |
| `getHintThemes(religionId)` | Returns hint theme keywords |
| `applyReligionBonuses(nation, religionId)` | Applies all bonuses/penalties to a nation |

---

## Architecture

```
ReligionSystem (orchestrator)
├── 12 religion type definitions
│   ├── atheism (⚛️)
│   ├── monotheism (✝️)
│   ├── polytheism (🏛️)
│   ├── buddhism (☸️)
│   ├── hinduism (☪️)
│   ├── shintoism (🎐)
│   ├── islam (☪️)
│   ├── christianity (✝️)
│   ├── shamanism (🍃)
│   ├── judaism (✡️)
│   ├── scientology (🔬)
│   └── pastafarianism (🍝)
├── applyReligionBonuses() — real mechanical effects
└── getReligionHints() / getHintThemes() — puzzle mechanics
```

---

## Cross-System Dependencies

| System | Dependency |
|--------|------------|
| `entities/Nation.js` | Calls `applyReligionBonuses()` on init and religion change |
| `systems/government-system.js` | Works alongside government bonuses; religion + government combine for nation modifiers |
| `ui/components/ReferencePage.js` | May display religion info for player reference |

---

## Export

```js
window.ReligionSystem = religionSystemInstance;
```
