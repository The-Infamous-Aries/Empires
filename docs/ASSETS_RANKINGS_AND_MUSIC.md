# Assets, rankings and music

## Start and verify

Use Node 24 or newer. There are no package dependencies to install.

```sh
npm start
# Open http://localhost:3000/
npm test
npm run check
```

The server persists and advances the world independently of browser connections. Rankings use the same transaction, save, and chronological catch-up path. Music is a browser preference and never affects simulation time. The single-writer save lock prevents two processes from opening the same world. For an isolated world, set both `PORT` and `WORLD_FILE` to separate values.

## Asset mapping

`ui/live/assets.js` maps the existing assets by their folder and actual filename. The task branch lacked the asset directory; the assets were imported unchanged from repository default HEAD `5ef229880c27261025ba366ef4f70286941a806d`. No other code from that revision was imported.

- **Colors, Government, Religion:** nation identity, selection previews and diplomatic rosters.
- **Military:** unit purchases, readiness, combat status and reports. No replacement image is invented for spies.
- **Misses:** missile interception reports, using the nation's color brick.
- **Sports:** club sports, trophies and injuries.
- **Rank:** numbered position images (reserved for future use; not displayed on the leaderboard).
- **Awards:** first, second and third place in each of five distinction sets. The only icons shown on the leaderboard.
- **Background:** all three peace tracks and all four war tracks.

Every asset path is checked by the media regression suite. Static audio responses support MIME types, HEAD, and byte ranges for browser seeking.

## Leaderboard

| Award set | Rankings |
| --- | --- |
| 1 (prestige) | Highest Strength Overall; Most Wins (wars won); Most Missile Hits; Most Missile Misses; Most Nuclear Hits; Most Nuclear Misses |
| 2 | Largest Population; Largest Treasury |
| 3 | Most Owned Technology; Most Research Completed |
| 4 | Most Buildings Constructed; Most Trades Completed |
| 5 | Most Territories Claimed; Most Treaties Signed |

Periods use the real **UTC calendar**, independently of the accelerated game calendar. Weeks start Monday; months start on the first; years start January 1.

For strength, population, treasury and owned technology, **Current** is the highest observed value in the current period. For achievement counters, it is the count earned during that period. **Average** and **Best** use completed periods since tracking began. The initial partial period counts when it closes. **Total** is the recorded all-time peak or lifetime achievement count.

Existing saves retain lifetime totals; historical weekly/monthly/yearly results are not fabricated. Period results accumulate after this feature is introduced. Aggregates persist through restart, including rollovers while nobody is connected. Storage keeps bounded sums, best values and period counts instead of an unlimited snapshot history.

Equal scores share competition ranks (1, 1, 3). Zero scores receive no medal. Awards show current standings rather than a permanent inventory of past medals. Nations with private statistics are excluded, including their ranking history. The public-statistics option in Settings controls participation.

## Background music

Enable **Background music** in Settings and choose a volume. The toggle and volume are saved in this browser, disabled by default. One persistent audio element survives page navigation and live state refreshes.

A nation participating in any non-ended war uses the war playlist, including the preparation phase. Ending its last war returns it to peace music. Pending treaty calls alone do not start war music. Songs advance through the corresponding playlist, then repeat. Turning music off or signing out stops playback.

Browsers may require a user gesture after reload. Settings explains this state and supplies **Resume music**. A failed track is skipped; if a whole playlist fails, playback stops with a retry option. Music cannot continue while the browser itself is closed or suspends audio, while the server's game world continues to run.
