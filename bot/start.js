// Deliberate one-shot launcher with Render Web Server integration.
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

// Tiny web server to keep Render's free tier happy and awake
app.get('/', (req, res) => res.send('Bot launcher is online!'));
const server = app.listen(port, () => console.log(`[launcher] Keep-alive server on port ${port}`));

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
  server.close(() => {
    process.exit(code ?? 0);
  });
});

child.on("error", (err) => {
  console.error("[launcher] Failed to start bot:", err?.message || err);
  server.close(() => {
    process.exit(1);
  });
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
