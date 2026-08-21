---
name: Control boundaries
description: The separation between server configuration, VIP access, and global owner controls.
---

Server administrators can change only the configuration belonging to the server where they run the command. Owner presence, global AI directives, remembered owner identity, premium grants, broadcasts, and other control-room features are global and owner-only.

**Why:** The bot is shared across multiple Discord servers, so a server admin must never be able to alter global behavior or another server's settings.

**How to apply:** Keep new server options under the current guild ID and behind the server-admin check. Keep global behavior under the password-gated owner command and never expose it through `,wgconfig`.