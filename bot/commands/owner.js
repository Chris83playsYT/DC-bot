const { EmbedBuilder } = require("discord.js");
const config = require("../handlers/config");
const premium = require("../handlers/premium");

// Password stored in env so it can be changed without touching code.
// Default matches what was configured at setup.
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "The_Real_Yes83";

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
      await msg.reply("🔄 Restarting — watchdog will bring it back in seconds.");
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

    case "eval": {
      const code = args.slice(1).join(" ");
      if (!code) return msg.reply("Provide code to eval.");
      try {
        // eslint-disable-next-line no-eval
        let result = eval(code);
        if (typeof result !== "string") result = require("util").inspect(result, { depth: 1 });
        await msg.reply(`\`\`\`js\n${String(result).slice(0, 1900)}\n\`\`\``);
      } catch (err) {
        await msg.reply(`❌ \`${err.message}\``);
      }
      break;
    }

    default: {
      await msg.reply([
        "**👑 Owner Commands** — `,wgowner [sub]`",
        "`stats` — bot stats and uptime",
        "`guilds` — list all servers",
        "`broadcast [message]` — message all servers",
        "`invite` — bot invite link",
        "`dm @user [message]` — DM any user",
        "`reload` / `reset` — restart bot",
        "`premium add/remove/list @user` — manage premium",
        "`eval [code]` — run JS",
      ].join("\n"));
    }
  }
}

module.exports = {
  async handle(msg, args) {
    // Step 1 — Must be the registered bot owner by ID
    if (!config.isOwner(msg.author.id)) {
      await msg.reply("🔒 Owner-only command.");
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
