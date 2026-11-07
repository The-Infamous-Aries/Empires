# Time System

Manages game time for Sovereignty Epochs — the central clock that drives the daily turn cycle, month/year progression, calendar reform, scheduled events, and all time-dependent game logic.

## Overview

| Item | Value |
|------|-------|
| **Class:** | `TimeSystem` |
| **Global instance:** | `window.TimeSystem` |
| **Alias:** | `window.GameTime` |
| **Source file:** | `systems/time-system.js` |
| **Loaded in:** | `index.html` (line 32, after core systems, before gameplay systems) |
| **Instantiated by:** | `core/game-engine.js` line 185-191 |
| **Save/Load:** | Yes — `getState()` / `setState()` via `data-manager.js` |

## Timing Model

| Concept | Value |
|---------|-------|
| **1 turn** | 1 real hour = 3,600,000 ms |
| **1 game day** | 1 turn |
| **1 month** | 28-31 days (variable, calendar-reform aware) |
| **1 year** | 12 months |
| **Default year length** | 360 days (standard calendar) |
| **Game start** | Year 1, Month 1 (January), Day 1 |

Time advances automatically via the game engine's `requestAnimationFrame` loop. Every `turnDuration` (3.6M ms / 1 hour real time) triggers `_advanceDay()`, which fires `DAY_PASSED` events and updates the calendar.

## Constructor State

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isInitialized` | boolean | `false` | Set to `true` after `initialize()` |
| `isRunning` | boolean | `false` | Whether time is actively advancing |
| `currentTime` | object | `{ year: 1, month: 1, day: 1, totalDays: 0 }` | Current game clock |
| `monthNames` | array | `['January', 'February', ..., 'December']` | Month names (calendar-reform aware) |
| `monthLengths` | array | `[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]` | Days per month (calendar-reform aware) |
| `turnDuration` | number | `3_600_000` ms | 1 real hour = 1 game day |
| `lastUpdate` | number | `0` | Last `performance.now()` timestamp |
| `accumulator` | number | `0` | Accumulated ms toward next turn |
| `eventCounter` | number | `0` | Auto-incrementing ID for scheduled events |
| `scheduledEvents` | Map | `new Map()` | Pending timed events |
| `dayCallbacks` | array | `[]` | Day-passed callback functions |
| `monthCallbacks` | array | `[]` | Month-passed callback functions |
| `yearCallbacks` | array | `[]` | Year-passed callback functions |
| `statistics` | object | `{ daysElapsed, monthsElapsed, yearsElapsed, totalRealMs }` | Runtime statistics |

## Initialization

| Method | Description |
|--------|-------------|
| `async initialize()` | Sets `lastUpdate` to `performance.now()`, marks initialized, calls `start()`. Emits console log. |
| `start()` | Sets `isRunning = true`, resets `lastUpdate`. No-op if already running. |
| `stop()` | Sets `isRunning = false`. Time stops advancing. |
| `pause()` | Alias for `stop()` — pauses time. |
| `resume()` | Sets `isRunning = true`, resets `lastUpdate` to now. |
| `setGameSpeed()` | Returns `false` — game speed is fixed in MMO mode (1 hour/turn). |
| `destroy()` | Stops time, clears all callbacks and scheduled events, removes `world_calendar_changed` EventBus listener, marks uninitialized. |

## Main Update Loop

### `update(deltaTime)`

Called every frame by `core/game-engine.js` (line 496-498). Adds `deltaTime` to the accumulator, then processes full turns:

```
while (accumulator >= turnDuration) {
    accumulator -= turnDuration;
    _advanceDay();
}
_processScheduledEvents();
```

### `_advanceDay()`

Advances the game clock by one day:

1. Increments `totalDays` and `statistics.daysElapsed`
2. Increments `currentTime.day`
3. Checks if day exceeds `getMonthLength(month)` — if so, rolls to day 1, increments month
4. Checks if month exceeds `monthNames.length` — if so, rolls to month 1, increments year
5. Emits `DAY_PASSED` via `EventBus` (always)
6. Emits `MONTH_PASSED` if month rolled (month callbacks fire)
7. Emits `YEAR_PASSED` if year rolled (year callbacks fire)
8. Runs registered day/month/year callbacks

## Event Emissions

| Event | When | Payload |
|-------|------|---------|
| `GameEvents.DAY_PASSED` | Every game day | `{ time, stats }` |
| `GameEvents.MONTH_PASSED` | Month boundary | `{ time, stats }` |
| `GameEvents.YEAR_PASSED` | Year boundary | `{ time, stats }` |
| `time_set` | Manual `setTime()` call | `{ time }` |
| `calendar_reformed` | Calendar reform applied | `{ monthNames, monthLengths }` |
| `world_calendar_changed` | **Listens for** (World Forum motion) | `{ newSettings }` |

## Scheduled Events

### `scheduleEvent(callback, daysFromNow, data = null)`

Registers a callback to fire after a given number of game days.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | function | Function to call when target day is reached |
| `daysFromNow` | number | Days in the future |
| `data` | any | Optional data passed to callback |

**Returns:** Event ID (number) — use with `cancelScheduledEvent(id)`.

### `cancelScheduledEvent(id)`

Removes a scheduled event by ID. Returns `true` if removed, `false` if not found.

### `_processScheduledEvents()`

Called every update tick. Fires all events whose `targetDay <= currentTime.totalDays` and removes them from the map.

## Callback Registration

| Method | Description |
|--------|-------------|
| `addDayCallback(fn)` | Register a function called every day |
| `addMonthCallback(fn)` | Register a function called every month |
| `addYearCallback(fn)` | Register a function called every year |
| `removeDayCallback(fn)` | Remove a day callback |
| `removeMonthCallback(fn)` | Remove a month callback |
| `removeYearCallback(fn)` | Remove a year callback |

Callbacks receive `this.getTime()` as their argument and are wrapped in try/catch.

## Query Methods

### `getTime()`

Returns a clean snapshot:
```js
{
    year:      number,
    month:     number,   // 1-12
    day:       number,   // 1-31
    totalDays: number    // cumulative since game start
}
```

### `getCurrentTime()`

Alias for `getTime()` — kept for older call sites.

### `getCurrentDay()`

Returns the current game day (1-31). Also available as the `currentDay` getter property.

### `getMonthName(monthIndex)`

Returns the name of a month (1-indexed), respecting calendar reform:
```js
timeSystem.getMonthName(1);  // 'January' (or custom name after reform)
```

### `getMonthLength(monthIndex)`

Returns the number of days in a month (1-indexed), respecting calendar reform:
```js
timeSystem.getMonthLength(2);  // 28 (or custom length after reform)
```

### `getFormattedTime()`

Returns a human-readable string: `"Year 1  January  Day 1"`.

### `getSeason()`

Returns the season based on month index:
| Month Range | Season |
|-------------|--------|
| 1-3 | Spring |
| 4-6 | Summer |
| 7-9 | Autumn |
| 10-12 | Winter |

### `getDaysUntilNewMonth()`

Returns days remaining in the current month.

### `getDaysUntilNewYear()`

Returns days remaining in the current year.

### `nationAgeDays(foundedTotalDay)`

Returns the age of a nation in days from its `foundedDay` timestamp:
```js
timeSystem.nationAgeDays(100);  // days since day 100
```

## Calendar Reform

The calendar is fully customizable via World Forum motions. A `CALENDAR_REFORM` motion can change month names and lengths.

### `setCalendar(monthNames, monthLengths)`

Applies a full calendar reform:

| Parameter | Type | Requirements |
|-----------|------|-------------|
| `monthNames` | array | Exactly 12 strings |
| `monthLengths` | array | Exactly 12 integers, each 1-60 |

**Returns:** `true` on success, `false` on validation failure.

**Emits:** `calendar_reformed` with `{ monthNames, monthLengths }`.

### `handleCalendarChange(data)`

Event handler for `world_calendar_changed` EventBus events. Extracts `monthNames` and `monthLengths` from `data.newSettings` and calls `setCalendar()`.

### Default Calendar

| Month | Name | Days |
|-------|------|------|
| 1 | January | 31 |
| 2 | February | 28 |
| 3 | March | 31 |
| 4 | April | 30 |
| 5 | May | 31 |
| 6 | June | 30 |
| 7 | July | 31 |
| 8 | August | 31 |
| 9 | September | 30 |
| 10 | October | 31 |
| 11 | November | 30 |
| 12 | December | 31 |
| **Total** | | **365** |

## Calendar Reform Motion

### `CALENDAR_REFORM` (MotionSystem)

- **Scope:** world
- **Min Support:** 0.65
- **Neutral:** true (no boost/penalty)
- **Requires Wonder:** internet
- **Can Propose:** congress_only
- **Parameters:** `monthNames` (12 strings), `monthLengths` (12 integers 1-60)
- **Duration:** null (permanent)

When passed, `MotionSystem` emits `world_calendar_changed` with the new settings, which `TimeSystem.handleCalendarChange()` receives and applies via `setCalendar()`.

## Save / Load

### `getState()`

Returns a serializable object:
```js
{
    currentTime:     { year, month, day, totalDays },
    statistics:      { daysElapsed, monthsElapsed, yearsElapsed, totalRealMs },
    scheduledEvents: [[id, targetDay, callback, data], ...]
}
```

### `setState(state)`

Restores state from a saved object. Resets `accumulator` to 0 and `lastUpdate` to now.

## Wiring & Integration

### Game Engine (`core/game-engine.js`)

```js
if (window.TimeSystem) {
    this.systems.time = new TimeSystem();
    await this.systems.time.initialize();
    window.GameTime = this.systems.time;
    window.TimeSystem = this.systems.time;
}
```

TimeSystem is registered in `this.systems` and updated every frame via `system.update(deltaTime)`.

### Callers of `window.TimeSystem`

| File | Usage |
|------|-------|
| `entities/Nation.js:931,954` | `window.TimeSystem.currentDay` for territory purchase recording |
| `systems/Population/population-system.js:473` | `window.TimeSystem.currentDay` for age calculations |
| `systems/Nation/economy-system.js:317,319,549` | `window.TimeSystem.currentDay` for edict processing |
| `systems/World/world-bank-system.js:356,358` | `window.TimeSystem.currentDay` for loan calculations |
| `entities/Alliance.js:16` | `window.TimeSystem.getCurrentDay()` for alliance founding day |
| `core/data-manager.js:217,272-273` | `TimeSystem.getState()` / `TimeSystem.setState()` for save/load |

## Example Usage

```js
// Get current game time
const time = window.TimeSystem.getTime();
// { year: 5, month: 3, day: 14, totalDays: 1468 }

// Format for display
const display = window.TimeSystem.getFormattedTime();
// "Year 5  March  Day 14"

// Get month name
const name = window.TimeSystem.getMonthName(3);
// "March"

// Get days in current month
const days = window.TimeSystem.getMonthLength(window.TimeSystem.currentTime.month);
// 31

// Schedule an event 7 days from now
const eventId = window.TimeSystem.scheduleEvent(
    (data) => console.log('Event fired!', data),
    7,
    { message: 'Weekly maintenance' }
);

// Cancel a scheduled event
window.TimeSystem.cancelScheduledEvent(eventId);

// Register a daily callback
window.TimeSystem.addDayCallback((time) => {
    console.log(`Day ${time.day} of Month ${time.month}, Year ${time.year}`);
});

// Apply calendar reform
window.TimeSystem.setCalendar(
    ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
);

// Get nation age
const ageDays = window.TimeSystem.nationAgeDays(nation.foundedDay);
```

## Limits & Constraints

| Limit | Value |
|-------|-------|
| Month names | Exactly 12 entries required for reform |
| Month lengths | 1-60 days each |
| Turn duration | Fixed at 3.6M ms (1 hour real time) — not configurable |
| Max scheduled events | Unlimited (Map-based) |
| Callbacks per type | Unlimited (array-based) |

## Notes

- `currentDay` is a getter property that mirrors `currentTime.day` for external convenience.
- `getSeason()` uses month index positions (1-3 Spring, 4-6 Summer, 7-9 Autumn, 10-12 Winter) — position-based, remains valid after calendar reform.
- `setTime()` calculates `totalDays` by summing actual month lengths, making it calendar-reform aware.
- `destroy()` removes the `world_calendar_changed` EventBus listener to prevent memory leaks.
- Scheduled events use `totalDays` as their timebase, so they remain consistent across calendar reform (day counts don't change, only month boundaries).
