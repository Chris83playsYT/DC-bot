const { EmbedBuilder } = require("discord.js");
const config = require("../handlers/config");

function isOwner(userId) {
  return config.isOwner(userId);
}

module.exports = {
  async handle(msg, args) {
    if (!isOwner(msg.author.id)) {
      await msg.reply("🔒 That command is reserved for the bot owner only.");
      return true;
    }

    const sub = args[0]?.toLowerCase();

    switch (sub) {
      case "stats": {
        const guilds = msg.client.guilds.cache;
        const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);
        const embed = new EmbedBuilder()
          .setColor("#ff6b35")
          .setTitle("👑 Bot Owner Stats")
          .addFields(
            { name: "Servers", value: `${guilds.size}`, inline: true },
            { name: "Total Members", value: `${totalMembers.toLocaleString()}`, inline: true },
            { name: "Uptime", value: formatUptime(process.uptime()), inline: true },
            { name: "Memory", value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
            { name: "Node.js", value: process.version, inline: true },
            { name: "Owner ID", value: config.getOwnerId() || "Unknown", inline: true },
          )
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "guilds": {
        const guilds = msg.client.guilds.cache;
        if (!guilds.size) return msg.reply("Not in any servers.");
        const list = guilds.map((g, i) =>
          `**${g.name}** — ${g.memberCount} members (ID: \`${g.id}\`)`
        ).join("\n").slice(0, 3900);
        const embed = new EmbedBuilder()
          .setColor("#ff6b35")
          .setTitle(`👑 Servers (${guilds.size})`)
          .setDescription(list)
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "broadcast": {
        const message = args.slice(1).join(" ");
        if (!message) return msg.reply("Provide a message to broadcast. e.g. `!owner broadcast hello everyone`");
        const guilds = msg.client.guilds.cache;
        let sent = 0, failed = 0;
        for (const guild of guilds.values()) {
          try {
            const channel = guild.systemChannel
              || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me)?.has("SendMessages"));
            if (channel) {
              await channel.send(`📢 **[Bot Owner Broadcast]**\n${message}`);
              sent++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }
        await msg.reply(`📢 Broadcast sent to **${sent}** server(s). Failed: ${failed}.`);
        break;
      }

      case "invite": {
        const clientId = msg.client.application?.id || msg.client.user.id;
        const perms = "8"; // Administrator — covers all bot functionality
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${perms}&scope=bot`;
        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setTitle("🔗 Invite Weird Guy to a Server")
          .setDescription(`[Click here to invite the bot](${url})\n\nThe link requests **Administrator** permission — required for full mod functionality. You can restrict it in the invite flow if needed.`)
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "reload": {
        await msg.reply("🔄 Restarting bot process... watchdog will bring it back.");
        setTimeout(() => process.exit(1), 500);
        break;
      }

      case "dm": {
        const target = msg.mentions.users?.first();
        const dmMsg = args.slice(2).join(" ");
        if (!target || !dmMsg) return msg.reply("Usage: `!owner dm @user [message]`");
        try {
          await target.send(`📩 **Message from bot owner:**\n${dmMsg}`);
          await msg.reply(`✅ DM sent to **${target.tag}**.`);
        } catch {
          await msg.reply("❌ Could not DM that user — they may have DMs disabled.");
        }
        break;
      }

      default: {
        await msg.reply([
          "**👑 Bot Owner Commands** *(you only, obviously)*",
          "`!owner stats` — uptime, server count, memory, etc.",
          "`!owner guilds` — list all servers the bot is in",
          "`!owner broadcast [message]` — send message to all server system channels",
          "`!owner invite` — get the bot invite link",
          "`!owner dm @user [message]` — DM any user",
          "`!owner reload` — restart the bot process",
        ].join("\n"));
        break;
      }
    }

    return true;
  },
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}
