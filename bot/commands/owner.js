const { EmbedBuilder } = require("discord.js");
const config = require("../handlers/config");
const premium = require("../handlers/premium");

function isOwner(userId) {
  return config.isOwner(userId);
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

module.exports = {
  async handle(msg, args) {
    if (!isOwner(msg.author.id)) {
      await msg.reply("🔒 Owner-only command.");
      return true;
    }

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
          .join("\n")
          .slice(0, 3900);
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
        if (!message) return msg.reply("Provide a message. e.g. `,wgowner broadcast hello everyone`");
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
          await msg.reply("❌ Couldn't DM that user — DMs may be disabled.");
        }
        break;
      }

      case "reload":
      case "reset": {
        await msg.reply("🔄 Restarting bot — watchdog will bring it back up in a few seconds.");
        setTimeout(() => process.exit(1), 500);
        break;
      }

      case "premium": {
        const premSub = args[1]?.toLowerCase();

        if (premSub === "add") {
          const target = msg.mentions.users?.first();
          if (!target) return msg.reply("Mention a user. e.g. `,wgowner premium add @user`");
          premium.grant(target.id);
          await msg.reply(`💎 **${target.tag}** has been granted premium! They can now use exclusive commands.`);
          try {
            await target.send(`💎 You've been granted **Weird Guy Premium** by the bot owner! Try \`,wgfortune\`, \`,wgvip\`, \`,wgadvice\`, and \`,wgstory\`.`);
          } catch {}
          break;
        }

        if (premSub === "remove") {
          const target = msg.mentions.users?.first();
          if (!target) return msg.reply("Mention a user. e.g. `,wgowner premium remove @user`");
          premium.revoke(target.id);
          await msg.reply(`✅ Removed premium from **${target.tag}**.`);
          break;
        }

        if (premSub === "list") {
          const list = premium.list();
          if (!list.length) return msg.reply("No premium users currently.");
          const formatted = list.map(id => `<@${id}> (\`${id}\`)`).join("\n");
          await msg.reply(`💎 **Premium Users (${list.length}):**\n${formatted}`);
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
        // Owner-only debug eval — be careful
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
          "**👑 Owner Commands** — all use `,wgowner [sub]`",
          "`stats` — bot stats and uptime",
          "`guilds` — list all servers",
          "`broadcast [message]` — message all servers",
          "`invite` — bot invite link",
          "`dm @user [message]` — DM any user",
          "`reload` / `reset` — restart bot process",
          "`premium add/remove/list @user` — manage premium",
          "`eval [code]` — run arbitrary JS (careful)",
        ].join("\n"));
        break;
      }
    }

    return true;
  },
};
