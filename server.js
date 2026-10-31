"use strict";
require("dotenv").config();
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { World, DAY, check } = require("./server/world");
const scrypt = promisify(crypto.scrypt);
const root = __dirname;
const { serve } = require("./server/static");
const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ─── OAuth / Auth subsystem (Express + Passport) ─────────────────────────────
const express = require("express");
const expressSession = require("express-session");
const PassportConfig = require("./core/auth/passport-config");
const AuthRoutes = require("./core/auth/auth-routes");

/**
 * Thin adapter so PassportConfig / AuthRoutes can query world.state.accounts
 * without needing a separate database.  Accounts are keyed by UUID (id).
 *
 * Passport needs: findUserById, findUserByUsername, findUserByEmail,
 *                 findUserByGoogleId, findUserByDiscordId,
 *                 createUser, updateUser
 */
function buildDatabaseAdapter(world) {
  const accounts = () => world.state.accounts || {};

  return {
    findUserById: async (id) => accounts()[id] || null,

    findUserByUsername: async (username) =>
      Object.values(accounts()).find(
        (a) => a.username?.toLowerCase() === String(username).toLowerCase(),
      ) || null,

    findUserByEmail: async (email) =>
      Object.values(accounts()).find(
        (a) => a.email?.toLowerCase() === String(email || "").toLowerCase(),
      ) || null,

    findUserByGoogleId: async (googleId) =>
      Object.values(accounts()).find((a) => a.googleId === googleId) || null,

    findUserByDiscordId: async (discordId) =>
      Object.values(accounts()).find((a) => a.discordId === discordId) || null,

    createUser: async (userData) => {
      const id = crypto.randomUUID();
      world.transact(() => {
        world.state.accounts ||= {};
        world.state.accounts[id] = { ...userData, id };
      });
      return id;
    },

    updateUser: async (id, updates) => {
      world.transact(() => {
        if (world.state.accounts?.[id]) {
          Object.assign(world.state.accounts[id], updates);
        }
      });
    },
  };
}

/**
 * Build an Express sub-app that handles all /auth/* routes.
 * The returned app is called from the main http handler for any request
 * whose pathname starts with /auth/.
 */
function buildAuthApp(world) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Passport requires a session to complete the OAuth handshake (even when
  // the final credential is a stateless JWT).
  app.use(
    expressSession({
      secret: process.env.SESSION_SECRET || "empire-fallback-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.SECURE_COOKIES === "true",
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10-minute session just for the OAuth handshake
      },
    }),
  );

  const db = buildDatabaseAdapter(world);
  const passportConfig = new PassportConfig(db);

  app.use(passportConfig.initialize());
  app.use(passportConfig.session());

  const authRoutes = new AuthRoutes(passportConfig, db);
  app.use("/auth", authRoutes.getRouter());

  return app;
}
async function passwordHash(
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) {
  check(
    typeof password === "string" &&
      password.length >= 10 &&
      password.length <= 200,
    "Password must contain 10–200 characters",
  );
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
function createServer(options = {}) {
  const world =
    options.world ||
    new World({
      file: process.env.WORLD_FILE || path.join(root, "saves/world.json"),
    });
  const clients = new Set(),
    limits = new Map();
  let fatalError = null;

  // Build the Express auth sub-app once per server instance
  const authApp = buildAuthApp(world);
  const session = (req) => {
    const token = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("session="))
      ?.slice(8);
    const saved = token && world.state.sessions?.[hash(token)];
    return saved && saved.expires > world.clock() ? saved : null;
  };
  const json = (res, status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  const broadcast = () => {
    for (const c of clients) {
      if (
        !world.state.sessions?.[c.key] ||
        world.state.sessions[c.key].expires <= world.clock()
      ) {
        c.res.end();
        clients.delete(c);
        continue;
      }
      if (c.res.writableLength > 1_000_000) {
        c.res.destroy();
        clients.delete(c);
        continue;
      }
      c.res.write(
        `event: state\ndata: ${JSON.stringify(world.view(c.id))}\n\n`,
      );
    }
  };
  const readBody = async (req) => {
    check(
      req.headers["content-type"]?.split(";")[0] === "application/json",
      "JSON request required",
    );
    if (req.headers.origin)
      check(
        new URL(req.headers.origin).host === req.headers.host,
        "Cross-origin writes are not allowed",
      );
    let length = 0;
    const chunks = [];
    for await (const chunk of req) {
      length += chunk.length;
      check(length <= 64_000, "Request too large");
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    check(
      body && typeof body === "object" && !Array.isArray(body),
      "Invalid request body",
    );
    return body;
  };
  const rateLimit = (req, auth = false) => {
    const key = `${req.socket.remoteAddress}:${auth ? "auth" : "action"}`,
      now = Date.now();
    const entry = limits.get(key);
    if (!entry || entry.until <= now)
      limits.set(key, { count: 1, until: now + 60_000 });
    else {
      check(
        entry.count < (auth ? 20 : 120),
        "Too many requests; try again in a minute",
      );
      entry.count++;
    }
    if (limits.size > 10000)
      for (const [key, entry] of limits)
        if (entry.until <= now) limits.delete(key);
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      // img-src extended to allow Google profile photos and Discord CDN avatars
      // font-src and style-src-elem extended to allow Google Fonts
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://cdn.discordapp.com https://lh3.googleusercontent.com https://*.googleusercontent.com; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      const url = new URL(req.url, "http://localhost");

      // ── Delegate all /auth/* requests to the Express+Passport sub-app ──────
      if (url.pathname.startsWith("/auth/") || url.pathname === "/auth") {
        return authApp(req, res);
      }

      if (url.pathname === "/api/health")
        return json(res, fatalError ? 503 : 200, {
          status: fatalError ? "error" : "running",
          day: world.state.day,
          serverTime: world.clock(),
        });
      if (url.pathname === "/api/catalog" && req.method === "GET")
        return json(res, 200, world.catalog());
      
      // ── Favicon handling ──────────────────────────────────────────────────
      if (url.pathname === "/favicon.ico") {
        res.writeHead(204); // No Content
        return res.end();
      }
      
      if (url.pathname.startsWith("/api/")) {
        if (fatalError)
          return json(res, 503, {
            error:
              "World processing is retrying after an error. Actions resume when processing recovers.",
          });
        if (world.advance(world.clock())) broadcast();

        // ── /api/player-status ────────────────────────────────────────────────
        // Called by LoginSystem after OAuth sign-in.  Checks whether this JWT
        // user already has a nation in world.state (matched by account id or
        // by the oauth sub-id stored in the account).
        if (url.pathname === "/api/player-status" && req.method === "GET") {
          const jwt = require("jsonwebtoken");
          const authHeader = req.headers.authorization || "";
          const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;
          if (!token)
            return json(res, 401, { error: "Authentication required" });
          let decoded;
          try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
          } catch {
            return json(res, 401, { error: "Invalid token" });
          }
          // Check whether this account id has a nation assigned
          const account = world.state.accounts?.[decoded.id];
          const hasNation = !!(account && world.state.nations?.[decoded.id]);
          return json(res, 200, {
            hasNation,
            nationId: hasNation ? decoded.id : null,
          });
        }

        // ── /api/login-oauth ──────────────────────────────────────────────────
        // Accepts a JWT issued by the OAuth callback, verifies it, and issues
        // the standard cookie session so the rest of the game (which uses
        // cookie-based /api/state) works without changes.
        if (url.pathname === "/api/login-oauth" && req.method === "POST") {
          rateLimit(req, true);
          const jwt = require("jsonwebtoken");
          let data;
          try {
            data = await readBody(req);
          } catch (err) {
            return json(res, 400, { error: err.message || "Invalid request" });
          }
          if (!data.token)
            return json(res, 400, { error: "Token required" });
          let decoded;
          try {
            decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          } catch (err) {
            return json(res, 401, { error: "Invalid or expired token" });
          }
          // Make sure this account exists in world state
          world.transact(() => {
            world.state.accounts ||= {};
            if (!world.state.accounts[decoded.id]) {
              world.state.accounts[decoded.id] = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email || "",
                authProvider: decoded.authProvider || "oauth",
              };
            }
          });
          // Issue the standard session cookie
          const sessionToken = crypto.randomBytes(32).toString("hex");
          world.transact(() => {
            world.state.sessions ||= {};
            for (const [k, v] of Object.entries(world.state.sessions))
              if (v.expires <= world.clock()) delete world.state.sessions[k];
            world.state.sessions[hash(sessionToken)] = {
              id: decoded.id,
              expires: world.clock() + 30 * DAY,
            };
          });
          const secure =
            options.secureCookies || process.env.SECURE_COOKIES === "true";
          res.setHeader(
            "Set-Cookie",
            `session=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure ? "; Secure" : ""}`,
          );
          broadcast();
          return json(res, 200, world.view(decoded.id));
        }

        if (
          req.method === "POST" &&
          ["/api/register", "/api/login"].includes(url.pathname)
        ) {
          rateLimit(req, true);
          let data;
          try {
            data = await readBody(req);
          } catch (err) {
            return json(res, 400, { error: err.message || "Invalid request" });
          }
          let id;
          if (url.pathname === "/api/register")
            id = world.register(
              data.username,
              await passwordHash(data.password),
              data.nation || {},
            );
          else {
            const account = Object.values(world.state.accounts).find(
              (a) =>
                a.username.toLowerCase() ===
                String(data.username).toLowerCase(),
            );
            const expected =
              account?.passwordHash ||
              `00000000000000000000000000000000:${"0".repeat(128)}`;
            const candidate = await passwordHash(
              data.password,
              expected.split(":")[0],
            );
            check(
              account &&
                crypto.timingSafeEqual(
                  Buffer.from(candidate),
                  Buffer.from(expected),
                ),
              "Invalid username or password",
            );
            id = account.id;
          }
          const token = crypto.randomBytes(32).toString("hex");
          world.transact(() => {
            world.state.sessions ||= {};
            for (const [key, value] of Object.entries(world.state.sessions))
              if (value.expires <= world.clock())
                delete world.state.sessions[key];
            world.state.sessions[hash(token)] = {
              id,
              expires: world.clock() + 30 * DAY,
            };
          });
          const secure =
            options.secureCookies || process.env.SECURE_COOKIES === "true";
          res.setHeader(
            "Set-Cookie",
            `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure ? "; Secure" : ""}`,
          );
          broadcast();
          return json(res, 200, world.view(id));
        }
        const auth = session(req);
        if (!auth) return json(res, 401, { error: "Please sign in" });
        if (url.pathname === "/api/state" && req.method === "GET")
          return json(res, 200, world.view(auth.id));
        if (url.pathname === "/api/events" && req.method === "GET") {
          check(
            [...clients].filter((c) => c.id === auth.id).length < 5,
            "Too many open connections",
          );
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          });
          const cookie = (req.headers.cookie || "")
            .split(";")
            .map((x) => x.trim())
            .find((x) => x.startsWith("session="))
            ?.slice(8);
          const client = { id: auth.id, key: hash(cookie), res };
          clients.add(client);
          res.write(
            `event: state\ndata: ${JSON.stringify(world.view(auth.id))}\n\n`,
          );
          req.on("close", () => clients.delete(client));
          return;
        }
        if (req.method === "POST") {
          rateLimit(req);
          let data;
          try {
            data = await readBody(req);
          } catch (err) {
            return json(res, 400, { error: err.message || "Invalid request" });
          }
          if (url.pathname === "/api/logout") {
            const token = (req.headers.cookie || "")
              .split(";")
              .map((x) => x.trim())
              .find((x) => x.startsWith("session="))
              ?.slice(8);
            world.transact(() => {
              delete world.state.sessions[hash(token)];
            });
            res.setHeader(
              "Set-Cookie",
              "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
            );
            broadcast();
            return json(res, 200, { ok: true });
          }
          if (url.pathname === "/api/quote")
            return json(
              res,
              200,
              world.actionQuote(auth.id, data.action, data.data),
            );
          if (url.pathname === "/api/action") {
            world.command(auth.id, data.action, data.data, data.requestId);
            broadcast();
            return json(res, 200, world.view(auth.id));
          }
        }
        return json(res, 404, { error: "API route not found" });
      }
      if (!["GET", "HEAD"].includes(req.method))
        return json(res, 405, { error: "Method not allowed" });
      const pathname = decodeURIComponent(url.pathname);
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      check(
        relative === "index.html" ||
          relative.startsWith("ui/live/") ||
          relative.startsWith("assets/"),
        "File not public",
      );
      const filename = path.resolve(root, relative);
      const publicRoots = [
        path.join(root, "ui/live") + path.sep,
        path.join(root, "assets") + path.sep,
      ];
      check(
        filename === path.join(root, "index.html") ||
          publicRoots.some((dir) => filename.startsWith(dir)),
        "Invalid path",
      );
      const real = fs.realpathSync(filename);
      check(
        (real === path.join(root, "index.html") ||
          publicRoots.some((dir) => real.startsWith(dir))) &&
          fs.statSync(real).isFile(),
        "File not found",
      );
      serve(req, res, real);
    } catch (error) {
      if (!res.headersSent)
        json(res, 400, {
          error: error.code === "ENOENT" ? "File not found" : error.message,
        });
      else res.end();
    }
  });
  const timer = setInterval(() => {
    try {
      const changed = world.advance(world.clock());
      if (fatalError) console.info("World processing recovered");
      fatalError = null;
      if (changed) broadcast();
    } catch (error) {
      if (!fatalError)
        console.error("World tick failed; retrying next second:", error);
      fatalError = error;
      for (const c of clients) c.res.end();
      clients.clear();
    }
  }, 1000);
  const heartbeat = setInterval(() => {
    for (const c of clients) {
      if (world.state.sessions?.[c.key]?.expires <= world.clock()) {
        c.res.end();
        clients.delete(c);
      } else
        c.res.write(
          `event: clock\ndata: ${JSON.stringify({ serverTime: world.clock() })}\n\n`,
        );
    }
  }, 15000);
  timer.unref();
  heartbeat.unref();
  server.on("close", () => {
    clearInterval(timer);
    clearInterval(heartbeat);
  });
  return {
    server,
    world,
    close: () => {
      for (const c of clients) c.res.end();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
if (require.main === module) {
  const worldFile =
    process.env.WORLD_FILE || path.join(root, "saves/world.json");
  const release = require("./server/lock").acquireWorldLock(worldFile);
  process.once("exit", release);
  const app = createServer();
  const port = Number(process.env.PORT || 3000);
  app.server.listen(port, "0.0.0.0", () =>
    console.log(`Dominion Wars listening on http://localhost:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      app.close().then(() => process.exit(0));
    });
}
module.exports = { createServer, passwordHash };
