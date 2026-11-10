"use strict";
/**
 * Wheel of Sovereignty Modal - Sovereignty Epochs
 * Borderless pop-up with SVG wheel (152 slices), bumper physics, spin/stop,
 * 1-2s deceleration (cannot time stop), daily free spin, and zoom-in on win.
 * Exports: window.WheelModal.render(state, catalog) -> HTML string
 * Sets: window.WheelModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });

const button = (label, action, data, enabled = true, style = "primary", id = "") =>
  `<button id="${id}" class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const TOTAL_SLICES = 152;
const DEG_PER_SLICE = 360 / TOTAL_SLICES;

// Client-side cache of the daily wheel slice order (name/icon/color/type).
let wheelSlicesCache = null;

async function fetchWheelSlices() {
  try {
    const res = await fetch("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "wheel", action: "getSlices", data: {} }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && Array.isArray(json.slices)) {
        wheelSlicesCache = json.slices;
      }
    }
  } catch {
    // Ignore; slices will fall back to placeholders.
  }
}

fetchWheelSlices();

// Build SVG wedge path for slice i (center 200,200; outer 160; inner 40).
function wedgePath(i) {
  const cx = 200;
  const cy = 200;
  const rOuter = 160;
  const rInner = 40;
  const startAngle = (-90 + i * DEG_PER_SLICE) * (Math.PI / 180);
  const endAngle = (-90 + (i + 1) * DEG_PER_SLICE) * (Math.PI / 180);
  const x1 = cx + rInner * Math.cos(startAngle);
  const y1 = cy + rInner * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(startAngle);
  const y2 = cy + rOuter * Math.sin(startAngle);
  const x3 = cx + rOuter * Math.cos(endAngle);
  const y3 = cy + rOuter * Math.sin(endAngle);
  const x4 = cx + rInner * Math.cos(endAngle);
  const y4 = cy + rInner * Math.sin(endAngle);
  const largeArc = DEG_PER_SLICE > 180 ? 1 : 0;
  return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1} ${y1} Z`;
}

// Position for slice label/icon at mid-radius of slice midpoint.
function labelPos(i) {
  const cx = 200;
  const cy = 200;
  const rMid = 110;
  const midAngle = (-90 + (i + 0.5) * DEG_PER_SLICE) * (Math.PI / 180);
  return { x: cx + rMid * Math.cos(midAngle), y: cy + rMid * Math.sin(midAngle) };
}

function sliceIcon(slice) {
  if (!slice || !slice.icon) return "";
  return `<image class="wheel-slice-icon" href="${esc(slice.icon)}" x="${labelPos(slice.index).x - 14}" y="${labelPos(slice.index).y - 14}" width="28" height="28" />`;
}

function sliceText(slice) {
  if (!slice) return "";
  return `<text class="wheel-slice-text" x="${labelPos(slice.index).x}" y="${labelPos(slice.index).y + 4}" text-anchor="middle" dominant-baseline="middle" pointer-events="none">${esc(slice.name || "")}</text>`;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   RENDER WHEEL MODAL
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

window.WheelModal = {
  render(state, catalog) {
    const n = state?.nation;
    const casino = n?.casino || {};
    const games = casino.games || {};
    const wheelStats = games.wheel || {};
    const freeUsed = wheelStats.freeSpinUsedToday || 0;
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayStartedMs = dayStart.getTime();
    const isFree = freeUsed !== dayStartedMs;
    const cost = isFree ? 0 : 1000;
    const moneyVal = n?.money || 0;
    const canAfford = isFree || moneyVal >= cost;

    // Build 152 slices from cached daily wheel order; fallback to empty icons.
    const wheelSlices = wheelSlicesCache || [];
    let slicesHtml = "";
    for (let i = 0; i < TOTAL_SLICES; i++) {
      const s = wheelSlices[i] || { index: i, name: "Slice", icon: "" };
      s.index = i;
      slicesHtml += `
        <g class="wheel-slice" data-slice="${i}" transform="rotate(${i * DEG_PER_SLICE}, 200, 200)">
          <path d="${wedgePath(i)}" class="wheel-slice-path" fill="${esc(s.color || "#888")}" stroke="var(--border)" stroke-width="1" />
          ${sliceIcon(s)}
          ${sliceText(s)}
        </g>
      `;
    }

    const canSpin = canAfford && wheelModalState.phase !== "spinning";

    return `
      <div class="fortune-modal-header">
        <h2>🎡 Wheel of Sovereignty</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">
        <div class="fortune-wheel-container">
          <div class="fortune-wheel-info">
            <div class="fortune-wheel-free">${isFree ? "✓ Free spin today" : "✗ Free spin used today"}</div>
            <div class="fortune-wheel-cost">Spin cost: ${money(cost)}</div>
            <div class="fortune-wheel-balance">Balance: ${money(moneyVal)}</div>
          </div>
          <div class="fortune-wheel-stage">
            <div class="fortune-wheel-pointer"></div>
            <svg class="wheel-svg" viewBox="0 0 400 400" id="fortune-wheel-svg">
              ${slicesHtml}
            </svg>
            <div class="fortune-wheel-center"></div>
          </div>
          <div class="fortune-wheel-controls">
            ${button("Spin", "fortune:wheel:spin", {}, canSpin, "primary", "fortune-wheel-spin-btn")}
            ${button("Stop", "fortune:wheel:stop", {}, false, "secondary", "fortune-wheel-stop-btn")}
          </div>
          <div class="fortune-wheel-last">
            <div class="fortune-wheel-last-label">Last win:</div>
            <div class="fortune-wheel-last-value" id="fortune-wheel-last-value">
              ${wheelModalState.lastWin ? `${esc(wheelModalState.lastWin)}${wheelModalState.lastPayout > 0 ? ` · ${money(wheelModalState.lastPayout)}` : ""}` : "—"}
            </div>
          </div>
          <div class="fortune-wheel-zoom" id="fortune-wheel-zoom" style="display:none;">
            <div class="fortune-wheel-zoom-icon" id="fortune-wheel-zoom-icon">🎯</div>
            <div class="fortune-wheel-zoom-name" id="fortune-wheel-zoom-name">—</div>
            <div class="fortune-wheel-zoom-type" id="fortune-wheel-zoom-type"></div>
            ${button("Spin Again", "fortune:wheel:spin", {}, false, "primary", "fortune-wheel-spin-again-btn")}
          </div>
        </div>
      </div>
    `;
  },
};

window.WheelModal.displayName = "WheelModal";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// WHEEL ANIMATION STATE (client-side, per-session)
// ══════════════════════════════════════════════════════════════════════════════════════════════

const wheelModalState = {
  phase: "idle", // idle | spinning | settling | zoomed
  currentDeg: 0,
  targetDeg: 0,
  totalDegrees: 0,
  stops: [], // {deg, sliceIndex, bounce}
  startTime: 0,
  duration: 2600,
  raf: null,
  winningSlice: null,
  physics: null,
  lastWin: null,
  lastPayout: 0,
};

function $wheel(id) {
  return document.getElementById(id);
}

function setWheelPhase(phase) {
  wheelModalState.phase = phase;
  const spinBtn = $wheel("fortune-wheel-spin-btn");
  const stopBtn = $wheel("fortune-wheel-stop-btn");
  const zoom = $wheel("fortune-wheel-zoom");
  const svg = $wheel("fortune-wheel-svg");

  if (spinBtn) spinBtn.disabled = phase === "spinning" || phase === "settling";
  if (stopBtn) stopBtn.disabled = phase !== "spinning";
  if (zoom) zoom.style.display = phase === "zoomed" ? "block" : "none";
  if (svg) {
    svg.classList.toggle("wheel-spinning", phase === "spinning" || phase === "settling");
    svg.classList.toggle("wheel-zoomed", phase === "zoomed");
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Bumper bump: as wheel passes a stop deg, add a small oscillating bounce.
function bumperBounce(progress, stops) {
  // Find stops that have been passed by this progress (degrees rotated)
  const degRotated = progress; // 0..totalDegrees
  let bump = 0;
  for (const st of stops || []) {
    const bounce = Number(st.bounce) || 0;
    if (!bounce) continue;
    if (degRotated >= st.deg && degRotated < st.deg + 60) {
      // Within 60 deg after passing this stop: apply decaying bounce
      const t = (degRotated - st.deg) / 60;
      bump += Math.sin(t * Math.PI * 2) * bounce * (1 - t);
    }
  }
  return bump;
}

function stopWheel() {
  const st = wheelModalState;
  if (st.phase !== "spinning") return;
  if (st.raf) cancelAnimationFrame(st.raf);
  st.currentDeg = st.targetDeg;
  const svg = $wheel("fortune-wheel-svg");
  if (!svg) return;
  svg.style.transform = `rotate(${st.targetDeg}deg)`;
  svg.classList.remove("wheel-spinning");
  setWheelPhase("zoomed");
  setTimeout(() => {
    showZoom(st.winningSlice);
  }, 100);
}

function animateWheel() {
  const st = wheelModalState;
  const now = Date.now();
  const elapsed = now - st.startTime;
  let progress = Math.min(elapsed / st.duration, 1);

  // Base rotation: ease out cubic from 0 to totalDegrees
  const baseDeg = easeOutCubic(progress) * st.totalDegrees;
  const bump = bumperBounce(baseDeg, st.stops);
  const totalDeg = baseDeg + bump;

  st.currentDeg = totalDeg;
  const svg = $wheel("fortune-wheel-svg");
  if (!svg) {
    // Modal closed mid-spin — stop animation
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = null;
    st.phase = "idle";
    return;
  }
  svg.style.transform = `rotate(${totalDeg}deg)`;

  if (progress < 1) {
    st.raf = requestAnimationFrame(animateWheel);
  } else {
    // Settle at exact stopDegrees so winning slice lands at top
    st.currentDeg = st.targetDeg;
    svg.style.transform = `rotate(${st.targetDeg}deg)`;
    svg.classList.remove("wheel-spinning");
    setWheelPhase("zoomed");
    // Show zoom after a brief settle
    setTimeout(() => {
      showZoom(st.winningSlice);
    }, 300);
  }
}

function showZoom(slice) {
  const zoom = $wheel("fortune-wheel-zoom");
  const zoomIcon = $wheel("fortune-wheel-zoom-icon");
  const zoomName = $wheel("fortune-wheel-zoom-name");
  const zoomType = $wheel("fortune-wheel-zoom-type");
  const spinAgain = $wheel("fortune-wheel-spin-again-btn");
  const svg = $wheel("fortune-wheel-svg");
  if (!zoom || !slice) return;
  if (svg && wheelModalState.targetDeg !== undefined) {
    svg.style.transform = ""; // clear inline spin transform
    svg.style.setProperty("--wheel-stop-deg", `${wheelModalState.targetDeg}deg`);
  }
  if (zoomIcon) zoomIcon.textContent = slice.icon ? slice.icon : "🎯";
  if (zoomName) zoomName.textContent = esc(slice.name || "Mystery Slice");
  if (zoomType) zoomType.textContent = esc(slice.type || "");
  spinAgain.disabled = false;
  zoom.style.display = "block";
}

function resetWheel() {
  const st = wheelModalState;
  if (st.raf) cancelAnimationFrame(st.raf);
  st.phase = "idle";
  st.currentDeg = 0;
  st.targetDeg = 0;
  st.totalDegrees = 0;
  st.stops = [];
  st.startTime = 0;
  st.duration = 2600;
  st.winningSlice = null;
  st.lastWin = null;
  st.lastPayout = 0;
  st.physics = null;
  const svg = $wheel("fortune-wheel-svg");
  if (svg) {
    svg.style.transform = "rotate(0deg)";
    svg.classList.remove("wheel-spinning", "wheel-zoomed");
  }
  setWheelPhase("idle");
  $wheel("fortune-wheel-zoom").style.display = "none";
}

// Expose for game.js click handlers
window.WheelModalState = wheelModalState;
window.WheelModalAnimate = (physics, winningSlice) => {
  const st = wheelModalState;
  st.physics = physics;
  st.winningSlice = winningSlice;
  st.totalDegrees = physics.totalDegrees;
  st.targetDeg = physics.stopDegrees;
  st.stops = physics.stops || [];
  st.startTime = Date.now();
  st.phase = "spinning";
  // Cache last win info for display
  if (winningSlice) {
    st.lastWin = winningSlice.name || "Mystery Slice";
    st.lastPayout = Number(winningSlice.payout || 0);
  }
  setWheelPhase("spinning");
  st.raf = requestAnimationFrame(animateWheel);
};
window.WheelModalReset = resetWheel;
window.WheelModalStop = stopWheel;
