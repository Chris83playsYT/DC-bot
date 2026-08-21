// Lightweight HTTP keep-alive server.
// Render and Replit both expect a web process to bind to PORT when one is set.
const http = require("http");

const PORT = Number(process.env.PORT || process.env.KEEPALIVE_PORT || 4000);

module.exports = {
  start() {
    const server = http.createServer((req, res) => {
      if (req.url === "/ping" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "alive",
          uptime: Math.floor(process.uptime()),
          bot: "Weird Guy",
          timestamp: new Date().toISOString(),
        }));
      } else {
        res.writeHead(404);
        res.end("not found");
      }
    });

    server.listen(PORT, () => {
      console.log(`[keepalive] HTTP server running on port ${PORT} — ping /ping to keep bot alive`);
    });

    server.on("error", (err) => {
      console.error("[keepalive] Server error:", err.message);
    });

    return server;
  },
};
