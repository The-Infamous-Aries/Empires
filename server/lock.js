"use strict";
const fs = require("node:fs");
const path = require("node:path");
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
// The JSON world has one writer. Lock before loading or replaying the save.
function acquireWorldLock(file) {
  const absolute = path.resolve(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const lock = path.join(
    fs.realpathSync(path.dirname(absolute)),
    path.basename(absolute) + ".lock",
  );
  let descriptor;
  try {
    descriptor = fs.openSync(lock, "wx", 0o600);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    let ownerPid;
    try {
      ownerPid = Number(fs.readFileSync(lock, "utf8"));
    } catch {
      ownerPid = NaN;
    }
    if (Number.isFinite(ownerPid) && isPidAlive(ownerPid)) {
      throw new Error(
        "Another server owns this world, or a previous process left a lock. Verify no server uses this save before removing " +
          lock,
      );
    }
    try {
      fs.unlinkSync(lock);
    } catch {
      // ignore; retry exclusive create below
    }
    descriptor = fs.openSync(lock, "wx", 0o600);
  }
  fs.writeFileSync(descriptor, String(process.pid));
  fs.closeSync(descriptor);
  return () => {
    try {
      if (Number(fs.readFileSync(lock, "utf8")) === process.pid)
        fs.unlinkSync(lock);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  };
}
module.exports = { acquireWorldLock };
