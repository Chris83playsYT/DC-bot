// Deliberate one-shot launcher.
//
// This file intentionally does not restart the bot when it exits. The bot
// should only be started again by an explicit workflow restart or by the
// owner reset command.
const { spawn } = require("child_process");
const path = require("path");

const child = spawn(process.execPath, [path.join(__dirname, "index.js")], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`[launcher] Bot stopped by signal ${signal}. No automatic restart.`);
  } else {
    console.log(`[launcher] Bot stopped with code ${code ?? 0}. No automatic restart.`);
  }
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("[launcher] Failed to start bot:", err?.message || err);
  process.exit(1);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
