"use strict";
/**
 * Fortune Modals - Shared modal registry for all casino games + tarot
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Each game modal is a pure HTML generator in its own file:
 *   scratch-off-modal.js   -> window.ScratchOffModal.render(state, catalog)
 *   wheel-modal.js         -> window.WheelModal.render(state, catalog)
 *   keno-modal.js          -> window.KenoModal.render(state, catalog)
 *   blackjack-modal.js     -> window.BlackjackModal.render(state, catalog)
 *   gambler-dice-modal.js  -> window.GamblerDiceModal.render(state, catalog)
 *   tarot-modal.js         -> window.TarotModal.render(state, catalog)
 *
 * This file wires them together under window.FortuneModals.renderModal(state, catalog, game).
 * Sets: window.FortuneModals
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const GAME_MODALS = {
  scratchOff: "ScratchOffModal",
  wheel: "WheelModal",
  keno: "KenoModal",
  blackjack: "BlackjackModal",
  gamblerDice: "GamblerDiceModal",
  tarot: "TarotModal",
};

function modalForGame(game) {
  const clsName = GAME_MODALS[game];
  if (!clsName) return null;
  const cls = window[clsName];
  if (!cls || !cls.render) return null;
  return cls;
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
   SHARED MODAL RENDERER
   ═══════════════════════════════════════════════════════════════════════════════════════ */

window.FortuneModals = {
  renderModal(state, catalog, game) {
    const modalCls = modalForGame(game);
    if (!modalCls) {
      return `<div class="empty">Fortune game "${esc(game)}" not available.</div>`;
    }
    try {
      return modalCls.render(state, catalog);
    } catch (err) {
      console.error(`Fortune modal render error (${game}):`, err);
      return `<div class="empty">Error rendering ${esc(game)}: ${esc(err.message)}</div>`;
    }
  },
};

window.FortuneModals.displayName = "FortuneModals";
