const { EmbedBuilder } = require("discord.js");
const config = require("../handlers/config");
const premium = require("../handlers/premium");

// Password must be stored as a Replit Secret. Never keep an owner credential in source.
const storage = require("../handlers/storage");
const ai = require("../handlers/ai");
const presence = require("../handlers/presence");
const ownerAccess = require("../handlers/owner-access");
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "";

// Session cache — once verified, no re-entry needed for 5 minutes.
const ownerSessions = new Map(); // userId -> expiry timestamp
const SESSION_MS = 5 * 60 * 1000;

function isSessionActive(userId) {
  const expiry = ownerSessions.get(userId);
  if (!expiry) return false;
  if (Date.now() > expiry) { ownerSessions.delete(userId); return false; }
  return true;
}

function activateSession(userId) {
  ownerSessions.set(userId, Date.now() + SESSION_MS);
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

async function execute(msg, args) {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case "stats": {
      const guilds = msg.client.guilds.cache;
      const totalMembers = guilds.reduce((s, g) => s + g.memberCount, 0);
      const embed = new EmbedBuilder()
        .setColor("#ff6b35")
        .setTitle("👑 Bot Owner Stats")
        .addFields(
          { name: "Servers", value: `${guilds.size}`, inline: true },
          { name: "Members", value: totalMembers.toLocaleString(), inline: true },
          { name: "Premium Users", value: `${premium.count()}`, inline: true },
          { name: "Uptime", value: formatUptime(process.uptime()), inline: true },
          { name: "Memory", value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
          { name: "Node", value: process.version, inline: true },
        )
        .setTimestamp();
      await msg.reply({ embeds: [embed] });
      break;
    }

    case "overview": {
      const guilds = msg.client.guilds.cache;
      const configured = config.getAllGuilds().length;
      await msg.reply([
        "**Owner Control Center**",
        `Servers connected: **${guilds.size}**`,
        `Servers with saved settings: **${configured}**`,
        `Premium users: **${premium.count()}**`,
        `Temporary delegates: **${ownerAccess.list().length}**`,
        `AI model: \`${ai.getModel()}\``,
        `Remembered owner: ${config.getOwnerProfile()?.tag || config.getOwnerProfile()?.username || "pending Discord owner lookup"}`,
        `Global directive: ${storage.state.ownerControls.directive ? "set" : "not set"}`,
        `Presence: ${presence.describe()}`,
        `State file: \`${storage.file}\``,
        "Use `status`, `directive`, `ownerinfo`, `chaos`, `stats`, `guilds`, `config <server-id>`, `clearai <server-id>`, or `reset` for control actions.",
      ].join("\n"));
      break;
    }

    case "health": {
      const ping = msg.client.ws.ping;
      const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);
      await msg.reply([
        "╭━━━ 🩺 **WEIRD GUY HEALTH** ━━━╮",
        "┃ Status: **online**",
        `┃ Owner identity: **${config.getOwnerName()}**`,
        `┃ Discord latency: **${ping < 0 ? "measuring…" : `${ping}ms`}**`,
        `┃ Uptime: **${formatUptime(process.uptime())}**`,
        `┃ Memory RSS: **${memory} MB**`,
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯",
      ].join("\n"));
      break;
    }

    case "server":
    case "serverinfo": {
      const guild = msg.guild;
      if (!guild) return msg.reply("Run this command inside a server.");
      await msg.reply([
        `✨ **${guild.name}**`,
        `Owner: <@${guild.ownerId}>`,
        `Members: **${guild.memberCount.toLocaleString()}** · Channels: **${guild.channels.cache.size}** · Roles: **${guild.roles.cache.size}**`,
        `Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
        "Server settings remain isolated to this server.",
      ].join("\n"));
      break;
    }

    case "say": {
      const text = args.slice(1).join(" ").trim();
      if (!text) return msg.reply("Usage: `,wgowner say [message]`");
      if (text.length > 1_900) return msg.reply("Keep the message under 1,900 characters.");
      await msg.delete().catch(() => {});
      await msg.channel.send(`✨ ${text}`);
      break;
    }

    case "announce": {
      const text = args.slice(1).join(" ").trim();
      if (!text) return msg.reply("Usage: `,wgowner announce [message]`");
      if (text.length > 1_800) return msg.reply("Keep the announcement under 1,800 characters.");
      const embed = new EmbedBuilder()
        .setColor("#f5b942")
        .setTitle("📣 Weird Guy Owner Announcement")
        .setDescription(text)
        .setFooter({ text: "Published by WeirdGuy" })
        .setTimestamp();
      await msg.channel.send({ embeds: [embed] });
      await msg.reply("✅ Announcement posted in this server.");
      break;
    }

    case "ownername":
    case "whoami": {
      await msg.reply(`👑 I am **Weird Guy**, and my owner is **${config.getOwnerName()}**. The real owner is verified by Discord ownership plus the private password gate.`);
      break;
    }

    case "status":
    case "presence": {
      const action = args[1]?.toLowerCase();
      if (!action || action === "show") {
        return msg.reply([
          `**Current presence:** ${presence.describe()}`,
          `Use \`,wgowner status <playing|streaming|listening|watching|competing> <text>\``,
          "Use `,wgowner status rotate` to restore rotating activities.",
        ].join("\n"));
      }
      if (action === "rotate" || action === "reset") {
        presence.reset(msg.client);
        return msg.reply("✅ Status rotation restored.");
      }
      const text = args.slice(2).join(" ").trim();
      if (!text) return msg.reply("Give the status text too.");
      if (text.length > 128) return msg.reply("Discord status text must be 128 characters or fewer.");
      if (!presence.setCustom(msg.client, action, text)) {
        return msg.reply(`Choose a type: ${presence.activityTypes.map(type => `\`${type}\``).join(", ")}`);
      }
      await msg.reply(`✅ Global bot status set to **${action} ${text}**.`);
      break;
    }

    case "directive":
    case "personality": {
      const directive = args.slice(1).join(" ").trim();
      if (!directive || ["clear", "reset", "off"].includes(directive.toLowerCase())) {
        storage.state.ownerControls.directive = "";
        storage.save();
        return msg.reply("✅ Global owner directive cleared. Server personalities still control their own AI tone.");
      }
      if (directive.length > 500) return msg.reply("Keep the global directive under 500 characters.");
      storage.state.ownerControls.directive = directive;
      storage.save();
      await msg.reply(`✅ Global AI directive saved:\n> ${directive}`);
      break;
    }

    case "ownerinfo":
    case "ownerprofile": {
      const profile = config.getOwnerProfile();
      await msg.reply([
        "**👑 Remembered Bot Owner**",
        `ID: \`${profile?.id || config.getOwnerId() || "not discovered yet"}\``,
        `Name: **${profile?.displayName || profile?.tag || profile?.username || msg.author.tag}**`,
        `First remembered: ${profile?.savedAt || "this session"}`,
        "Owner permissions are global and password-gated. Server admins cannot use these controls.",
      ].join("\n"));
      break;
    }

    case "chaos": {
      const chaos = [
        "The owner has pressed the suspicious red button. Nothing is on fire. Yet.",
        "👑 Owner broadcast: everyone remain calm while Weird Guy rearranges the vibes.",
        "A totally authorized anomaly has entered the server. Please act natural.",
        "The bot has received premium instructions from upstairs and is choosing drama.",
        "GLOBAL OWNER EVENT: this message was personally approved by the person with the keys.",
      ];
      await msg.channel.send(`✨ ${chaos[Math.floor(Math.random() * chaos.length)]}`);
      await msg.reply("✅ Owner chaos event triggered in this server only.");
      break;
    }

    case "guilds": {
      const guilds = msg.client.guilds.cache;
      const list = [...guilds.values()]
        .map(g => `**${g.name}** — ${g.memberCount} members (${g.id})`)
        .join("\n").slice(0, 3900);
      const embed = new EmbedBuilder()
        .setColor("#ff6b35")
        .setTitle(`👑 Servers (${guilds.size})`)
        .setDescription(list || "None")
        .setTimestamp();
      await msg.reply({ embeds: [embed] });
      break;
    }

    case "config": {
      const delegated = !config.isOwner(msg.author.id);
      const requestedGuildId = args[1] || msg.guild?.id;
      if (delegated && requestedGuildId !== msg.guild?.id) {
        return msg.reply("🔒 Temporary owner access can inspect only the server where you are using the command.");
      }
      const guildId = requestedGuildId;
      const guild = msg.client.guilds.cache.get(guildId);
      if (!guild) return msg.reply("I can't find that server in my current connection.");
      await msg.reply(`**${guild.name}** (` + guild.id + `)\n` + config.format(guild.id));
      break;
    }

    case "clearai": {
      const delegated = !config.isOwner(msg.author.id);
      const requestedGuildId = args[1] || msg.guild?.id;
      if (delegated && requestedGuildId !== msg.guild?.id) {
        return msg.reply("🔒 Temporary owner access can clear AI history only in the current server.");
      }
      const guildId = requestedGuildId;
      if (!guildId) return msg.reply("Provide a server ID.");
      ai.clearGuild(guildId);
      await msg.reply(`✅ Cleared in-memory AI conversations for server \`${guildId}\`.`);
      break;
    }

    case "delegate": {
      const action = args[1]?.toLowerCase();
      const target = msg.mentions.users?.first();

      if (action === "list") {
        const grants = ownerAccess.list();
        if (!grants.length) return msg.reply("No temporary owner delegates are active.");
        return msg.reply([
          "**🪪 Temporary Owner Delegates**",
          ...grants.map(grant => {
            const remaining = ownerAccess.formatDuration(grant.expiresAt - Date.now());
            return `<@${grant.userId}> — **${remaining}** left — ${grant.scopes.map(scope => `\`${scope}\``).join(", ")}`;
          }),
        ].join("\n"));
      }

      if (!target) {
        return msg.reply([
          "Usage:",
          "`,wgowner delegate add @user 2h status chaos`",
          "`,wgowner delegate remove @user`",
          "`,wgowner delegate list`",
          `Scopes: ${ownerAccess.GRANTABLE_SCOPES.map(scope => `\`${scope}\``).join(", ")}`,
        ].join("\n"));
      }

      if (action === "remove" || action === "revoke") {
        const removed = ownerAccess.revoke(target.id);
        return msg.reply(removed
          ? `✅ Temporary owner access revoked from **${target.tag}**.`
          : `ℹ️ **${target.tag}** did not have temporary owner access.`);
      }

      if (action !== "add" && action !== "grant") {
        return msg.reply("Choose `add`, `remove`, or `list`.");
      }

      const mentionIndex = args.findIndex(value =>
        value === `<@${target.id}>` || value === `<@!${target.id}>`
      );
      const duration = ownerAccess.parseDuration(args[mentionIndex + 1]);
      if (!duration) return msg.reply("Choose a duration from `1m` to `30d`, such as `2h` or `7d`.");
      const scopes = args.slice(mentionIndex + 2);
      const result = ownerAccess.grant(
        target.id,
        duration,
        scopes,
        msg.author.id,
        { username: target.username, tag: target.tag },
      );
      if (!result.ok) return msg.reply(result.reason);
      return msg.reply([
        `✅ **${target.tag}** received temporary owner access.`,
        `Expires in **${ownerAccess.formatDuration(duration)}**.`,
        `Granted scopes: ${result.grant.scopes.map(scope => `\`${scope}\``).join(", ")}`,
        "They still cannot grant access, manage premium, broadcast, DM users, or stop the bot.",
      ].join("\n"));
    }

    case "broadcast": {
      const message = args.slice(1).join(" ");
      if (!message) return msg.reply("Usage: `,wgowner broadcast [message]`");
      let sent = 0, failed = 0;
      for (const guild of msg.client.guilds.cache.values()) {
        try {
          const ch = guild.systemChannel
            || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me)?.has("SendMessages"));
          if (ch) { await ch.send(`📢 **[Weird Guy Broadcast]**\n${message}`); sent++; }
          else failed++;
        } catch { failed++; }
      }
      await msg.reply(`📢 Sent to **${sent}** server(s). Failed: ${failed}.`);
      break;
    }

    case "invite": {
      const clientId = msg.client.application?.id || msg.client.user.id;
      const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`;
      const embed = new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("🔗 Bot Invite Link")
        .setDescription(`[Add Weird Guy to a server](${url})`)
        .setTimestamp();
      await msg.reply({ embeds: [embed] });
      break;
    }

    case "dm": {
      const target = msg.mentions.users?.first();
      const dmMsg = args.slice(2).join(" ");
      if (!target || !dmMsg) return msg.reply("Usage: `,wgowner dm @user [message]`");
      try {
        await target.send(`📩 **From the bot owner:**\n${dmMsg}`);
        await msg.reply(`✅ DM sent to **${target.tag}**.`);
      } catch {
        await msg.reply("❌ Couldn't DM that user.");
      }
      break;
    }

    case "reload":
    case "reset": {
      await msg.reply("⏹️ Stopping the bot now. It will stay stopped until you manually start the Discord Bot workflow again.");
      setTimeout(() => process.exit(1), 500);
      break;
    }

    case "premium": {
      const premSub = args[1]?.toLowerCase();

      if (premSub === "add") {
        const target = msg.mentions.users?.first();
        if (!target) return msg.reply("Usage: `,wgowner premium add @user`");
        premium.grant(target.id);
        await msg.reply(`💎 **${target.tag}** granted premium!`);
        try {
          await target.send(`💎 You've been granted **Weird Guy Premium**! Try \`,wgfortune\`, \`,wgvip\`, \`,wgadvice\`, \`,wgstory\`.`);
        } catch {}
        break;
      }

      if (premSub === "remove") {
        const target = msg.mentions.users?.first();
        if (!target) return msg.reply("Usage: `,wgowner premium remove @user`");
        premium.revoke(target.id);
        await msg.reply(`✅ Removed premium from **${target.tag}**.`);
        break;
      }

      if (premSub === "list") {
        const list = premium.list();
        if (!list.length) return msg.reply("No premium users.");
        await msg.reply(`💎 **Premium Users (${list.length}):**\n${list.map(id => `<@${id}> (\`${id}\`)`).join("\n")}`);
        break;
      }

      await msg.reply([
        "**💎 Premium Management**",
        "`,wgowner premium add @user` — grant premium",
        "`,wgowner premium remove @user` — revoke premium",
        "`,wgowner premium list` — list all premium users",
      ].join("\n"));
      break;
    }

    default: {
      await msg.reply([
        "**👑 Owner Commands** — `,wgowner [sub]`",
        "`overview` — professional control center",
        "`health` — live latency, uptime, memory, and identity",
        "`server` — inspect the current server",
        "`say [message]` — owner voice message without the command",
        "`announce [message]` — luxury announcement embed",
        "`whoami` — confirm Weird Guy's owner identity",
        "`stats` — bot stats and uptime",
        "`status [type] [text]` — set the global bot presence; `status rotate` resets it",
        "`directive [text|clear]` — set a global AI instruction",
        "`ownerinfo` — show the remembered owner profile",
        "`chaos` — trigger an owner-only event in the current server",
        "`delegate add/remove/list` — grant selected owner features temporarily",
        "`guilds` — list all servers",
        "`broadcast [message]` — message all servers",
        "`invite` — bot invite link",
        "`dm @user [message]` — DM any user",
        "`reload` / `reset` — stop bot; manual workflow start required",
        "`premium add/remove/list @user` — manage premium",
        "`config [server-id]` — inspect a server's isolated settings",
        "`clearai [server-id]` — clear a server's AI context",
      ].join("\n"));
    }
  }
}

module.exports = {
  async handle(msg, args) {
    const requestedScope = ({
      presence: "status",
      personality: "directive",
      ownerprofile: "ownerinfo",
    })[args[0]?.toLowerCase()] || args[0]?.toLowerCase();

    // The real owner always uses the password gate. A delegate can only use
    // an explicitly granted, low-risk scope and can never grant more access.
    if (!config.isOwner(msg.author.id)) {
      if (!ownerAccess.hasScope(msg.author.id, requestedScope)) {
        await msg.reply("🔒 Owner-only command. You do not have a temporary grant for this feature.");
        return true;
      }
      await execute(msg, args);
      return true;
    }

    if (!OWNER_PASSWORD) {
      await msg.reply("🔐 Owner commands are temporarily locked because `OWNER_PASSWORD` is not configured as a private secret.");
      return true;
    }

    // Step 2 — Password gate (skipped if session is still active)
    if (!isSessionActive(msg.author.id)) {
      const challenge = await msg.reply(
        "🔐 **Owner verification required.**\n" +
        "Reply with the password in the next **30 seconds** — your message will be deleted immediately."
      );

      let resolved = false;

      const filter = m => m.author.id === msg.author.id;
      const collector = msg.channel.createMessageCollector({ filter, max: 1, time: 30_000 });

      collector.on("collect", async (m) => {
        resolved = true;
        await m.delete().catch(() => {}); // Delete password message immediately
        await challenge.delete().catch(() => {}); // Delete the bot challenge too

        if (m.content.trim() === OWNER_PASSWORD) {
          activateSession(msg.author.id);
          await execute(msg, args);
        } else {
          await msg.reply("❌ Wrong password. Command cancelled.");
        }
      });

      collector.on("end", () => {
        if (!resolved) {
          challenge.delete().catch(() => {});
          msg.reply("⏰ Verification timed out.").catch(() => {});
        }
      });

      return true;
    }

    // Step 3 — Already verified: execute directly
    await execute(msg, args);
    return true;
  },
};
