/**
 * Time System - Game Time Management
 * Dominion Wars - Nation Building Strategy Game
 *
 * ── TIMING ────────────────────────────────────────────────────────────────────
 *   1 real hour  =  1 game day  =  1 turn
 *   30 days      =  1 month
 *   12 months    =  1 year  (360 days)
 *   Game starts at Year 1, Day 1
 *
 * Taxes, population, land purchases, etc. are all calculated once per turn.
 */

class TimeSystem {
    constructor() {
        this.isInitialized = false;
        this.isRunning     = false;

        // ── Game clock ─────────────────────────────────────────────────────
        this.currentTime = {
            year:      1,     // starts at year 1
            month:     1,     // 1-12
            day:       1,     // day of month 1-30
            totalDays: 0      // cumulative days since game start
        };

        // 1 turn = 1 real hour = 3,600,000 ms
        this.turnDuration = 3_600_000;
        this.lastUpdate   = 0;
        this.accumulator  = 0;

        // Scheduled callbacks
        this.scheduledEvents = new Map();
        this.eventCounter    = 0;

        this.dayCallbacks   = [];
        this.monthCallbacks = [];
        this.yearCallbacks  = [];

        // Statistics
        this.statistics = {
            daysElapsed:   0,
            monthsElapsed: 0,
            yearsElapsed:  0,
            totalRealMs:   0
        };
    }

    // ── Init / Start / Stop ────────────────────────────────────────────────

    async initialize() {
        console.log('Initializing Time System (1 hour/turn)...');
        this.lastUpdate    = performance.now();
        this.isInitialized = true;
        this.start();
        console.log('Time System ready — Year 1, Day 1');
    }

    start() {
        if (this.isRunning) return;
        this.isRunning  = true;
        this.lastUpdate = performance.now();
        console.log('Time system started');
    }

    stop()               { this.isRunning = false; }
    pause()              { console.log('Time cannot be paused in MMO mode.'); return false; }
    resume()             { console.log('Time speed is fixed in MMO mode.');   return false; }
    setGameSpeed()       { console.log('Game speed is fixed in MMO mode.');   return false; }

    // ── Main update (called every frame by game engine) ────────────────────

    update(deltaTime) {
        if (!this.isRunning) return;

        this.accumulator           += deltaTime;
        this.statistics.totalRealMs += deltaTime;

        while (this.accumulator >= this.turnDuration) {
            this.accumulator -= this.turnDuration;
            this._advanceDay();
        }

        this._processScheduledEvents();
    }

    // ── Internal clock advance ─────────────────────────────────────────────

    _advanceDay() {
        this.currentTime.totalDays++;
        this.statistics.daysElapsed++;

        this.currentTime.day++;
        let monthPassed = false;
        let yearPassed  = false;

        if (this.currentTime.day > 30) {
            this.currentTime.day = 1;
            this.currentTime.month++;
            this.statistics.monthsElapsed++;
            monthPassed = true;

            if (this.currentTime.month > 12) {
                this.currentTime.month = 1;
                this.currentTime.year++;
                this.statistics.yearsElapsed++;
                yearPassed = true;
            }
        }

        // Emit events
        EventBus.emit(GameEvents.DAY_PASSED, {
            time: this.getTime(),
            stats: this.getStatistics()
        });

        if (monthPassed) {
            EventBus.emit(GameEvents.MONTH_PASSED, {
                time: this.getTime(),
                stats: this.getStatistics()
            });
        }

        if (yearPassed) {
            EventBus.emit(GameEvents.YEAR_PASSED, {
                time: this.getTime(),
                stats: this.getStatistics()
            });
        }

        // Run registered callbacks
        this._runCallbacks(this.dayCallbacks);
        if (monthPassed) this._runCallbacks(this.monthCallbacks);
        if (yearPassed)  this._runCallbacks(this.yearCallbacks);
    }

    _runCallbacks(list) {
        list.forEach(fn => {
            try { fn(this.getTime()); }
            catch (e) { console.error('Time callback error:', e); }
        });
    }

    // ── Scheduled events ──────────────────────────────────────────────────

    scheduleEvent(callback, daysFromNow, data = null) {
        const id        = ++this.eventCounter;
        const targetDay = this.currentTime.totalDays + daysFromNow;
        this.scheduledEvents.set(id, { id, targetDay, callback, data });
        return id;
    }

    cancelScheduledEvent(id) { return this.scheduledEvents.delete(id); }

    _processScheduledEvents() {
        const now = this.currentTime.totalDays;
        for (const [id, ev] of this.scheduledEvents) {
            if (ev.targetDay <= now) {
                this.scheduledEvents.delete(id);
                try { ev.callback(ev.data, this.getTime()); }
                catch (e) { console.error('Scheduled event error:', e); }
            }
        }
    }

    // ── Callback registration ─────────────────────────────────────────────

    addDayCallback(fn)    { this.dayCallbacks.push(fn); }
    addMonthCallback(fn)  { this.monthCallbacks.push(fn); }
    addYearCallback(fn)   { this.yearCallbacks.push(fn); }

    removeDayCallback(fn)   { this._removeFrom(this.dayCallbacks, fn); }
    removeMonthCallback(fn) { this._removeFrom(this.monthCallbacks, fn); }
    removeYearCallback(fn)  { this._removeFrom(this.yearCallbacks, fn); }

    _removeFrom(arr, fn) {
        const i = arr.indexOf(fn);
        if (i !== -1) arr.splice(i, 1);
    }

    // ── Queries ───────────────────────────────────────────────────────────

    /** Returns a clean snapshot of the current time */
    getTime() {
        return {
            year:      this.currentTime.year,
            month:     this.currentTime.month,
            day:       this.currentTime.day,
            totalDays: this.currentTime.totalDays
        };
    }

    /** Alias kept for older call sites */
    getCurrentTime() { return this.getTime(); }

    getStatistics() {
        return {
            ...this.statistics,
            turnDuration: this.turnDuration,
            isRunning:    this.isRunning
        };
    }

    getFormattedTime() {
        const t = this.getTime();
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun',
                            'Jul','Aug','Sep','Oct','Nov','Dec'];
        return `Year ${t.year}  ${monthNames[t.month - 1]}  Day ${t.day}`;
    }

    getSeason() {
        const m = this.currentTime.month;
        if (m <= 3)  return 'Spring';
        if (m <= 6)  return 'Summer';
        if (m <= 9)  return 'Autumn';
        return 'Winter';
    }

    getDaysUntilNewMonth()  { return 30 - this.currentTime.day + 1; }
    getDaysUntilNewYear()   { return (12 - this.currentTime.month) * 30 + (30 - this.currentTime.day) + 1; }

    /** Age of a nation in days from its foundedDay */
    nationAgeDays(foundedTotalDay) {
        return Math.max(0, this.currentTime.totalDays - foundedTotalDay);
    }

    // ── Admin helpers ─────────────────────────────────────────────────────

    fastForward(days) {
        for (let i = 0; i < days; i++) this._advanceDay();
    }

    setTime(year, month, day) {
        this.currentTime.year      = year;
        this.currentTime.month     = month;
        this.currentTime.day       = day;
        this.currentTime.totalDays = ((year - 1) * 360) + ((month - 1) * 30) + (day - 1);
        EventBus.emit('time_set', { time: this.getTime() });
    }

    // ── Persist ───────────────────────────────────────────────────────────

    getState() {
        return {
            currentTime:     { ...this.currentTime },
            statistics:      { ...this.statistics },
            scheduledEvents: Array.from(this.scheduledEvents.entries())
        };
    }

    setState(state) {
        if (state.currentTime)     this.currentTime = { ...state.currentTime };
        if (state.statistics)      this.statistics  = { ...state.statistics };
        if (state.scheduledEvents) this.scheduledEvents = new Map(state.scheduledEvents);
        this.lastUpdate = performance.now();
    }

    destroy() {
        this.stop();
        this.dayCallbacks   = [];
        this.monthCallbacks = [];
        this.yearCallbacks  = [];
        this.scheduledEvents.clear();
        this.isInitialized = false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimeSystem };
}
