const { spawn } = require("child_process");
const path = require("path");

const BOT_SCRIPT = path.join(__dirname, "index.js");
const MIN_UPTIME_MS = 5_000;
const MAX_RESTARTS = 10;
const RESTART_COOLDOWN_MS = 30_000;

let restarts = 0;
let lastStart = 0;

function startBot() {
  lastStart = Date.now();

  console.log(`[watchdog] Starting bot... (restart #${restarts})`);

  const child = spawn(process.execPath, [BOT_SCRIPT], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    const uptime = Date.now() - lastStart;

    if (code === 0) {
      console.log("[watchdog] Bot exited cleanly. Shutting down.");
      process.exit(0);
    }

    console.error(`[watchdog] Bot crashed (code=${code}, signal=${signal}, uptime=${uptime}ms)`);

    if (restarts >= MAX_RESTARTS) {
      console.error(`[watchdog] Reached max restarts (${MAX_RESTARTS}). Giving up.`);
      process.exit(1);
    }

    restarts++;

    if (uptime < MIN_UPTIME_MS) {
      console.log(`[watchdog] Bot crashed too fast — waiting ${RESTART_COOLDOWN_MS / 1000}s before restart...`);
      setTimeout(startBot, RESTART_COOLDOWN_MS);
    } else {
      restarts = 0;
      console.log("[watchdog] Restarting bot in 2s...");
      setTimeout(startBot, 2_000);
    }
  });

  child.on("error", (err) => {
    console.error("[watchdog] Failed to spawn bot process:", err.message);
    setTimeout(startBot, RESTART_COOLDOWN_MS);
  });
}

process.on("SIGTERM", () => {
  console.log("[watchdog] Received SIGTERM — shutting down.");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[watchdog] Received SIGINT — shutting down.");
  process.exit(0);
});

startBot();
