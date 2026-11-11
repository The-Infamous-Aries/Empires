"use strict";
/**
 * User Modals - Popup modals for the User tab
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * All modals are pure HTML generators. They receive state and return HTML
 * strings rendered inside <dialog id="nation-dialog"> by game.js.
 *
 * Exports (window.UserModals):
 *   equipmentBuyModalContent(state, type)   — type: "keys" | "chests"
 *   chestOpenConfirmContent(state, chestKey)
 */

"use strict";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const number = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (v) => "$" + number(v);

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items)
      .map(
        ([k, v]) =>
          `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(typeof v === "object" ? v.name : v)}</option>`,
      )
      .join("")
  }</select>`;

function icon(group, key) {
  const src =
    (window.Assets && window.Assets.icon && window.Assets.icon(group, key)) ||
    "";
  if (src) return `<img class="game-icon" src="${esc(src)}" alt="${esc(key)}" width="24" height="24" loading="lazy" decoding="async">`;
  return "";
}

/* ═════════════════════════════════════════════════════════════════════════════
   EQUIPMENT BUY MODAL (Keys & Chests from World Bank)
   ═════════════════════════════════════════════════════════════════════════════ */

function equipmentBuyModalContent(state, type) {
  const n = state.nation;
  const equipment = n ? n.equipment : {};
  const keys = equipment.keys || {};
  const chests = equipment.chests || {};

  const KEY_TYPES = ["key1", "key2", "key3"];
  const KEY_NAMES = { key1: "Common Key", key2: "Uncommon Key", key3: "Rare Key" };
  const CHEST_TYPES = ["chest1", "chest2", "chest3", "chest4"];
  const CHEST_NAMES = { chest1: "Common Chest", chest2: "Uncommon Chest", chest3: "Rare Chest", chest4: "Sovereign Chest" };

  const prices =
    window.EQUIPMENT_WORLD_BANK_PRICES || { keys: { key1: 5, key2: 15, key3: 50 }, chests: { chest1: 100, chest2: 500, chest3: 2000, chest4: 10000 } };

  const items = type === "keys"
    ? KEY_TYPES.map((k) => ({
        id: k,
        name: KEY_NAMES[k] || k,
        count: keys[k] || 0,
        price: prices.keys[k] || 0,
        icon: `key-${k}`,
      }))
    : CHEST_TYPES.map((c) => ({
        id: c,
        name: CHEST_NAMES[c] || c,
        count: chests[c] || 0,
        price: prices.chests[c] || 0,
        icon: `chest-${c}`,
      }));

  const itemsHtml = items
    .map(
      (item) => {
        const affordable = n.money >= item.price;
        return `<article style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;background:var(--card-bg,#1e293b);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${icon("loot", item.icon)}
              <strong>${esc(item.name)}</strong>
            </div>
            <span class="badge">${money(item.price)} each</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="muted" style="font-size:11px;">Owned: ${number(item.count)}</div>
              <div style="display:flex;align-items:center;gap:6px;">
                <label>Qty</div>
                <input type="number" name="qty-${item.id}" value="1" min="1" max="99" style="width:50px;padding:4px;border:1px solid var(--border);border-radius:4px;background:var(--raised);color:var(--text);font-size:11px;">
              </div>
            </div>
            ${button("Buy", type === "keys" ? "buyKey" : "buyChest", type === "keys" ? { keyType: item.id, itemId: item.id } : { chestType: item.id, itemId: item.id }, affordable)}
          </div>
        </article>`;
      },
    )
    .join("");

  return `<form method="dialog">
    <div class="modal-eyebrow">World Bank — ${type === "keys" ? "Buy Keys" : "Buy Chests"}</div>
    <h2 id="nation-dialog-title">Purchase ${type === "keys" ? "Keys" : "Chests"}</h2>
    <p class="muted">Purchase ${type === "keys" ? "keys" : "chests"} from the World Bank. Funds are deducted from your national treasury.</p>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      ${itemsHtml || '<p class="muted">No items available.</p>'}
    </div>
    <div class="row dialog-actions">
      <button value="close" autofocus>Close</button>
    </div>
  </form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   CHEST OPEN CONFIRM MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function chestOpenConfirmContent(state, chestKey) {
  const n = state.nation;
  const equipment = n ? n.equipment : {};
  const keys = equipment.keys || {};
  const chests = equipment.chests || {};

  const CHEST_NAMES = { chest1: "Common Chest", chest2: "Uncommon Chest", chest3: "Rare Chest", chest4: "Sovereign Chest" };
  const KEY_REQUIRED = {
    chest1: ["key1"],
    chest2: ["key2"],
    chest3: ["key3"],
    chest4: ["key1", "key2", "key3"],
  };

  const reqKeys = KEY_REQUIRED[chestKey] || [];
  const hasChest = (chests[chestKey] || 0) > 0;
  const hasAllKeys = reqKeys.every((k) => (keys[k] || 0) > 0);

  return `<form method="dialog" id="promotion-chest-confirm-form" data-command="openChest">
    <div class="modal-eyebrow">Open Chest</div>
    <h2 id="nation-dialog-title">Open ${esc(CHEST_NAMES[chestKey] || chestKey)}?</h2>
    <p class="muted">This will consume 1 chest and the required key(s). The chest contents will be added to your inventory.</p>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="font-size:32px;">${icon("loot", `chest-${chestKey}`)}</div>
        <div>
          <div style="font-weight:600;">${esc(CHEST_NAMES[chestKey] || chestKey)}</div>
          <div class="muted" style="font-size:11px;">${hasChest ? "Owned" : "Not owned"} • ${reqKeys.map((k) => `${esc(k)}: ${keys[k] || 0}`).join(", ")}</div>
        </div>
      </div>
      <input type="hidden" name="chestKey" value="${esc(chestKey)}">
      <div style="font-size:12px;color:var(--muted-color,#94a3b8);">
        ${!hasChest ? "<span class='badge bad'>No chest owned</span>" : ""}
        ${!hasAllKeys ? "<span class='badge bad'>Missing required key(s)</span>" : ""}
        ${hasChest && hasAllKeys ? "<span class='badge good'>Ready to open</span>" : ""}
      </div>
    </div>
    <div class="row dialog-actions">
      <button value="close">Cancel</button>
      <button class="primary" ${hasChest && hasAllKeys ? "" : "disabled"}>Open Chest</button>
    </div>
  </form>`;
}

window.UserModals = {
  equipmentBuyModalContent,
  chestOpenConfirmContent,
};
