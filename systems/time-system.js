/**
 * Time System - Game Time Management
 * Sovereignty Epochs - Nation Ruler Roleplay Game
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

        // ── UTC-based day change ───────────────────────────────────────────
        // Day changes happen at the same UTC hour for all players regardless of timezone
        this.utcDayChangeHour = 0;       // UTC hour when day changes (0 = midnight UTC)
        this.lastUtcCheck = 0;           // last UTC timestamp checked
        this.dayChangeInterval = 3_600_000; // 1 hour in ms (1 turn = 1 hour)

        // Month names (January-December) - can be changed via World Calendar Reform motion
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Month lengths in days - can be changed via World Calendar Reform motion
        this.monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // 1 turn = 1 real hour = 3,600,000 ms
        this.turnDuration = 3_600_000;
        this.lastUpdate   = 0;
        this.accumulator  = 0;

        // Convenience: currentDay mirrors currentTime.day for external callers
        Object.defineProperty(this, 'currentDay', {
            get: () => this.currentTime.day,
            enumerable: true
        });

        // Scheduled callbacks
        this.scheduledEvents = new Map();
        this.eventCounter    = 0;

        this.dayCallbacks   = [];
        this.monthCallbacks = [];
        this.yearCallbacks  = [];

        // Listen for calendar reform from World Forum
        if (typeof EventBus !== 'undefined') {
            EventBus.on('world_calendar_changed', this.handleCalendarChange, this);
        }

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
        console.log('Initializing Time System (1 hour/turn, UTC-synchronized)...');
        this.lastUpdate    = performance.now();
        this.lastUtcCheck  = Date.now();
        this.isInitialized = true;
        this.start();
        console.log('Time System ready — Year 1, Day 1 (UTC-synchronized)');
    }

    start() {
        if (this.isRunning) return;
        this.isRunning  = true;
        this.lastUpdate = performance.now();
        console.log('Time system started');
    }

    stop()               { this.isRunning = false; }
    pause()              { this.isRunning = false; console.log('Time paused'); }
    resume()             { this.isRunning = true; this.lastUpdate = performance.now(); console.log('Time resumed'); }
    setGameSpeed()       { console.log('Game speed is fixed in MMO mode.');   return false; }

    // ── Main update (called every frame by game engine) ────────────────────
    update(deltaTime) {
        if (!this.isRunning) return;

        this.accumulator           += deltaTime;
        this.statistics.totalRealMs += deltaTime;

        // ── UTC-based day change ───────────────────────────────────────────
        // Instead of relying on local performance.now() accumulation,
        // check actual UTC time so day change happens at the same moment for all players.
        const now = Date.now();
        if (this.lastUtcCheck === 0) {
            this.lastUtcCheck = now;
        }

        // Compute the next UTC day-change timestamp
        const nextDayChange = this._getNextUtcDayChange();
        if (now >= nextDayChange) {
            this.accumulator = 0; // reset accumulator to prevent multiple advances
            this._advanceDay();
            this.lastUtcCheck = now;
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

        const daysInMonth = this.getMonthLength(this.currentTime.month);
        if (this.currentTime.day > daysInMonth) {
            this.currentTime.day = 1;
            this.currentTime.month++;
            this.statistics.monthsElapsed++;
            monthPassed = true;

            const monthCount = this.monthNames.length;
            if (this.currentTime.month > monthCount) {
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

    /**
     * Compute the next UTC timestamp when a game day should change.
     * Day changes happen at utcDayChangeHour every day, synchronized to UTC
     * so all players experience day change at the same moment regardless of timezone.
     */
    _getNextUtcDayChange() {
        const now = new Date();
        const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), this.utcDayChangeHour, 0, 0, 0));

        // If the candidate is in the past (already passed today), move to tomorrow
        if (candidate.getTime() <= now.getTime()) {
            candidate.setUTCDate(candidate.getUTCDate() + 1);
        }

        return candidate.getTime();
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

    /** Returns the current game day (1-30) */
    getCurrentDay() { return this.currentTime.day; }

    /** Returns the name of a month (1-indexed), with reform support */
    getMonthName(monthIndex) {
        const idx = Math.max(1, Math.min(12, monthIndex)) - 1;
        return this.monthNames[idx] || `Month ${monthIndex}`;
    }

    /** Returns the number of days in a month (1-indexed), with reform support */
    getMonthLength(monthIndex) {
        const idx = Math.max(1, Math.min(12, monthIndex)) - 1;
        return this.monthLengths[idx] || 30;
    }

    /**
     * Apply calendar reform from World Forum motion.
     * Accepts { monthNames: [...], monthLengths: [...] } arrays (12 entries each).
     */
    setCalendar(monthNames, monthLengths) {
        if (!Array.isArray(monthNames) || monthNames.length !== 12) {
            console.warn('Calendar reform requires 12 month names');
            return false;
        }
        if (!Array.isArray(monthLengths) || monthLengths.length !== 12) {
            console.warn('Calendar reform requires 12 month lengths');
            return false;
        }

        // Validate lengths are positive integers
        for (let i = 0; i < 12; i++) {
            const len = Math.floor(monthLengths[i]);
            if (!Number.isFinite(len) || len < 1 || len > 60) {
                console.warn(`Invalid month length for month ${i + 1}: ${len}`);
                return false;
            }
        }

        this.monthNames = [...monthNames];
        this.monthLengths = monthLengths.map(len => Math.floor(len));

        this.emit('calendar_reformed', {
            monthNames: [...this.monthNames],
            monthLengths: [...this.monthLengths]
        });

        console.log('Calendar reform applied:', this.monthNames, this.monthLengths);
        return true;
    }

    getStatistics() {
        return {
            ...this.statistics,
            turnDuration: this.turnDuration,
            isRunning:    this.isRunning
        };
    }

    getFormattedTime() {
        const t = this.getTime();
        const monthName = this.getMonthName(t.month);
        return `Year ${t.year}  ${monthName}  Day ${t.day}`;
    }

    getSeason() {
        const m = this.currentTime.month;
        if (m <= 3)  return 'Spring';
        if (m <= 6)  return 'Summer';
        if (m <= 9)  return 'Autumn';
        return 'Winter';
    }

    getDaysUntilNewMonth()  {
        const daysInMonth = this.getMonthLength(this.currentTime.month);
        return daysInMonth - this.currentTime.day;
    }
    getDaysUntilNewYear()   {
        let days = this.getMonthLength(this.currentTime.month) - this.currentTime.day;
        for (let m = this.currentTime.month + 1; m <= 12; m++) {
            days += this.getMonthLength(m);
        }
        return days;
    }

    /**
     * Handle calendar reform from World Forum motion.
     * Applies new month names and month lengths to this TimeSystem.
     */
    handleCalendarChange(data) {
        if (!data || !data.newSettings) return;
        const { monthNames, monthLengths } = data.newSettings;
        if (monthNames && monthLengths) {
            this.setCalendar(monthNames, monthLengths);
        }
    }

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

        // Calculate totalDays using actual month lengths (calendar-reform aware)
        let totalDays = 0;
        for (let y = 1; y < year; y++) {
            totalDays += 365; // Approximation for prior years
        }
        for (let m = 1; m < month; m++) {
            totalDays += this.getMonthLength(m);
        }
        totalDays += (day - 1);

        this.currentTime.totalDays = totalDays;
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
        this.accumulator = 0;
    }

    destroy() {
        this.stop();
        this.dayCallbacks   = [];
        this.monthCallbacks = [];
        this.yearCallbacks  = [];
        this.scheduledEvents.clear();
        this.isInitialized = false;

        // Remove calendar change listener to prevent memory leaks
        if (typeof EventBus !== 'undefined') {
            EventBus.off('world_calendar_changed', this.handleCalendarChange, this);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimeSystem };
}
