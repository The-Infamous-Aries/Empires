/**
 * Casino Card Set Registry — Live Blackjack Multi-Card-Set Support
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Static registry mapping each card set ID to its asset paths and naming functions.
 * Used by the client to resolve image URLs for rendering cards.
 *
 * Card art is resolved client-side using this registry. The server deals logical
 * cards (suit + rank only) and never sends image paths. Each player's browser
 * renders cards using their own selected card set (settings.ui.cardSet).
 */

const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const CARD_SET_REGISTRY = {
  artistic: {
    name: 'Artistic',
    folder: 'assets/images/Cards/Artistic/',
    back: null, // no back image found; use CSS/emoji fallback
    cardPath(suit, rank) {
      const suitMap = { clubs: 'club', diamonds: 'diamond', hearts: 'heart', spades: 'spade' };
      const rankMap = { A: '0001', '2': '0002', '3': '0003', '4': '0004', '5': '0005', '6': '0006', '7': '0007', '8': '0008', '9': '0009', '10': '0010', J: '0011', Q: '0012', K: '0013' };
      return `${this.folder}${suitMap[suit]}_${rankMap[rank]}.png`;
    }
  },
  classic: {
    name: 'Classic',
    folder: 'assets/images/Cards/Classic/',
    back: 'assets/images/Cards/Classic/Red-Cardback.png',
    // Classic uses separate folder name (singular) vs filename suit name (plural)
    // 8 of Diamonds file is named 'EIght-Of-Diamonds.png' (capital EI)
    suitFolder: { clubs: 'Clover', diamonds: 'Diamond', hearts: 'Hearts', spades: 'Spades' },
    suitFile:   { clubs: 'Clovers', diamonds: 'Diamonds', hearts: 'Hearts', spades: 'Spades' },
    rankMap:    { A: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'EIght', '9': 'Nine', '10': 'Ten', J: 'Jack', Q: 'Queen', K: 'King' },
    cardPath(suit, rank) {
      return `${this.folder}${this.suitFolder[suit]}/${this.rankMap[rank]}-Of-${this.suitFile[suit]}.png`;
    }
  },
  dark: {
    name: 'Dark',
    folder: 'assets/images/Cards/Dark/',
    back: 'assets/images/Cards/Dark/BACK.png',
    cardPath(suit, rank) {
      const suitMap = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'P' };
      return `${this.folder}${rank}-${suitMap[suit]}.png`;
    }
  },
  light: {
    name: 'Light',
    folder: 'assets/images/Cards/Light/',
    back: 'assets/images/Cards/Light/BACK.png',
    cardPath(suit, rank) {
      const suitMap = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
      return `${this.folder}${rank}-${suitMap[suit]}.png`;
    }
  },
  'off-white': {
    name: 'Off-White',
    folder: 'assets/images/Cards/Off-White/',
    back: 'assets/images/Cards/Off-White/back-black.png',
    cardPath(suit, rank) {
      const suitMap = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
      return `${this.folder}${rank}-${suitMap[suit]}.png`;
    }
  },
  'white-red': {
    name: 'White & Red tinted',
    folder: 'assets/images/Cards/White & Red tinted/',
    back: 'assets/images/Cards/White & Red tinted/back_red_basic.png',
    cardPath(suit, rank, variant = 'regular') {
      const suitMap = { clubs: 'clubs', diamonds: 'diamonds', hearts: 'hearts', spades: 'spades' };
      const rankMap = { A: 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10', J: 'jack', Q: 'queen', K: 'king' };
      const suffix = variant === 'white' ? '_white' : '';
      return `${this.folder}${rankMap[rank]}_${suitMap[suit]}${suffix}.png`;
    }
  }
};

// Default card set if no preference is stored
const DEFAULT_CARD_SET = 'white-red';

/**
 * Validate suit and rank values.
 * @param {string} suit
 * @param {string} rank
 * @throws {Error} If suit or rank is invalid
 */
function _validateCard(suit, rank) {
  if (!SUITS.includes(suit)) {
    throw new Error(`Invalid suit: ${suit}. Must be one of ${SUITS.join(', ')}`);
  }
  if (!RANKS.includes(rank)) {
    throw new Error(`Invalid rank: ${rank}. Must be one of ${RANKS.join(', ')}`);
  }
}

/**
 * Resolve a card image URL for a given card set.
 * Falls back to default set if the requested set is not found.
 * @param {string} cardSet - Card set ID
 * @param {string} suit - Card suit (clubs, diamonds, hearts, spades)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @param {string} variant - Optional variant (e.g. 'white' for white-red)
 * @returns {string} Asset path
 */
function resolveCardPath(cardSet, suit, rank, variant = 'regular') {
  _validateCard(suit, rank);
  const setDef = CARD_SET_REGISTRY[cardSet];
  if (!setDef) {
    if (cardSet === DEFAULT_CARD_SET) {
      throw new Error(`Default card set '${DEFAULT_CARD_SET}' not found in registry`);
    }
    return resolveCardPath(DEFAULT_CARD_SET, suit, rank, variant);
  }
  return setDef.cardPath(suit, rank, variant);
}

/**
 * Resolve a card back image URL for a given card set.
 * @param {string} cardSet - Card set ID
 * @returns {string} Asset path or emoji fallback
 */
function resolveCardBack(cardSet) {
  const setDef = CARD_SET_REGISTRY[cardSet];
  if (!setDef) {
    if (cardSet === DEFAULT_CARD_SET) {
      return '🂠';
    }
    return resolveCardBack(DEFAULT_CARD_SET);
  }
  return setDef.back || '🂠';
}

/**
 * Get all available card set IDs.
 * @returns {string[]}
 */
function getCardSetIds() {
  return Object.keys(CARD_SET_REGISTRY);
}

/**
 * Get card set display name by ID.
 * @param {string} cardSet
 * @returns {string}
 */
function getCardSetName(cardSet) {
  const setDef = CARD_SET_REGISTRY[cardSet];
  return setDef ? setDef.name : CARD_SET_REGISTRY[DEFAULT_CARD_SET].name;
}

/**
 * Get preview card paths for the settings UI dropdown.
 * Returns 4 alternating patterns, each with 2 cards (Diamonds or Spades suits only).
 * @param {string} cardSet
 * @returns {Array<{card1: string, card2: string}>}
 */
function getCardSetPreviews(cardSet) {
  const setDef = CARD_SET_REGISTRY[cardSet];
  if (!setDef) {
    return getCardSetPreviews(DEFAULT_CARD_SET);
  }

  const patterns = [
    { rank1: 'K', suit1: 'diamonds', rank2: '6', suit2: 'spades' },
    { rank1: 'Q', suit1: 'spades',   rank2: '9', suit2: 'diamonds' },
    { rank1: 'K', suit1: 'spades',   rank2: '6', suit2: 'diamonds' },
    { rank1: 'Q', suit1: 'diamonds', rank2: '9', suit2: 'spades' },
  ];

  return patterns.map(p => ({
    card1: setDef.cardPath(p.suit1, p.rank1),
    card2: setDef.cardPath(p.suit2, p.rank2),
  }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CARD_SET_REGISTRY,
    DEFAULT_CARD_SET,
    SUITS,
    RANKS,
    resolveCardPath,
    resolveCardBack,
    getCardSetIds,
    getCardSetName,
    getCardSetPreviews,
  };
}
if (typeof window !== 'undefined') {
  window.CARD_SET_REGISTRY = CARD_SET_REGISTRY;
  window.DEFAULT_CARD_SET = DEFAULT_CARD_SET;
  window.resolveCardPath = resolveCardPath;
  window.resolveCardBack = resolveCardBack;
  window.getCardSetIds = getCardSetIds;
  window.getCardSetName = getCardSetName;
  window.getCardSetPreviews = getCardSetPreviews;
}
