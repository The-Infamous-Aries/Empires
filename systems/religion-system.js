/**
 * Religion System - Religion Types, Hints, and Mechanics
 * Dominion Wars - Nation Building Strategy Game
 */

class ReligionSystem {
    constructor() {
        this.religions = {};
        this.initializeReligions();
    }

    /**
     * Initialize all 12 religion types with unique hints
     */
    initializeReligions() {
        this.religions = {
            // 1. STATE ATHEISM
            stateAtheism: {
                id: 'stateAtheism',
                name: 'State Atheism',
                fullName: 'Secular Rationalist State',
                description: 'A philosophy rejecting all supernatural claims, emphasizing science, reason, and material progress as the foundation for society. The state promotes secular values and rational inquiry.',
                history: 'A modern secular ideology that emerged from Enlightenment rationalism, prioritizing empirical evidence over religious belief.',
                
                bonuses: {
                    technology: 0.20,       // +20% research (no religious obstruction)
                    education: 0.15,        // +15% education emphasis
                    efficiency: 0.12,       // +12% administrative efficiency
                    innovation: 0.15,       // +15% innovation
                    unity: 0.08             // +8% unity through secular identity
                },
                
                penalties: {
                    happiness: 0.90,        // -10% (spiritual void)
                    populationGrowth: 0.92, // -8% (secular values)
                    socialCohesion: 0.88,   // -12% (no shared faith)
                    militaryMorale: 0.92    // -8% (no divine cause)
                },
                
                practices: {
                    worship: 'None',
                    holyDays: 0,
                    dietary: 'None',
                    dress: 'Secular'
                },
                
                // 5 UNIQUE HINTS
                hints: [
                    'Science and reason illuminate the path forward, not ancient myths',
                    'Progress comes from questioning everything, including sacred cows',
                    'The state allocates resources efficiently without religious bureaucracy',
                    'Citizens find purpose in material advancement and knowledge',
                    'No divine mandate limits what the nation can achieve'
                ],
                
                hintThemes: ['reason', 'science', 'secular', 'progress', 'rational']
            },

            // 2. MONOTHEISM (Abrahamic)
            monotheism: {
                id: 'monotheism',
                name: 'Monotheism',
                fullName: 'Faith of the One True God',
                description: 'Worship of a single, all-powerful deity who created and governs the universe. This faith emphasizes moral law, prophetic guidance, and divine covenant with believers.',
                history: 'One of the oldest forms of organized religion, dating to ancient times and founding major world civilizations.',
                
                bonuses: {
                    happiness: 0.15,        // +15% (spiritual fulfillment)
                    stability: 0.12,        // +12% (shared faith)
                    socialOrder: 0.15,      // +15% moral code
                    populationGrowth: 0.10, // +10% (family values)
                    militaryMorale: 0.12    // +12% (divine cause)
                },
                
                penalties: {
                    technology: 0.92,       // -8% (some resistance)
                    flexibility: 0.90,      // -10% (doctrine rigidity)
                    foreign: 0.88           // -12% (exclusivism)
                },
                
                practices: {
                    worship: 'Congregational',
                    holyDays: 7,
                    dietary: 'Religious',
                    dress: 'Modest'
                },
                
                hints: [
                    'One God watches over all, providing divine purpose to every soul',
                    'The faithful obey moral laws that maintain social harmony',
                    'Sacred texts guide leaders toward righteous governance',
                    'Communities unite in shared worship and holy observances',
                    'Soldiers fight with conviction that God wills their victory'
                ],
                
                hintThemes: ['one god', 'faith', 'morality', 'covenant', 'righteousness']
            },

            // 3. POLYTHEISM
            polytheism: {
                id: 'polytheism',
                name: 'Polytheism',
                fullName: 'Pantheon of Divine Beings',
                description: 'Worship of multiple gods and goddesses, each governing different aspects of existence. Followers seek favor from various deities for different needs and circumstances.',
                history: 'The oldest form of religion, practiced by all ancient civilizations with elaborate temple systems and priesthoods.',
                
                bonuses: {
                    happiness: 0.12,        // +12% (variety of spiritual outlets)
                    adaptability: 0.15,     // +15% (many gods for many needs)
                    culturalRichness: 0.18, // +18% arts and culture
                    diplomacy: 0.10,        // +10% (flexible theology)
                    populationGrowth: 0.08  // +8% (fertility gods)
                },
                
                penalties: {
                    unity: 0.85,            // -15% (competing deity loyalties)
                    consistency: 0.88,      // -12% (contradictory doctrines)
                    technology: 0.95        // -5% (some anti-innovation sects)
                },
                
                practices: {
                    worship: 'Temple',
                    holyDays: 12,
                    dietary: 'Various',
                    dress: 'Ceremonial'
                },
                
                hints: [
                    'The pantheon provides guidance for every aspect of life and death',
                    'Priests intercede with specific gods for specific blessings',
                    'Art and architecture flourish under religious patronage',
                    'Different deities serve different citizens, reducing religious conflict',
                    'The wheel of fortune turns - prosperity follows hardship and vice versa'
                ],
                
                hintThemes: ['pantheon', 'gods', 'temples', 'ritual', 'culture']
            },

            // 4. BUDDHISM
            buddhism: {
                id: 'buddhism',
                name: 'Buddhism',
                fullName: 'Path of Enlightened Awakening',
                description: 'A philosophy and religious practice centered on the teachings of the Buddha, seeking liberation from suffering through enlightenment, meditation, and ethical living.',
                history: 'Founded 2,500 years ago in ancient India, spreading across Asia and eventually worldwide.',
                
                bonuses: {
                    happiness: 0.18,        // +18% (inner peace)
                    stability: 0.12,        // +12% (non-violence)
                    wisdom: 0.15,           // +15% philosophical insight
                    socialHarmony: 0.15,    // +15% (compassion)
                    meditation: 0.12        // +12% (mental discipline)
                },
                
                penalties: {
                    militaryStrength: 0.88, // -12% (pacifism)
                    expansion: 0.90,        // -10% (non-aggression)
                    populationGrowth: 0.95  // -5% (celibacy in some sects)
                },
                
                practices: {
                    worship: 'Meditation',
                    holyDays: 4,
                    dietary: 'Vegetarian',
                    dress: 'Simple'
                },
                
                hints: [
                    'Meditation brings inner peace that no material success can match',
                    'The path to enlightenment requires rejecting desire and suffering',
                    'Compassion for all beings guides ethical conduct',
                    'Monks preserve ancient wisdom through contemplative study',
                    'Non-violence creates stability, as aggression breeds endless cycles'
                ],
                
                hintThemes: ['enlightenment', 'meditation', 'compassion', 'suffering', 'peace']
            },

            // 5. HINDUISM
            hinduism: {
                id: 'hinduism',
                name: 'Hinduism',
                fullName: 'Eternal Dharmic Tradition',
                description: 'A diverse religious tradition with multiple beliefs, practices, and sacred texts. It encompasses many deities, philosophical schools, and pathways to spiritual truth.',
                history: 'The oldest living major religion, evolving over 4,000 years in the Indian subcontinent.',
                
                bonuses: {
                    happiness: 0.15,        // +15% (spiritual variety)
                    adaptability: 0.18,     // +18% (flexible beliefs)
                    culturalDepth: 0.20,    // +20% rich traditions
                    populationGrowth: 0.12, // +12% (family values)
                    wisdom: 0.15            // +15% philosophical tradition
                },
                
                penalties: {
                    unity: 0.88,            // -12% (diversity)
                    efficiency: 0.90,       // -10% (caste complications)
                    reform: 0.85            // -15% (tradition)
                },
                
                practices: {
                    worship: 'Multiple',
                    holyDays: 10,
                    dietary: 'Caste-based',
                    dress: 'Traditional'
                },
                
                hints: [
                    'The divine manifests in countless forms, worshipped according to need',
                    'Karma governs the universe, ensuring justice across lifetimes',
                    'Sacred texts contain infinite wisdom for those who seek',
                    'Caste provides social order, each fulfilling their dharmic duty',
                    'Rituals mark every life passage from birth to death and beyond'
                ],
                
                hintThemes: ['karma', 'dharma', 'caste', 'deities', 'ritual']
            },

            // 6. SHINTO
            shinto: {
                id: 'shinto',
                name: 'Shinto',
                fullName: 'Way of the Kami',
                description: 'An indigenous religion worshipping kami - spirits dwelling in nature, ancestors, and sacred places. It emphasizes purity, harmony with nature, and reverence for tradition.',
                history: 'Japan\'s native religion, deeply intertwined with Japanese culture and identity.',
                
                bonuses: {
                    harmony: 0.18,          // +18% nature harmony
                    stability: 0.12,        // +12% (tradition)
                    culturalUnity: 0.15,    // +15% national identity
                    purity: 0.12,           // +12% moral purity
                    environmental: 0.15     // +15% environmental respect
                },
                
                penalties: {
                    expansion: 0.88,        // -12% (isolationist)
                    foreign: 0.85,          // -15% (exclusivist)
                    technology: 0.95        // -5% (tradition)
                },
                
                practices: {
                    worship: 'Shrine',
                    holyDays: 6,
                    dietary: 'Pure',
                    dress: 'Ceremonial'
                },
                
                hints: [
                    'Spirits dwell in every mountain, tree, and stream',
                    'Purification rituals maintain spiritual cleanliness',
                    'Ancestor spirits watch over and protect their descendants',
                    'The emperor traces lineage to divine sun goddess Amaterasu',
                    'Nature deserves reverence, not exploitation'
                ],
                
                hintThemes: ['kami', 'spirits', 'purification', 'nature', 'ancestors']
            },

            // 7. ZOROASTRIANISM
            zoroastrianism: {
                id: 'zoroastrianism',
                name: 'Zoroastrianism',
                fullName: 'Faith of Light and Truth',
                description: 'An ancient faith worshipping Ahura Mazda as the supreme deity, teaching the eternal struggle between light and darkness, truth and falsehood.',
                history: 'Founded by the prophet Zoroaster around 3,500 years ago, it was the state religion of ancient Persian empires.',
                
                bonuses: {
                    morality: 0.18,         // +18% ethical conduct
                    militaryMorale: 0.15,   // +15% (righteous cause)
                    purity: 0.15,           // +15% spiritual purity
                    wisdom: 0.12,           // +12% dualistic philosophy
                    reputation: 0.12        // +12% (righteous reputation)
                },
                
                penalties: {
                    population: 0.90,       // -10% (exclusivist)
                    flexibility: 0.90,      // -10% (doctrine)
                    diversity: 0.92         // -8% (conversion resistance)
                },
                
                practices: {
                    worship: 'Fire Temple',
                    holyDays: 6,
                    dietary: 'Pure',
                    dress: 'Modest'
                },
                
                hints: [
                    'Ahura Mazda, the wise lord, embodies truth and light',
                    'The cosmic battle between good and evil defines existence',
                    'Good thoughts, words, and deeds shape destiny',
                    'Fire priests maintain sacred flames as symbols of divinity',
                    'The final judgment awaits all souls based on their choices'
                ],
                
                hintThemes: ['light', 'truth', 'good', 'fire', 'dualism']
            },

            // 8. SIKHISM
            sikhism: {
                id: 'sikhism',
                name: 'Sikhism',
                fullName: 'Path of the Guru',
                description: 'A monotheistic faith founded in Punjab emphasizing equality, service, and devotion to God. Sikhs follow the teachings of ten historical Gurus and the Guru Granth Sahib.',
                history: 'Founded in the 15th century by Guru Nanak as a reform movement against religious formalism.',
                
                bonuses: {
                    unity: 0.18,            // +18% (equality)
                    martialProwess: 0.15,   // +15% (Kshatriya values)
                    happiness: 0.15,        // +15% (devotion)
                    service: 0.15,          // +15% community service
                    populationGrowth: 0.10  // +10% (family values)
                },
                
                penalties: {
                    flexibility: 0.92,      // -8% (distinct identity)
                    diplomacy: 0.90         // -10% (distinctiveness)
                },
                
                practices: {
                    worship: 'Congregational',
                    holyDays: 5,
                    dietary: 'Vegetarian',
                    dress: 'Distinctive'
                },
                
                hints: [
                    'All humans equal before God, regardless of birth or caste',
                    'The Guru Granth Sahib contains divine guidance for all',
                    'Community service and charity are sacred duties',
                    'Warriors defend faith with courage and conviction',
                    'Meditation on God\'s name brings liberation'
                ],
                
                hintThemes: ['equality', 'guru', 'service', 'warrior', 'devotion']
            },

            // 9. TAOISM
            taoism: {
                id: 'taoism',
                name: 'Taoism',
                fullName: 'The Way of Harmony',
                description: 'A Chinese philosophy and religion emphasizing living in harmony with the Tao - the fundamental nature of reality. It values naturalness, simplicity, and spontaneity.',
                history: 'Founded by Laozi in ancient China, it developed alongside Confucianism as a guiding philosophy.',
                
                bonuses: {
                    harmony: 0.18,          // +18% natural harmony
                    wisdom: 0.15,           // +15% philosophical depth
                    adaptability: 0.15,     // +15% flexibility
                    longevity: 0.12,        // +12% health practices
                    environmental: 0.15     // +15% nature respect
                },
                
                penalties: {
                    military: 0.88,         // -12% (pacifism)
                    expansion: 0.90,        // -10% (non-interference)
                    order: 0.92             // -8% (anti-organization)
                },
                
                practices: {
                    worship: 'Natural',
                    holyDays: 4,
                    dietary: 'Harmonious',
                    dress: 'Simple'
                },
                
                hints: [
                    'The Tao that can be named is not the eternal Tao',
                    'Wu wei - effortless action achieves more than force',
                    'Nature provides all needs; humanity need not struggle against it',
                    'Immortality rituals and alchemy occupy the wise',
                    'Balance and harmony sustain all things'
                ],
                
                hintThemes: ['tao', 'harmony', 'nature', 'wu wei', 'balance']
            },

            // 10. JUDAISM
            judaism: {
                id: 'judaism',
                name: 'Judaism',
                fullName: 'Covenant of Abraham and Moses',
                description: 'An ancient monotheistic religion centered on the covenant between God and the Jewish people, governed by Torah law and rabbinic tradition.',
                history: 'One of the oldest monotheistic faiths, founding Western religious tradition through Christianity and Islam.',
                
                bonuses: {
                    education: 0.20,        // +20% (learning emphasis)
                    unity: 0.15,            // +15% (tribal identity)
                    intellectual: 0.18,     // +18% scholarly tradition
                    resilience: 0.15,       // +15% survival ability
                    law: 0.12               // +12% legal tradition
                },
                
                penalties: {
                    expansion: 0.90,        // -10% (exclusive)
                    foreign: 0.88,          // -12% (particularism)
                    military: 0.92          // -8% (historical factors)
                },
                
                practices: {
                    worship: 'Synagogue',
                    holyDays: 8,
                    dietary: 'Kosher',
                    dress: 'Modest'
                },
                
                hints: [
                    'The covenant with God demands moral conduct and study',
                    'Rabbinic scholars interpret divine law for every situation',
                    'The Chosen People carry sacred responsibility to model ethics',
                    'Torah study is perpetual - knowledge is holy',
                    'Despite persecution, the faith endures through centuries'
                ],
                
                hintThemes: ['covenant', 'torah', 'study', 'law', 'chosen']
            },

            // 11. NEW AGE SPIRITUALITY
            newAgeSpirituality: {
                id: 'newAgeSpirituality',
                name: 'New Age Spirituality',
                fullName: 'Eclectic Holistic Movement',
                description: 'A contemporary spiritual movement combining elements from various traditions, emphasizing personal growth, cosmic energy, and mystical experiences.',
                history: 'A modern movement emerging in the 20th century from counterculture and occult traditions.',
                
                bonuses: {
                    adaptability: 0.20,     // +20% (flexible beliefs)
                    happiness: 0.15,       // +15% (personal fulfillment)
                    innovation: 0.15,      // +15% (openness)
                    healing: 0.12,         // +12% alternative medicine
                    creativity: 0.15       // +15% artistic expression
                },
                
                penalties: {
                    unity: 0.80,            // -20% (individualism)
                    consistency: 0.75,      // -25% (contradictions)
                    stability: 0.88,        // -12% (changeable)
                    tradition: 0.70         // -30% (anti-tradition)
                },
                
                practices: {
                    worship: 'Personal',
                    holyDays: 0,
                    dietary: 'Variable',
                    dress: 'Eclectic'
                },
                
                hints: [
                    'Each soul must find their own path to truth',
                    'Cosmic energy flows through all things, connecting everything',
                    'Ancient wisdom combines with modern understanding',
                    'Healing addresses mind, body, and spirit together',
                    'No authority can dictate personal spiritual experience'
                ],
                
                hintThemes: ['personal', 'energy', 'healing', 'growth', 'eclectic']
            },

            // 12. ANCESTOR WORSHIP
            ancestorWorship: {
                id: 'ancestorWorship',
                name: 'Ancestor Worship',
                fullName: 'Veneration of the Departed',
                description: 'A practice honoring deceased family members and elders, believing they continue to influence the living and deserve respect, offerings, and remembrance.',
                history: 'One of the oldest religious practices, found in cultures worldwide throughout history.',
                
                bonuses: {
                    family: 0.20,           // +20% family bonds
                    respect: 0.18,          // +18% elder respect
                    stability: 0.15,        // +15% (tradition)
                    continuity: 0.15,       // +15% generational continuity
                    wisdom: 0.12            // +12% traditional knowledge
                },
                
                penalties: {
                    innovation: 0.88,       // -12% (tradition)
                    flexibility: 0.90,      // -10% (conservatism)
                    foreign: 0.92           // -8% (insularity)
                },
                
                practices: {
                    worship: 'Domestic',
                    holyDays: 8,
                    dietary: 'Traditional',
                    dress: 'Respectful'
                },
                
                hints: [
                    'The dead live on through memory and ritual',
                    'Elders carry wisdom that youth must earn through respect',
                    'Family extends beyond death - generations remain connected',
                    'Rituals ensure ancestors\' spirits remain benevolent',
                    'Tradition maintains social bonds across time'
                ],
                
                hintThemes: ['ancestors', 'family', 'tradition', 'respect', 'continuity']
            }
        };
    }

    /**
     * Get religion by ID
     */
    getReligion(religionId) {
        return this.religions[religionId] || null;
    }

    /**
     * Get all religions
     */
    getAllReligions() {
        return Object.values(this.religions);
    }

    /**
     * Get religion hints
     */
    getReligionHints(religionId, count = 5) {
        const religion = this.getReligion(religionId);
        if (!religion) return [];
        
        const shuffled = [...religion.hints].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Get hint themes for a religion
     */
    getHintThemes(religionId) {
        const religion = this.getReligion(religionId);
        return religion ? religion.hintThemes : [];
    }

    /**
     * Apply religion bonuses to a nation
     */
    applyReligionBonuses(nation, religionId) {
        const religion = this.getReligion(religionId);
        if (!religion) return;

        // Apply happiness bonus
        if (religion.bonuses.happiness) {
            nation.happiness = Math.floor(nation.happiness * religion.bonuses.happiness);
        }

        // Apply population growth bonus
        if (religion.bonuses.populationGrowth) {
            nation.populationGrowthModifier = religion.bonuses.populationGrowth;
        }

        // Apply stability bonus
        if (religion.bonuses.stability) {
            nation.stability = Math.floor(nation.stability * religion.bonuses.stability);
        }

        // Apply military morale bonus
        if (religion.bonuses.militaryMorale) {
            nation.militaryMorale = (nation.militaryMorale || 1) * religion.bonuses.militaryMorale;
        }

        // Apply technology bonus
        if (religion.bonuses.technology) {
            nation.technologyBonus = religion.bonuses.technology;
        }
    }
}

// Create global instance and expose it
window.ReligionSystem = new ReligionSystem();