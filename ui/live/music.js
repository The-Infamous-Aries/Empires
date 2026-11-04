"use strict";
(function (root) {
  function modeFor(state) {
    return state?.wars?.some(
      (w) => w.status !== "ended" && w.participants.includes(state.nation.id),
    )
      ? "war"
      : "peace";
  }
  class Music {
    constructor({
      tracks,
      createAudio = () => new Audio(),
      onChange = () => {},
    }) {
      this.tracks = tracks;
      this.audio = createAudio();
      this.audio.preload = "none";
      this.onChange = onChange;
      this.enabled = false;
      this.volume = 0.35;
      this.mode = "peace";
      this.active = false;
      this.index = { peace: 0, war: 0 };
      this.failed = new Set();
      this.generation = 0;
      this.status = "off";
      this.audio.addEventListener("ended", () => this.next());
      this.audio.addEventListener("error", () => this.fail());
    }
    emit(status) {
      this.status = status;
      this.onChange(this.info());
    }
    info() {
      return {
        enabled: this.enabled,
        mode: this.mode,
        status: this.status,
        track: this.source || null,
        volume: this.volume,
      };
    }
    sync(state, { enabled = false, volume = 0.35 } = {}) {
      const mode = modeFor(state),
        changed = mode !== this.mode;
      this.active = !!state;
      this.enabled = !!enabled;
      this.volume = Number.isFinite(volume)
        ? Math.min(1, Math.max(0, volume))
        : 0.35;
      this.audio.volume = this.volume;
      this.mode = mode;
      if (!this.active || !this.enabled) {
        this.stop();
        return;
      }
      if (changed) {
        this.generation++;
        this.audio.pause();
        this.source = null;
        this.failed.clear();
      }
      if (!this.source) this.play();
    }
    stop() {
      this.generation++;
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.source = null;
      this.failed.clear();
      this.emit("off");
    }
    async play() {
      if (!this.active || !this.enabled) return;
      const source = this.tracks[this.mode]?.[this.index[this.mode]];
      if (!source) {
        this.emit("unavailable");
        return;
      }
      const generation = ++this.generation;
      if (this.source !== source) {
        this.source = source;
        this.audio.src = source;
      }
      this.emit("loading");
      try {
        await this.audio.play();
        if (generation === this.generation) this.emit("playing");
      } catch (error) {
        if (generation !== this.generation) return;
        if (error.name === "NotAllowedError") this.emit("blocked");
        else if (error.name !== "AbortError") this.fail();
      }
    }
    resume() {
      if (
        !this.active ||
        !this.enabled ||
        !["blocked", "unavailable"].includes(this.status)
      )
        return;
      this.failed.clear();
      if (this.status === "unavailable") this.source = null;
      this.play();
    }
    next() {
      if (!this.active || !this.enabled || this.status === "unavailable")
        return;
      this.index[this.mode] =
        (this.index[this.mode] + 1) % this.tracks[this.mode].length;
      this.failed.clear();
      this.source = null;
      this.play();
    }
    fail() {
      if (
        !this.active ||
        !this.enabled ||
        !this.source ||
        this.failed.has(this.source)
      )
        return;
      this.failed.add(this.source);
      if (this.failed.size >= this.tracks[this.mode].length) {
        this.emit("unavailable");
        return;
      }
      this.index[this.mode] =
        (this.index[this.mode] + 1) % this.tracks[this.mode].length;
      this.source = null;
      this.play();
    }
  }
  const exported = { Music, modeFor };
  if (typeof module !== "undefined" && module.exports)
    module.exports = exported;
  else root.EmpiresMusic = exported;
})(globalThis);
