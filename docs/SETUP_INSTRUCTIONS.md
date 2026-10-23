# Dominion Wars: run the live game

## Requirements

- Node.js 24 or later and npm.
- A writable, persistent local disk for the world save.
- One server process per world. No external APIs, database server, or runtime npm packages are required.

From the repository root:

```bash
npm start
```

Open **http://localhost:3000** and register an account and nation. The game entry point requires its server; opening `index.html` directly does not start a playable world.

Check readiness:

```bash
curl --fail http://localhost:3000/api/health
```

A healthy response has `status: "running"`. Stop the server with Ctrl+C or SIGTERM.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listening port |
| `WORLD_FILE` | `saves/world.json` | Persistent world snapshot path; relative overrides resolve from the working directory |
| `SECURE_COOKIES` | unset | Set to `true` when the browser entry point uses HTTPS |

Use HTTPS with a reverse proxy for a public deployment. Forward the `/api/events` event stream without response buffering and allow long-lived connections. Keep the same hostname for the browser, API, and event stream.

## The world never has a player-controlled pause

The server checks the clock every second, independently of connected browsers. One real hour is one game day; 30 game days form a month and 360 form a year. Closing tabs, logging out, opening menus, or losing a connection does not stop processing.

Economic turns, research completion, forum deadlines, congress elections, aid, peace pacts, recurring trades, sports fixtures, and war rounds are processed chronologically. The server replays elapsed deadlines from the saved snapshot when it starts. Temporary save failures roll back the current transaction and are retried each second. Health returns 503 until processing recovers.

A stopped host cannot execute code. Run the server on an always-on host under a process supervisor with automatic restart, persistent storage, health monitoring, and backups. Sandbox Preview is a development service, not an uptime guarantee. Restarts catch up elapsed simulation time; they do not discard it.

## Saves and ownership

- Successful actions and deadline processing save through an atomic file replacement.
- Account password hashes and hashed session tokens are stored in the private world file. Saves are never served by the static HTTP routes.
- Back up the world file to durable storage. Test restoration using a **copy** and a different `WORLD_FILE` and port.
- The production entry point acquires `<WORLD_FILE>.lock` before loading a world. A second writer is rejected. Normal exits remove the lock. If a process is forcibly killed, verify that **no process uses that save** before removing the stale lock and restarting.
- Do not edit a save while its server is running or run multiple replicas against the same JSON file. Horizontal scaling requires a shared transactional storage design.
- The live server does not import old browser `localStorage` saves. Keep those exports if migration is needed; there is no validated legacy migration yet.

## Verification

```bash
npm run check
npm test
```

`check` parses the JavaScript in the server, tests, live and legacy UI, core, entities, systems, data, map, and utilities. Tests use synthetic nations, temporary storage, and controlled clocks. HTTP tests use temporary local ports. They do not modify `saves/world.json`.

Browser acceptance includes registration, all menu screens, Build eligibility, military purchases/sales, research, alliance permissions, forum proposals/votes, article publishing, messaging, recurring trades, and Team management. See [LIVE_GAME_AUDIT.md](LIVE_GAME_AUDIT.md) for implemented behavior and outstanding mechanics. Earlier documents that describe every legacy subsystem as complete are not evidence of integration into this entry point.
