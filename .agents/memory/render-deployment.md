---
name: External bot hosting
description: Durable deployment choice for keeping the Discord bot online outside the Replit workspace
---

Render is configured as an always-on background worker rather than a sleeping web service. The bot's own keep-alive HTTP listener remains useful for diagnostics, but uptime must come from the worker plan and Render's process supervision, not an in-process restart loop.

**Why:** The bot intentionally exits cleanly on shutdown and must not restart itself; an external supervisor provides reliable crash recovery without changing that control boundary.

**How to apply:** Keep the Render start command pointed at the one-shot launcher, set Discord and AI credentials as Render environment variables, and never commit the live JSON state or secrets.