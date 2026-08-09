---
name: Bot lifecycle
description: The deliberate stop and recovery behavior for the Discord bot.
---

The bot uses a one-shot launcher rather than a crash-restarting watchdog.

**Why:** The owner explicitly requested that the program stay off when it turns off, instead of automatically launching itself again.

**How to apply:** Keep `bot/start.js` as a pass-through launcher. Use the Discord Bot workflow or the owner reset/stop command for deliberate starts and stops. For true 24/7 availability while Replit is closed, publish the bot as an always-running Reserved VM deployment; a health monitor alone does not provide that guarantee.