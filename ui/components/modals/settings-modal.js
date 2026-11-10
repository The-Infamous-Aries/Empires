"use strict";
/**
 * SettingsModal — Account-wide settings panel rendered inside <dialog id="nation-dialog">
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Opens from the account icon dropdown ("Settings") via openModal("settings").
 * Takes over the modal dialog while the game tabs remain visible behind it, so the
 * user can toggle Settings off without saving (discard) or click "Keep Changes" to
 * persist every section at once.
 *
 * Sections:
 *   • Display      — Theme, Text Size, Name Font, Name Color (2 sections × 40 swatches)
 *   • Music        — On/Off toggle + Volume slider (drives music.js)
 *   • Custom Images— Flag, Military Units (7), Food, Water, National Pet (icon + type + image)
 *
 * Exports: window.SettingsModal — { render(state) -> HTML string }
 *
 * Wiring:
 *   game.js renders this via renderModal() when modalMode === "settings".
 *   Submit → command("settings", { group, key, value }) for each changed field,
 *   then receive() applies theme / text-size / name font-color / music live.
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/* ══════════════════════════════════════════════════════════════════════════
   FOOD / WATER / PET — matches AccountCreation.js culture lists
   ══════════════════════════════════════════════════════════════════════════ */

const FOOD_KEYS = [
  'pizza','steak','cake','cookie','burger','donut','hotdog','ramen','salad','sushi','taco'
];
const WATER_KEYS = [
  'water','beer','coffee','juice','milk','milkshake','smoothie','soda','wine','liquor','energy-drink'
];
const PET_DEFAULT = 'none';
const PET_ICONS = [
  'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
  'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
  'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
  'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
  'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
  'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
  'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
  'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
  'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
  'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra'
];

/* ══════════════════════════════════════════════════════════════════════════
   THEMES / TEXT SIZE / FONTS
   ══════════════════════════════════════════════════════════════════════════ */

const THEMES = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "sea", label: "Ocean" },
  { key: "fire", label: "Fire" },
  { key: "forest", label: "Forest" },
  { key: "royal", label: "Royal" },
  { key: "neon", label: "Neon" },
  { key: "cyberpunk", label: "Cyberpunk" },
  { key: "sunset", label: "Sunset" },
  { key: "arctic", label: "Arctic" },
];

const TEXT_SIZES = [
  { key: "small", label: "Small", scale: 0.875 },
  { key: "normal", label: "Standard", scale: 1 },
  { key: "large", label: "Large", scale: 1.125 },
  { key: "larger", label: "Larger", scale: 1.25 },
];

/* 12 name fonts */
const NAME_FONTS = [
  { key: "system", label: "System", css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { key: "serif", label: "Serif", css: 'Georgia, "Times New Roman", Times, serif' },
  { key: "monospace", label: "Monospace", css: '"Courier New", Courier, monospace' },
  { key: "cursive", label: "Cursive", css: '"Comic Sans MS", "Chalkboard SE", cursive' },
  { key: "fantasy", label: "Fantasy", css: 'Impact, Charcoal, sans-serif' },
  { key: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { key: "arial", label: "Arial", css: 'Arial, Helvetica, sans-serif' },
  { key: "verdana", label: "Verdana", css: 'Verdana, Geneva, sans-serif' },
  { key: "trebuchet", label: "Trebuchet", css: '"Trebuchet MS", sans-serif' },
  { key: "gotham", label: "Gotham", css: '"Segoe UI", "Helvetica Neue", sans-serif' },
  { key: "palatino", label: "Palatino", css: 'Palatino, "Book Antiqua", serif' },
  { key: "garamond", label: "Garamond", css: 'Garamond, "Times New Roman", serif' },
];

/* Name colors: 2 sections × 40 swatches each (identical palette).
   4 neutrals + 12 color-wheel colors × 3 shades (light/normal/dark) = 40 */
const NAME_COLOR_PALETTE = [
  /* Neutrals */
  "#ffffff", "#e5e5e5", "#4a4a4a", "#000000",
  /* Red */
  "#fca5a5", "#ef4444", "#7f1d1d",
  /* Orange */
  "#fdba74", "#f97316", "#7c2d12",
  /* Yellow */
  "#fef08a", "#eab308", "#713f12",
  /* Amber */
  "#fde68a", "#f59e0b", "#713f12",
  /* Lime */
  "#bef264", "#84cc16", "#3f6212",
  /* Green */
  "#86efac", "#22c55e", "#14532d",
  /* Emerald */
  "#6ee7b7", "#10b981", "#0f766e",
  /* Cyan */
  "#67e8f9", "#06b6d4", "#0e7490",
  /* Blue */
  "#93c5fd", "#3b82f6", "#1d4ed8",
  /* Indigo */
  "#a78bfa", "#6366f1", "#3730a3",
  /* Purple */
  "#d8b4fe", "#a855f7", "#6b21a8",
  /* Pink */
  "#fda4af", "#ec4899", "#9d174d",
];
const NAME_COLOR_SECTION_1 = [...NAME_COLOR_PALETTE];
const NAME_COLOR_SECTION_2 = [...NAME_COLOR_PALETTE];

const MILITARY_UNIT_KEYS = [
  { key: "soldier", label: "Soldier" },
  { key: "tank", label: "Tank" },
  { key: "aircraft", label: "Aircraft" },
  { key: "ships", label: "Ships" },
  { key: "spies", label: "Spies" },
  { key: "missiles", label: "Missiles" },
  { key: "nukes", label: "Nukes" },
];

const CULTURE_KEYS = [
  { key: "nationalFood", label: "Food", keys: FOOD_KEYS },
  { key: "nationalWater", label: "Water", keys: WATER_KEYS },
  { key: "nationalPet", label: "National Pet", keys: PET_ICONS },
];

class SettingsModalSystem {
    constructor() {
        this.state = null;
        this.pending = null;   // deep copy of settings being edited
        this.files = {};       // key -> File for image uploads
        this.previews = {};    // key -> data URL preview
    }

    /* ════════════════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════════════ */

    render(state) {
        this.state = state;
        const p = state && state.player ? state.player.settings : {};
        const ui = p.ui || {};
        const custom = p.customImages || {};
        this.pending = JSON.parse(JSON.stringify({
            theme: ui.theme || "dark",
            textSize: ui.textSize || "normal",
            nameFont: ui.nameFont || "system",
            nameColor: ui.nameColor || "#e9ecec",
            nameColorAccent: ui.nameColorAccent || "#a8a8a8",
            diceType: ui.diceType || "white",
            diceStyle: ui.diceStyle || "dots",
            cardSet: ui.cardSet || "Classic",
            musicEnabled: ui.musicEnabled !== undefined ? ui.musicEnabled : true,
            musicVolume: ui.musicVolume !== undefined ? ui.musicVolume : 0.35,
            flagImage: custom.flagImage || null,
            militaryUnits: custom.militaryUnits || {},
            nationalFood: custom.nationalFood || { type: FOOD_KEYS[0], text: "" },
            nationalWater: custom.nationalWater || { type: WATER_KEYS[0], text: "" },
            nationalPet: custom.nationalPet || { type: PET_DEFAULT, text: "" },
        }));

        return `
<div class="settings-panel" id="settings-panel">
  <div class="settings-overlay" id="settings-overlay"></div>
  <div class="settings-content">
    <div class="settings-header">
      <h2>⚙ Settings</h2>
      <p class="settings-muted">Changes apply when you keep them. Close without keeping to discard.</p>
      <button class="settings-close" id="settings-close" title="Close settings" aria-label="Close settings">✕</button>
    </div>

    <div class="settings-body">
      <div class="settings-tabs">
        <button class="settings-tab active" data-section="display">🎨 Display</button>
        <button class="settings-tab" data-section="music">🎵 Music</button>
        <button class="settings-tab" data-section="images">🖼 Custom Images</button>
      </div>

      <div class="settings-tab-content">
        <!-- Display -->
        <div class="settings-tab-pane active" id="settings-pane-display">
          <div class="settings-section">
            <h3>Theme</h3>
            <p class="settings-description">Choose the game's overall look. Faction color trim always shows through.</p>
            <div class="theme-grid">${this._themeGrid()}</div>
          </div>

          <div class="settings-section">
            <h3>Text Size</h3>
            <p class="settings-description">Scales text across the entire game for you.</p>
            <div class="text-size-options">${this._textSizeGrid()}</div>
          </div>

          <div class="settings-section">
            <h3>Name Font</h3>
            <p class="settings-description">How your ruler/nation name appears throughout the game.</p>
            <div class="font-selector-wrap">
              <select id="settings-name-font">${this._fontOptions()}</select>
            </div>
          </div>

          <div class="settings-section name-customization">
            <h3>Name Color</h3>
            <p class="settings-description">Pick a primary and an accent color for your name across the game.</p>
            <div class="name-preview-box">
              <div class="name-preview-text" id="settings-name-preview">Your Nation</div>
              <div class="settings-muted" style="font-size:0.72rem;margin-top:6px;">Preview</div>
            </div>
            <div class="color-columns">
              <div class="color-block">
                <div class="color-block-title">Primary</div>
                <div class="color-swatches">${this._swatches("nameColor", NAME_COLOR_SECTION_1)}</div>
              </div>
              <div class="color-block">
                <div class="color-block-title">Accent</div>
                <div class="color-swatches">${this._swatches("nameColorAccent", NAME_COLOR_SECTION_2)}</div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Dice Color</h3>
            <p class="settings-description">Pick the color of your dice at the Gamblers Dice table. This affects how dice look to <em>you</em> when you roll.</p>
            <div class="color-swatches">${this._diceColorSwatches()}</div>
          </div>

          <div class="settings-section">
            <h3>D6 Display Style</h3>
            <p class="settings-description">Choose whether D6 dice show dots (pips) or digits (numbers) when you roll them.</p>
            <div class="preference-item">
              <label class="toggle-switch">
                <input type="checkbox" id="settings-dice-digits" ${this.pending.diceStyle === "digits" ? "checked" : ""}>
                <span class="toggle-slider"></span>
              </label>
              <span class="preference-label">Show digits on D6 instead of dots</span>
            </div>
          </div>

          <div class="settings-section">
            <h3>Card Set</h3>
            <p class="settings-description">Choose the playing card art style used at the Blackjack table. This affects how cards look to <em>you</em> when you play.</p>
            <select id="settings-card-set">${this._cardSetOptions()}</select>
          </div>
        </div>

        <!-- Music -->
        <div class="settings-tab-pane" id="settings-pane-music">
          <div class="settings-section">
            <h3>Background Music</h3>
            <p class="settings-description">Peace songs play outside war; war songs play during preparation and active wars.</p>
            <div class="preference-item">
              <span>
                <span class="preference-label">Enable background music</span>
                <div class="settings-muted">Hear the world as you play.</div>
              </span>
              <label class="toggle-switch">
                <input type="checkbox" id="settings-music-enabled" ${this.pending.musicEnabled ? "checked" : ""}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="preference-item">
              <span>
                <span class="preference-label">Music Volume</span>
                <div class="settings-muted">Controls background music loudness.</div>
              </span>
              <div style="display:flex;align-items:center;gap:8px;">
                <output id="settings-music-volume-value">${Math.round(this.pending.musicVolume * 100)}%</output>
                <input type="range" id="settings-music-volume" min="0" max="100" step="1" value="${Math.round(this.pending.musicVolume * 100)}" style="flex:1;">
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Images -->
        <div class="settings-tab-pane" id="settings-pane-images">
          <div class="settings-section">
            <h3>Nation Flag</h3>
            <p class="settings-description">Upload a custom flag image for your nation.</p>
            <div class="avatar-upload">
              <div class="current-avatar" id="settings-flag-preview">
                ${this.pending.flagImage ? `<img src="${esc(this.pending.flagImage)}" alt="Flag">` : '<div class="settings-muted">No flag</div>'}
              </div>
              <div class="avatar-controls">
                <label class="file-upload">
                  <input type="file" id="settings-flag-file" accept="image/png,image/jpeg,image/svg+xml" data-key="flagImage">
                  <span>Upload Flag</span>
                </label>
                ${this.pending.flagImage ? `<button type="button" class="section danger" data-action="clear-flag">Clear</button>` : ""}
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Military Unit Icons</h3>
            <p class="settings-description">Upload custom icons for your military units (optional).</p>
            <div class="military-grid">${MILITARY_UNIT_KEYS.map(u => this._militaryUnit(u)).join("")}</div>
          </div>

          ${CULTURE_KEYS.map(c => this._cultureBlock(c)).join("")}
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <div class="settings-actions">
        <button type="button" class="settings-reset" id="settings-discard">Discard changes</button>
      </div>
      <button type="button" class="btn primary" id="settings-keep">Keep Changes</button>
    </div>
  </div>
</div>`;
    }

    /* ════════════════════════════════════════════════════════════════════════
       SUB-RENDERERS
       ═══════════════════════════════════════════════════════════════════════ */

    _themeGrid() {
        return THEMES.map(t => {
            const selected = t.key === this.pending.theme ? " selected" : "";
            return `
            <label class="theme-option${selected}">
              <input type="radio" name="settings-theme" value="${esc(t.key)}"${selected ? " checked" : ""} style="display:none">
              <div class="theme-preview">
                <div class="theme-sample-bg">
                  <div class="theme-sample-primary"></div>
                  <div class="theme-sample-secondary"></div>
                  <div class="theme-sample-accent"></div>
                </div>
              </div>
              <div class="theme-name">${esc(t.label)}</div>
            </label>`;
        }).join("");
    }

    _textSizeGrid() {
        return TEXT_SIZES.map(s => {
            const selected = s.key === this.pending.textSize ? " checked" : "";
            return `
            <label class="text-size-option">
              <input type="radio" name="settings-text-size" value="${esc(s.key)}"${selected} style="display:none">
              <span>${esc(s.label)}</span>
            </label>`;
        }).join("");
    }

    _fontOptions() {
        return NAME_FONTS.map(f => {
            const selected = f.key === this.pending.nameFont ? " selected" : "";
            return `<option value="${esc(f.key)}"${selected}>${esc(f.label)}</option>`;
        }).join("");
    }

    _swatches(field, colors) {
        const current = this.pending[field];
        return colors.map((c, i) => {
            const selected = c === current ? " selected" : "";
            return `<span class="color-swatch${selected}" style="background:${esc(c)};" data-field="${esc(field)}" data-color="${esc(c)}" title="${esc(c)}"></span>`;
        }).join("");
    }

    _diceColorSwatches() {
        const colors = [
            { key: "black", label: "Black", hex: "#000000" },
            { key: "blue", label: "Blue", hex: "#2563eb" },
            { key: "green", label: "Green", hex: "#15803d" },
            { key: "purple", label: "Purple", hex: "#7c3aed" },
            { key: "red", label: "Red", hex: "#dc2626" },
            { key: "white", label: "White", hex: "#ffffff" },
            { key: "yellow", label: "Yellow", hex: "#ca8a04" },
        ];
        const current = this.pending.diceType;
        return colors.map((c) => {
            const selected = c.key === current ? " selected" : "";
            const border = c.key === "white" ? "1px solid var(--border)" : "";
            return `<span class="color-swatch dice-swatch${selected}" style="background:${c.hex};${border}" data-field="diceType" data-color="${esc(c.key)}" title="${esc(c.label)}">${selected ? "✓" : ""}</span>`;
        }).join("");
    }

    _cardSetOptions() {
        const sets = [
            { key: "Classic", label: "Classic" },
            { key: "Dark", label: "Dark" },
            { key: "Light", label: "Light" },
            { key: "Off-White", label: "Off-White" },
            { key: "Artistic", label: "Artistic" },
            { key: "White & Red tinted", label: "White & Red Tinted" },
        ];
        const current = this.pending.cardSet;
        return sets.map((s) => {
            const selected = s.key === current ? "selected" : "";
            return `<option value="${esc(s.key)}" ${selected}>${esc(s.label)}</option>`;
        }).join("");
    }

    _militaryUnit(u) {
        const cur = this.pending.militaryUnits[u.key];
        const has = cur && cur.image;
        return `
        <div class="military-unit">
          <div class="military-unit-label">${esc(u.label)}</div>
          <div class="military-unit-preview" id="settings-mu-preview-${esc(u.key)}">
            ${has ? `<img src="${esc(cur.image)}" alt="${esc(u.label)} unit icon">` : '<div class="settings-muted" style="font-size:0.62rem;">None</div>'}
          </div>
          <label class="file-upload military-upload" style="display:flex;flex-direction:column;align-items:center;">
            <input type="file" id="settings-mu-${esc(u.key)}" accept="image/png,image/jpeg,image/svg+xml" data-unit="${esc(u.key)}">
            <span style="font-size:0.7rem;margin-top:4px;">Upload ${esc(u.label)}</span>
          </label>
          ${has ? `<button type="button" class="section danger" style="margin-top:6px;font-size:0.7rem;padding:4px 8px;" data-action="clear-mu" data-unit="${esc(u.key)}">Clear</button>` : ""}
        </div>`;
    }

    _cultureBlock(c) {
        const cur = this.pending[c.key];
        const type = cur && cur.type ? cur.type : (c.keys ? c.keys[0] : PET_DEFAULT);
        const text = cur && cur.text ? cur.text : "";
        const image = cur && cur.image ? cur.image : null;
        const keys = c.keys || [];
        return `
        <div class="settings-section">
          <h3>${esc(c.label)}</h3>
          <p class="settings-description">Pick a type and optional custom text for your nation's ${esc(c.label).toLowerCase()}.</p>
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div style="flex:1;">
              <div class="culture-grid">${keys.map(k => {
                  const checked = k === type ? " checked" : "";
                  return `<label class="culture-option${checked}">
                    <input type="radio" name="settings-${c.key}-type" value="${esc(k)}"${checked} style="display:none">
                    <span class="culture-preview" style="border-color:${checked ? "var(--primary-color)" : "var(--border-color)"};background:${checked ? "var(--primary-light)" : "var(--bg-secondary)"};color:var(--text-primary);">
                      ${this._cultureIcon(c.key, k)}
                    </span>
                    <span class="culture-label">${esc(human(k))}</span>
                  </label>`;
              }).join("")}</div>
            </div>
            <div style="flex:1;min-width:200px;">
              <label>Custom text</label>
              <input type="text" id="settings-${c.key}-text" value="${esc(text)}" placeholder="e.g. ${esc(human(type))}" style="width:100%;padding:8px;border:1px solid var(--input-border);border-radius:var(--radius-sm);background:var(--input-bg);color:var(--input-text);">
              ${image ? `
              <div style="margin-top:8px;">
                <div class="current-avatar" style="width:120px;height:80px;">
                  <img src="${esc(image)}" alt="${esc(c.label)} image">
                </div>
                <button type="button" class="section danger" style="margin-top:6px;font-size:0.7rem;padding:4px 8px;" data-action="clear-culture" data-key="${esc(c.key)}">Clear image</button>
              </div>` : `
              <label class="file-upload" style="margin-top:10px;">
                <input type="file" id="settings-${c.key}-file" accept="image/png,image/jpeg,image/svg+xml" data-culture="${esc(c.key)}">
                <span>Upload ${esc(c.label)} image</span>
              </label>`}
            </div>
          </div>
        </div>`;
    }

    _cultureIcon(group, key) {
        if (group === "nationalPet") {
            if (key === PET_DEFAULT) return "🚫";
            const map = {
                Axolotl:"🦎",Anteater:"🐜",Ant:"🐜",Alligator:"🐊",Badger:"🦡",Bat:"🦇",Beaver:"🦫",Bee:"🐝",Beetle:"🐞",Bison:"🦬",
                BlueTang:"🐠",Camel:"🐪",Cardinal:"🐦",Cat:"🐱",Centipede:"🐛",Cheetah:"🐆",Chicken:"🐔",Clownfish:"🐠",Cow:"🐮",Crab:"🦀",
                Crow:"🐦",Deer:"🦌",Dog:"🐶",Dolphin:"🐬",Duck:"🦆",Eagle:"🦅",Elephant:"🐘",Emu:"🐦",Firefly:"🐛",Fox:"🦊",
                Frog:"🐸",Giraffe:"🦒",Goat:"🐐",Goose:"🪿",Gorilla:"🦍",Grizzly:"🐻",Hamster:"🐹",Hedgehog:"🦔",Hippo:"🦛",Horse:"🐴",
                Hummingbird:"🐦",Iguana:"🦎",Jellyfish:"🪼",Jaguar:"🐆",Kangaroo:"🦘",Kiwi:"🐦",Koala:"🐨",Lemur:"🐒",Ladybug:"🐞",Mantis:"🦗",
                Monkey:"🐒",Mouse:"🐭",Octopus:"🐙",Orangutan:"🦧",Orca:"🐳",Ostrich:"🐦",Otter:"🦦",Owl:"🦉",Panda:"🐼",Parrot:"🦜",
                Peacock:"🦚",Pelican:"🐧",Penguin:"🐧",Pig:"🐷",Pigeon:"🐦",Platypus:"🦦",PolarBear:"🐻‍❄️",Pufferfish:"𐐷",Rabbit:"🐰",Raccoon:"🦝",
                Ram:"🐏",Rat:"🐀",RedPanda:"🦥",Reindeer:"🦌",Rhino:"🦏",Salmon:"🐟",Scorpion:"🦂",Seahorse:"🦭",Seal:"🦭",Shark:"🦈",
                Sheep:"🐑",Shrimp:"🦐",Skunk:"🦨",Sloth:"🦥",Snail:"🐌",Snake:"🐍",Spider:"🕷",Squirrel:"🐿",Starfish:"🐙",Stingray:"🫎",
                SugarGlider:"🐿",Tiger:"🐯",Toucan:"🦜",Turkey:"🦃",Turtle:"🐢",Walrus:"🦭",Whale:"🐳",Wolf:"🐺",Yak:"🫎",Zebra:"🦓",
            };
            return map[key] || "•";
        }
        const map = {
            nationalFood: { pizza:"🍕",steak:"🥩",cake:"🍰",cookie:"🍪",burger:"🍔",donut:"🍩",hotdog:"🌭",ramen:"🍜",salad:"🥗",sushi:"🍣",taco:"🌮" },
            nationalWater: { water:"💧",beer:"🍺",coffee:"☕",juice:"🧃",milk:"🥛",milkshake:"🥤",smoothie:"🥤",soda:"🥤",wine:"🍷",liquor:"🥃","energy-drink":"⚡" },
        };
        return (map[group] && map[group][key]) || "•";
    }

    /* ═════════════════════════════════════════════════════════════════════════
       APPLY / SAVE
       ════════════════════════════════════════════════════════════════════════ */

    applyLive() {
        const p = this.pending;
        const root = document.documentElement;

        /* Text size → CSS scale variable on <html> */
        const size = TEXT_SIZES.find(s => s.key === p.textSize) || TEXT_SIZES[1];
        root.style.setProperty("--text-size-base", (14 * size.scale) + "px");

        /* Name font / color → CSS custom properties */
        const font = NAME_FONTS.find(f => f.key === p.nameFont) || NAME_FONTS[0];
        root.style.setProperty("--name-font", font.css);
        root.style.setProperty("--name-color", p.nameColor);
        root.style.setProperty("--name-color-accent", p.nameColorAccent);

        /* Theme → data-theme */
        root.dataset.theme = p.theme;
    }

    /* Build the list of settings commands to send to the server */
    changes() {
        const p = this.pending;
        const s = this.state.player.settings;
        const ui = s.ui || {};
        const custom = s.customImages || {};
        const cmds = [];

        const set = (group, key, value) => cmds.push({ group, key, value });

        if (ui.theme !== p.theme) set("ui", "theme", p.theme);
        if (ui.textSize !== p.textSize) set("ui", "textSize", p.textSize);
        if (ui.nameFont !== p.nameFont) set("ui", "nameFont", p.nameFont);
        if (ui.nameColor !== p.nameColor) set("ui", "nameColor", p.nameColor);
        if (ui.nameColorAccent !== p.nameColorAccent) set("ui", "nameColorAccent", p.nameColorAccent);
        if (ui.diceType !== p.diceType) set("ui", "diceType", p.diceType);
        if (ui.diceStyle !== p.diceStyle) set("ui", "diceStyle", p.diceStyle);
        if (ui.cardSet !== p.cardSet) set("ui", "cardSet", p.cardSet);
        if (ui.musicEnabled !== p.musicEnabled) set("ui", "musicEnabled", p.musicEnabled);
        if (ui.musicVolume !== p.musicVolume) set("ui", "musicVolume", p.musicVolume);

        if (custom.flagImage !== p.flagImage) set("customImages", "flagImage", p.flagImage);
        if (JSON.stringify(custom.militaryUnits) !== JSON.stringify(p.militaryUnits)) set("customImages", "militaryUnits", p.militaryUnits);
        if (JSON.stringify(custom.nationalFood) !== JSON.stringify(p.nationalFood)) set("customImages", "nationalFood", p.nationalFood);
        if (JSON.stringify(custom.nationalWater) !== JSON.stringify(p.nationalWater)) set("customImages", "nationalWater", p.nationalWater);
        if (JSON.stringify(custom.nationalPet) !== JSON.stringify(p.nationalPet)) set("customImages", "nationalPet", p.nationalPet);

        return cmds;
    }
}

window.SettingsModal = new SettingsModalSystem();
