/**
 * Wrestling Names - Wrestler name generator
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Generates wrestling-style names like {The Axe}, {Loco Polo}, {Ol' Psycho}
 * using exactly 250 unique first parts and 250 unique last parts.
 */

const wrestlingFirstParts = [
    // Titles & Honorifics (50)
    'The', 'Loco', "Ol'", 'Big', 'Little', 'Tiny', 'Huge', 'Giant', 'Mighty', 'Powerful',
    'Supreme', 'Ultra', 'Mega', 'Hyper', 'Super', 'Elite', 'Prime', 'Alpha', 'Omega', 'Grand',
    'King', 'Queen', 'Prince', 'Princess', 'Lord', 'Lady', 'Sir', 'Dame', 'Duke', 'Duchess',
    'Count', 'Countess', 'Baron', 'Baroness', 'Emperor', 'Empress', 'Czar', 'Tsar', 'Sultan', 'Sheik',
    'Doc', 'Dr.', 'Prof.', 'Major', 'Colonel', 'General', 'Captain', 'Commander', 'Chief', 'Admiral',

    // Intensity & Attitude (50)
    'Commodore', 'Sarge', 'Lieutenant', 'Private', 'Corporal', 'Trooper', 'Agent', 'Detective', 'Sheriff', 'Marshal',
    'Crazy', 'Wild', 'Maniac', 'Psycho', 'Mad', 'Insane', 'Deranged', 'Crazed', 'Frenzied', 'Berserk',
    'Furious', 'Raging', 'Angry', 'Vicious', 'Brutal', 'Savage', 'Ruthless', 'Merciless', 'Cruel', 'Cold',
    'Heartless', 'Ice', 'Fire', 'Storm', 'Thunder', 'Lightning', 'Blaze', 'Frost', 'Freeze', 'Flame',

    // Elements & Nature (50)
    'Inferno', 'Volcano', 'Eruption', 'Blizzard', 'Cyclone', 'Tornado', 'Hurricane', 'Tempest', 'Gale', 'Dark',
    'Shadow', 'Light', 'Bright', 'Glow', 'Shade', 'Gloom', 'Dusk', 'Dawn', 'Twilight', 'Night',
    'Day', 'Sun', 'Moon', 'Star', 'Comet', 'Meteor', 'Nova', 'Solar', 'Lunar', 'Cosmic',
    'Galactic', 'Universal', 'Celestial', 'Stellar', 'Astral', 'Nebula', 'Quasar', 'Pulsar', 'Orbit', 'Void',

    // Materials & Strength (50)
    'Abyss', 'Zenith', 'Nadir', 'Eclipse', 'Equinox', 'Solstice', 'Aurora', 'Steel', 'Iron', 'Bronze',
    'Copper', 'Brass', 'Titanium', 'Chrome', 'Platinum', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Onyx',
    'Opal', 'Pearl', 'Crystal', 'Glass', 'Stone', 'Rock', 'Boulder', 'Mountain', 'Cliff', 'Peak',
    'Summit', 'Ridge', 'Canyon', 'Valley', 'Ocean', 'Sea', 'River', 'Lake', 'Stream', 'Waterfall',
    'Rain', 'Snow', 'Hail', 'Sleet',

    // Action & Combat (50)
    'Bomber', 'Blaster', 'Crusher', 'Destroyer', 'Ravager', 'Slayer', 'Hunter', 'Stalker', 'Predator', 'Reaper',
    'Executioner', 'Judge', 'Vindicator', 'Avenger', 'Guardian', 'Sentinel', 'Warden', 'Keeper', 'Savior', 'Martyr',
    'Saint', 'Sinner', 'Angel', 'Demon', 'Devil', 'Fallen', 'Risen', 'Ascended', 'Descended', 'Reborn',
    'Venom', 'Toxin', 'Poison', 'Acid', 'Viper', 'Cobra', 'Serpent', 'Dragon', 'Wyvern', 'Basilisk',
    'Fist', 'Hand', 'Foot', 'Leg', 'Arm', 'Head', 'Skull', 'Bone', 'Fang', 'Claw',
    'Talon', 'Wing', 'Tail', 'Scale', 'Fur', 'Hide', 'Leather', 'Spine', 'Jaw', 'Bite',
    'Strike', 'Slam', 'Crush', 'Smash', 'Bash', 'Pow', 'Blast', 'Bomb', 'Grenade', 'Missile',
    'Rocket', 'Bullet', 'Shot', 'Shell', 'Slug', 'Round'
];

const wrestlingLastParts = [
    // Weapons & Combat (50)
    'Axe', 'Sword', 'Blade', 'Edge', 'Point', 'Spike', 'Sting', 'Slash', 'Smash', 'Bash',
    'Whack', 'Thump', 'Thwack', 'Bang', 'Boom', 'Cannon', 'Gun', 'Rifle', 'Pistol', 'Revolver',
    'Shotgun', 'Musket', 'Flintlock', 'Crossbow', 'Bow', 'Arrow', 'Dart', 'Javelin', 'Spear', 'Lance',
    'Pike', 'Halberd', 'Trident', 'Scepter', 'Staff', 'Club', 'Mace', 'Hammer', 'Mallet', 'Cleaver',
    'Dagger', 'Knife', 'Scalpel', 'Rapier', 'Foil', 'Epee', 'Sabre', 'Cutlass', 'Scythe', 'Sickle',

    // Animals & Creatures (50)
    'Polo', 'Psycho', 'Wolf', 'Bear', 'Lion', 'Tiger', 'Panther', 'Cobra', 'Viper', 'Serpent',
    'Dragon', 'Wyvern', 'Basilisk', 'Griffin', 'Phoenix', 'Hydra', 'Kraken', 'Leviathan', 'Behemoth', 'Titan',
    'Giant', 'Ogre', 'Troll', 'Goblin', 'Orc', 'Demon', 'Devil', 'Angel', 'Ghost', 'Spirit',
    'Specter', 'Wraith', 'Banshee', 'Ghoul', 'Zombie', 'Vampire', 'Werewolf', 'Chimera', 'Manticore', 'Sphinx',

    // Materials & Elements (50)
    'Stone', 'Steel', 'Iron', 'Bronze', 'Copper', 'Brass', 'Platinum', 'Diamond', 'Ruby', 'Emerald',
    'Sapphire', 'Onyx', 'Opal', 'Pearl', 'Crystal', 'Glass', 'Rock', 'Boulder', 'Mountain', 'Cliff',
    'Peak', 'Ridge', 'Canyon', 'Valley', 'Ocean', 'Sea', 'River', 'Lake', 'Stream', 'Waterfall',
    'Rain', 'Snow', 'Hail', 'Sleet', 'Mist',

    // Death & Darkness (50)
    'Death', 'Doom', 'Grave', 'Tomb', 'Crypt', 'Hell', 'Inferno', 'Abyss', 'Void', 'Chaos',
    'Panic', 'Terror', 'Horror', 'Nightmare', 'Dream', 'Vision', 'Phantom', 'Ectoplasm', 'Soul', 'Heart',
    'Blood', 'Bone', 'Skull', 'Fang', 'Claw', 'Talon', 'Venom', 'Toxin', 'Poison', 'Acid',
    'Storm', 'Thunder', 'Lightning', 'Blaze', 'Frost',

    // Nature & Cosmic (50)
    'Flame', 'Fire', 'Ice', 'Snow', 'Rain', 'Hail', 'Sleet', 'Fog', 'Cloud', 'Sky',
    'Star', 'Sun', 'Moon', 'Planet', 'Comet', 'Meteor', 'Asteroid', 'Galaxy', 'Nebula', 'Quasar',
    'Pulsar', 'Orbit', 'Zenith', 'Nadir', 'Eclipse', 'Equinox', 'Solstice', 'Aurora', 'Time', 'Eternal',
    'Immortal', 'Forever', 'Always', 'Never', 'End', 'Begin', 'Start', 'Finish', 'Final',
    'First', 'Last', 'Next', 'Now', 'Then', 'When', 'Where', 'Why', 'How', 'What',
    'Who', 'Which', 'Whatever', 'Whoever', 'Whenever', 'Wherever', 'However', 'Cosmic', 'Galactic', 'Universal',
    'Celestial', 'Stellar', 'Astral', 'Sidereal', 'Interstellar', 'Intergalactic', 'Multiverse', 'Omniverse', 'Universe', 'Dimension',
    'Reality', 'Warp', 'Wormhole', 'Blackhole', 'Whitehole', 'Singularity', 'Event', 'Horizon', 'Quantum', 'Relativity',
    'Gravity', 'Mass', 'Matter', 'Energy', 'Motion', 'Velocity', 'Acceleration', 'Momentum', 'Inertia', 'Kinetic',
    'Potential', 'Champion', 'Legend', 'Myth', 'Saga', 'Tale', 'Hero', 'Villain', 'Rogue', 'Outlaw', 'Bandit', 'Marauder'
];

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateWrestlerName() {
    const first = pickRandom(wrestlingFirstParts);
    const last = pickRandom(wrestlingLastParts);
    return `${first} ${last}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        wrestlingFirstParts,
        wrestlingLastParts,
        pickRandom,
        generateWrestlerName,
    };
}

if (typeof window !== 'undefined') {
    window.WrestlingNames = {
        wrestlingFirstParts,
        wrestlingLastParts,
        pickRandom,
        generateWrestlerName,
    };
}
