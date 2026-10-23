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
            // 1. ATHEISM
            atheism: {
                id: 'atheism',
                name: 'Atheism',
                fullName: 'Secular Rationalist State',
                image: 'assets/images/Religion/atheism.png',
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
                image: 'assets/images/Religion/monotheism.png',
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
                image: 'assets/images/Religion/polytheism.png',
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
                image: 'assets/images/Religion/buddhism.png',
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
                image: 'assets/images/Religion/hinduism.png',
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

            // 6. SHINTOISM
            shintoism: {
                id: 'shintoism',
                name: 'Shintoism',
                fullName: 'Way of the Kami',
                image: 'assets/images/Religion/shintoism.png',
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

            // 7. ISLAM
            islam: {
                id: 'islam',
                name: 'Islam',
                fullName: 'Submission to the Will of God',
                image: 'assets/images/Religion/islam.png',
                description: 'A monotheistic Abrahamic faith teaching that God is one, and that Muhammad is the final prophet. Followers submit to divine will through the Five Pillars and Sharia guidance.',
                history: 'Founded in 7th century Arabia by the prophet Muhammad, rapidly spreading across the Middle East, Africa, and Asia to become one of the world\'s largest religions.',
                
                bonuses: {
                    happiness: 0.15,        // +15% (spiritual community)
                    stability: 0.12,        // +12% (shared faith)
                    socialCohesion: 0.15,   // +15% (ummah unity)
                    populationGrowth: 0.12, // +12% (family values)
                    militaryMorale: 0.15    // +15% (divine cause)
                },
                
                penalties: {
                    technology: 0.90,       // -10% (some resistance)
                    flexibility: 0.88,      // -12% (doctrine)
                    foreign: 0.90           // -10% (exclusivism)
                },
                
                practices: {
                    worship: 'Mosque',
                    holyDays: 6,
                    dietary: 'Halal',
                    dress: 'Modest'
                },
                
                hints: [
                    'The call to prayer unites the faithful five times each day',
                    'Zakat — obligatory charity — ensures the poor are never forgotten',
                    'The Quran and Hadith provide divine law for every aspect of life',
                    'The ummah, the community of believers, provides unshakeable social bonds',
                    'Soldiers defending the faith fight with unmatched conviction'
                ],
                
                hintThemes: ['prayer', 'charity', 'law', 'community', 'faith']
            },

            // 8. CHRISTIANITY
            christianity: {
                id: 'christianity',
                name: 'Christianity',
                fullName: 'Faith of the Cross',
                image: 'assets/images/Religion/christianity.png',
                description: 'A monotheistic religion centered on the life and teachings of Jesus Christ, emphasizing salvation, love, forgiveness, and eternal life through faith.',
                history: 'Founded in 1st century Judea, spreading across the Roman Empire and eventually the globe to become the world\'s largest religion.',
                
                bonuses: {
                    happiness: 0.15,        // +15% (hope and salvation)
                    stability: 0.10,        // +10% (shared moral code)
                    socialOrder: 0.12,      // +12% (moral framework)
                    populationGrowth: 0.10, // +10% (family values)
                    charity: 0.18           // +18% (charity and service)
                },
                
                penalties: {
                    technology: 0.93,       // -7% (historical tensions)
                    flexibility: 0.90,      // -10% (doctrine)
                    foreign: 0.92           // -8% (exclusivism)
                },
                
                practices: {
                    worship: 'Church',
                    holyDays: 8,
                    dietary: 'Varied',
                    dress: 'Modest'
                },
                
                hints: [
                    'Love thy neighbor — charity and service define the faithful',
                    'The promise of eternal life gives soldiers courage in the face of death',
                    'Churches form the backbone of community life and social support',
                    'Sacred scripture guides moral conduct from birth to death',
                    'Missionaries spread the faith, expanding cultural influence worldwide'
                ],
                
                hintThemes: ['salvation', 'love', 'charity', 'church', 'faith']
            },

            // 9. SHAMANISM
            shamanism: {
                id: 'shamanism',
                name: 'Shamanism',
                fullName: 'The Spirit World Path',
                image: 'assets/images/Religion/shamanism.png',
                description: 'An ancient spiritual practice where shamans act as intermediaries between the human world and spirit world, seeking guidance through trance, ritual, and communion with nature spirits.',
                history: 'One of humanity\'s oldest spiritual practices, found across indigenous cultures on every continent throughout history.',
                
                bonuses: {
                    harmony: 0.18,          // +18% natural harmony
                    wisdom: 0.15,           // +15% ancestral knowledge
                    adaptability: 0.15,     // +15% flexibility
                    healing: 0.12,          // +12% traditional medicine
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
                    dietary: 'Traditional',
                    dress: 'Ceremonial'
                },
                
                hints: [
                    'Spirits dwell in every tree, river, and stone — they must be honored',
                    'The shaman journeys between worlds to bring wisdom to the living',
                    'Nature provides all needs; harmony with the land sustains the people',
                    'Ancestral spirits guide the tribe through visions and dreams',
                    'Balance between worlds keeps the community healthy and strong'
                ],
                
                hintThemes: ['spirits', 'harmony', 'nature', 'ancestors', 'healing']
            },

            // 10. JUDAISM
            judaism: {
                id: 'judaism',
                name: 'Judaism',
                fullName: 'Covenant of Abraham and Moses',
                image: 'assets/images/Religion/judaism.png',
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

            // 11. SCIENTOLOGY
            scientology: {
                id: 'scientology',
                name: 'Scientology',
                fullName: 'Church of Scientology',
                image: 'assets/images/Religion/scientology.png',
                description: 'A modern religious movement founded in the 20th century emphasizing personal spiritual growth, self-improvement, and the immortality of the spirit through a system of beliefs and practices.',
                history: 'A contemporary movement emerging in the 1950s, blending spiritual concepts with self-help philosophy into an organized religious institution.',
                
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

            // 12. PASTAFARIANISM
            pastafarianism: {
                id: 'pastafarianism',
                name: 'Pastafarianism',
                fullName: 'Church of the Flying Spaghetti Monster',
                image: 'assets/images/Religion/pastafarianism.png',
                description: 'A satirical religion founded to challenge religious doctrine in public life, venerating the Flying Spaghetti Monster. Followers embrace reason, humor, and skepticism as sacred values.',
                history: 'Founded in 2005 as a parody religion protesting religious influence in education, it has since grown into a genuine community of freethinkers worldwide.',
                
                bonuses: {
                    adaptability: 0.20,     // +20% (flexible beliefs)
                    happiness: 0.20,        // +20% (humor and joy)
                    innovation: 0.18,       // +18% (freethinking)
                    creativity: 0.18,       // +18% artistic expression
                    diplomacy: 0.12         // +12% (inclusive attitude)
                },
                
                penalties: {
                    unity: 0.82,            // -18% (individualism)
                    militaryMorale: 0.88,   // -12% (pacifism)
                    stability: 0.88,        // -12% (irreverence)
                    tradition: 0.75         // -25% (anti-tradition)
                },
                
                practices: {
                    worship: 'Noodly',
                    holyDays: 0,
                    dietary: 'Pasta',
                    dress: 'Pirate'
                },
                
                hints: [
                    'The Flying Spaghetti Monster touches all with His Noodly Appendage',
                    'Freethinking citizens innovate without the shackles of dogma',
                    'Pirates are the original Pastafarians — their decline caused global warming',
                    'RAmen — reason and humor are the highest forms of worship',
                    'No authority can dictate spiritual truth to a free noodle'
                ],
                
                hintThemes: ['humor', 'reason', 'freedom', 'creativity', 'satire']
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
const religionSystemInstance = new ReligionSystem();
window.ReligionSystem = religionSystemInstance;