/**
 * Sports Injuries Data - {injury} + {part} combinations per severity level
 * Dominion Wars - Nation Building Strategy Game
 *
 * Each severity level has many injury/part combinations. The generator
 * picks one injury word and one body part to create unique injuries like
 * "Severed Foot", "Poked Eye", "Ruptured Spleen", etc.
 */

const injuryParts = [
    // Extremities (20)
    'ankle', 'knee', 'shoulder', 'elbow', 'wrist', 'thumb', 'finger', 'toe', 'foot', 'shin',
    'calf', 'quadricep', 'hamstring', 'groin', 'hip', 'heel', 'achilles', 'sole', 'arch', 'ball',
    // Head & Neck (15)
    'back', 'neck', 'spine', 'ribcage', 'collarbone', 'pelvis', 'skull', 'jaw', 'nose', 'eye',
    'ear', 'lip', 'cheekbone', 'temple', 'scalp',
    // Torso & Internal (12)
    'lung', 'kidney', 'liver', 'spleen', 'heart', 'disc', 'brain', 'spinal cord', 'abdomen', 'chest',
    'groin', 'tailbone',
    // Hands & Arms (10)
    'palm', 'knuckle', 'forearm', 'bicep', 'triceps', 'rotator cuff', 'clavicle', 'scapula', 'humerus', 'radius',
    // Legs & Feet (8)
    'thigh', 'shinbone', 'femur', 'patella', 'achilles tendon', 'plantar fascia', 'metatarsal', 'calcaneus',
];

const injuryBySeverity = {
    // ── Severity 1: Knock - Still Able to Play (0 games) ──
    1: [
        { injury: 'Bruised', part: 'thigh' }, { injury: 'Sore', part: 'muscle' },
        { injury: 'Twisted', part: 'ankle' }, { injury: 'Strained', part: 'ligament' },
        { injury: 'Banged', part: 'elbow' }, { injury: 'Jammed', part: 'thumb' },
        { injury: 'Minor Contusion', part: 'knee' }, { injury: 'Light Sprain', part: 'wrist' },
        { injury: 'Stung', part: 'eye' }, { injury: 'Nicked', part: 'ear' },
        { injury: 'Bumped', part: 'head' }, { injury: 'Chafed', part: 'skin' },
        { injury: 'Pinched', part: 'nerve' }, { injury: 'Tweaked', part: 'back' },
        { injury: 'Scratched', part: 'cornea' }, { injury: 'Bashed', part: 'shin' },
        { injury: 'Stung', part: 'nose' }, { injury: 'Rubbed', part: 'raw' },
        { injury: 'Poked', part: 'eye' }, { injury: 'Tapped', part: 'elbow' },
        { injury: 'Whacked', part: 'funny bone' }, { injury: 'Stung', part: 'lip' },
        { injury: 'Graze', part: 'scalp' }, { injury: 'Minor Abrasion', part: 'skin' },
        { injury: 'Light Cramp', part: 'calf' }, { injury: 'Slight Twist', part: 'wrist' },
        { injury: 'Tender', part: 'shin' }, { injury: 'Minor Bump', part: 'head' },
        { injury: 'Light Pinch', part: 'nerve' }, { injury: 'Slight Strain', part: 'back' },
        { injury: 'Minor Scrape', part: 'knee' }, { injury: 'Light Bruise', part: 'thigh' },
        { injury: 'Slight Tweak', part: 'shoulder' }, { injury: 'Minor Stinger', part: 'neck' },
        { injury: 'Light Spasm', part: 'muscle' }, { injury: 'Minor Twinge', part: 'hip' },
        { injury: 'Light Crick', part: 'neck' }, { injury: 'Minor Ache', part: 'foot' },
    ],

    // ── Severity 2: Minor Injury - 1 Game Out ──
    2: [
        { injury: 'Sprained', part: 'ankle' }, { injury: 'Pulled', part: 'hamstring' },
        { injury: 'Strained', part: 'groin' }, { injury: 'Twisted', part: 'knee' },
        { injury: 'Hyperextended', part: 'elbow' }, { injury: 'Dislocated', part: 'finger' },
        { injury: 'Minor Tear', part: 'ligament' }, { injury: 'Inflamed', part: 'tendon' },
        { injury: 'Cut', part: 'eyebrow' }, { injury: 'Split', part: 'lip' },
        { injury: 'Pulled', part: 'calf' }, { injury: 'Strained', part: 'neck' },
        { injury: 'Twisted', part: 'wrist' }, { injury: 'Banged', part: 'funny bone' },
        { injury: 'Scraped', part: 'knee' }, { injury: 'Bruised', part: 'ribs' },
        { injury: 'Sprained', part: 'wrist' }, { injury: 'Pulled', part: 'quad' },
        { injury: 'Stung', part: 'eye' }, { injury: 'Grazed', part: 'scalp' },
        { injury: 'Sprained', part: 'toe' }, { injury: 'Pulled', part: 'shin' },
        { injury: 'Strained', part: 'wrist' }, { injury: 'Minor Tear', part: 'tendon' },
        { injury: 'Cut', part: 'chin' }, { injury: 'Split', part: 'eyebrow' },
        { injury: 'Pulled', part: 'neck' }, { injury: 'Strained', part: 'ankle' },
        { injury: 'Twisted', part: 'toe' }, { injury: 'Banged', part: 'shin' },
        { injury: 'Scraped', part: 'elbow' }, { injury: 'Bruised', part: 'heel' },
        { injury: 'Sprained', part: 'thumb' }, { injury: 'Pulled', part: 'adductor' },
        { injury: 'Strained', part: 'calf' }, { injury: 'Minor Tear', part: 'fascia' },
        { injury: 'Cut', part: 'knuckle' },
        { injury: 'Pulled', part: 'groin' }, { injury: 'Strained', part: 'shoulder' },
    ],

    // ── Severity 3: Moderate Injury - Multiple Games Out ──
    3: [
        { injury: 'Torn', part: 'meniscus' }, { injury: 'Sprained', part: 'ACL' },
        { injury: 'Fractured', part: 'rib' }, { injury: 'Pulled', part: 'quadricep' },
        { injury: 'Strained', part: 'back' }, { injury: 'Bruised', part: 'spine' },
        { injury: 'Dislocated', part: 'shoulder' }, { injury: 'Torn', part: 'labrum' },
        { injury: 'Fractured', part: 'nose' }, { injury: 'Cut', part: 'eyelid' },
        { injury: 'Dislocated', part: 'elbow' }, { injury: 'Torn', part: 'rotator cuff' },
        { injury: 'Fractured', part: 'wrist' }, { injury: 'Pulled', part: 'groin' },
        { injury: 'Strained', part: 'neck' }, { injury: 'Bruised', part: 'kidney' },
        { injury: 'Dislocated', part: 'toe' }, { injury: 'Torn', part: 'calf' },
        { injury: 'Fractured', part: 'cheekbone' }, { injury: 'Cut', part: 'chin' },
        { injury: 'Torn', part: 'hamstring' }, { injury: 'Sprained', part: 'MCL' },
        { injury: 'Fractured', part: 'collarbone' }, { injury: 'Pulled', part: 'abductor' },
        { injury: 'Strained', part: 'lower back' }, { injury: 'Bruised', part: 'lung' },
        { injury: 'Dislocated', part: 'thumb' }, { injury: 'Torn', part: 'bicep' },
        { injury: 'Fractured', part: 'hand' }, { injury: 'Pulled', part: 'neck' },
        { injury: 'Strained', part: 'wrist' }, { injury: 'Bruised', part: 'liver' },
        { injury: 'Dislocated', part: 'ankle' }, { injury: 'Torn', part: 'triceps' },
        { injury: 'Fractured', part: 'ankle' }, { injury: 'Pulled', part: 'hamstring' },
        { injury: 'Strained', part: 'groin' }, { injury: 'Bruised', part: 'spleen' },
        { injury: 'Dislocated', part: 'wrist' }, { injury: 'Torn', part: 'forearm' },
        { injury: 'Fractured', part: 'foot' }, { injury: 'Pulled', part: 'calf' },
    ],

    // ── Severity 4: Season Ending ──
    4: [
        { injury: 'Torn', part: 'achilles' }, { injury: 'Ruptured', part: 'achilles' },
        { injury: 'Broken', part: 'leg' }, { injury: 'Fractured', part: 'tibia' },
        { injury: 'Severe Tear', part: 'ACL' }, { injury: 'Broken', part: 'collarbone' },
        { injury: 'Ruptured', part: 'disc' }, { injury: 'Severe Sprain', part: 'ankle' },
        { injury: 'Torn', part: 'meniscus' }, { injury: 'Broken', part: 'arm' },
        { injury: 'Fractured', part: 'ankle' }, { injury: 'Severed', part: 'toe' },
        { injury: 'Dislocated', part: 'shoulder' }, { injury: 'Torn', part: 'bicep' },
        { injury: 'Fractured', part: 'hip' }, { injury: 'Ruptured', part: 'spleen' },
        { injury: 'Torn', part: 'hamstring' }, { injury: 'Broken', part: 'foot' },
        { injury: 'Fractured', part: 'skull' }, { injury: 'Severed', part: 'finger' },
        { injury: 'Torn', part: 'ACL' },
        { injury: 'Fractured', part: 'femur' }, { injury: 'Severed', part: 'thumb' },
        { injury: 'Dislocated', part: 'knee' }, { injury: 'Torn', part: 'quadricep' },
        { injury: 'Fractured', part: 'wrist' }, { injury: 'Ruptured', part: 'kidney' },
        { injury: 'Torn', part: 'rotator cuff' }, { injury: 'Broken', part: 'rib' },
        { injury: 'Fractured', part: 'spine' }, { injury: 'Severed', part: 'ear' },
        { injury: 'Dislocated', part: 'elbow' }, { injury: 'Torn', part: 'pectoral' },
        { injury: 'Fractured', part: 'hand' }, { injury: 'Ruptured', part: 'liver' },
        { injury: 'Torn', part: 'glute' }, { injury: 'Broken', part: 'ankle' },
        { injury: 'Fractured', part: 'heel' }, { injury: 'Severed', part: 'nose' },
    ],

    // ── Severity 5: Career Ending ──
    5: [
        { injury: 'Severed', part: 'achilles' }, { injury: 'Destroyed', part: 'knee' },
        { injury: 'Shattered', part: 'leg' }, { injury: 'Severed', part: 'spinal cord' },
        { injury: 'Permanent Damage', part: 'brain' }, { injury: 'Crushed', part: 'pelvis' },
        { injury: 'Permanent Nerve Damage', part: 'spine' }, { injury: 'Complete Tear', part: 'rotator cuff' },
        { injury: 'Severed', part: 'foot' }, { injury: 'Poked', part: 'eye' },
        { injury: 'Destroyed', part: 'hip' }, { injury: 'Shattered', part: 'skull' },
        { injury: 'Destroyed', part: 'ankle' },
        { injury: 'Permanent Damage', part: 'eye' }, { injury: 'Crushed', part: 'hand' },
        { injury: 'Severed', part: 'arm' }, { injury: 'Destroyed', part: 'wrist' },
        { injury: 'Shattered', part: 'pelvis' },
        { injury: 'Severed', part: 'leg' }, { injury: 'Destroyed', part: 'shoulder' },
        { injury: 'Permanent Damage', part: 'lung' }, { injury: 'Crushed', part: 'chest' },
        { injury: 'Severed', part: 'hand' }, { injury: 'Destroyed', part: 'foot' },
        { injury: 'Permanent Damage', part: 'kidney' }, { injury: 'Crushed', part: 'throat' },
        { injury: 'Severed', part: 'achilles tendon' }, { injury: 'Destroyed', part: 'neck' },
    ],
};

// Severity metadata
const severityMeta = {
    1: { name: 'Knock', gamesOut: 0, description: 'Still Able to Play' },
    2: { name: 'Minor Injury', gamesOut: 1, description: '1 Game Out' },
    3: { name: 'Moderate Injury', gamesOut: 5, description: 'Multiple Games Out' },
    4: { name: 'Severe Injury', gamesOut: null, description: 'Injured for Season' },
    5: { name: 'Career Ending', gamesOut: null, description: 'Career Ending Injury' },
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateInjuryName(severity) {
    const options = injuryBySeverity[severity];
    if (!options || options.length === 0) return 'Unknown Injury';
    const option = pickRandom(options);
    return `${option.injury} ${option.part}`;
}

function getSeverityMeta(severity) {
    return severityMeta[severity] || severityMeta[1];
}

// Export for Node.js / require
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        injuryParts,
        injuryBySeverity,
        severityMeta,
        pickRandom,
        generateInjuryName,
        getSeverityMeta,
    };
}

// Expose globally for browser context and VM bundling
if (typeof window !== 'undefined') {
    window.SportsInjuries = {
        injuryParts,
        injuryBySeverity,
        severityMeta,
        pickRandom,
        generateInjuryName,
        getSeverityMeta,
    };
    window.injuryParts = injuryParts;
    window.injuryBySeverity = injuryBySeverity;
    window.severityMeta = severityMeta;
}
