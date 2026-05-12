const { ChannelType, PermissionsBitField } = require("discord.js");
const config = require("../handlers/config");

const warnings = new Map();

function isAdmin(member) {
  return member.permissions.has("Administrator") || config.isOwner(member.id);
}

function getWarnings(guildId, userId) {
  return warnings.get(`${guildId}:${userId}`) || [];
}

function addWarning(guildId, userId, reason, moderator) {
  const key = `${guildId}:${userId}`;
  const list = getWarnings(guildId, userId);
  list.push({ reason, moderator, at: new Date().toISOString() });
  warnings.set(key, list);
  return list.length;
}

function clearWarnings(guildId, userId) {
  warnings.delete(`${guildId}:${userId}`);
}

async function applyThreshold(channel, target, total, guildId) {
  const thresholds = config.get(guildId).warnThresholds;
  const threshold = [...thresholds].reverse().find(t => total >= t.at);
  if (!threshold) return;
  try {
    if (threshold.action === "mute") {
      await target.timeout(threshold.durationMs, `Auto-mod: reached ${total} warnings`);
    } else if (threshold.action === "kick" && target.kickable) {
      await target.kick(`Auto-mod: reached ${total} warnings`);
    } else if (threshold.action === "ban" && target.bannable) {
      await target.ban({ reason: `Auto-mod: reached ${total} warnings` });
    }
    channel.send(
      `${threshold.emoji} **${target.displayName}** reached **${total} warnings** and has been **${threshold.label}** automatically.`
    );
  } catch {
    channel.send(`⚠️ Could not apply automatic action — check my role rank and permissions.`);
  }
}

const ADMIN_COMMANDS = [
  "kick","ban","mute","unmute","warn","warnings","clearwarns",
  "clear","purge","slowmode","lock","unlock","lockall","unlockall",
  "nuke","dehoist","setprefix","aiclear",
];

module.exports = {
  async handle(msg, fullCommand, args, prefixHandler) {
    const prefix = prefixHandler ? prefixHandler.getPrefix(msg.guild.id) : "!";
    const baseCommand = fullCommand.slice(prefix.length);

    if (!isAdmin(msg.member)) {
      if (ADMIN_COMMANDS.includes(baseCommand)) {
        msg.reply("🚫 You need **Administrator** permission to use that command.");
        return true;
      }
      return false;
    }

    switch (baseCommand) {
      case "setprefix": {
        const p = args[0];
        if (!p || p.length > 3) return msg.reply("Provide a prefix (1–3 chars). e.g. `!setprefix .`");
        config.setPrefix(msg.guild.id, p);
        msg.reply(`✅ Prefix updated to \`${p}\`. Use \`${p}help\` going forward.`);
        break;
      }

      case "aiclear": {
        const target = msg.mentions.members?.first() || msg.member;
        const ai = require("../handlers/ai");
        ai.clearHistory(msg.guild.id, target.id);
        msg.reply(`✅ Cleared AI conversation history for **${target.displayName}**.`);
        break;
      }

      case "kick": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to kick. e.g. \`${prefix}kick @user reason\``);
        if (!target.kickable) return msg.reply("I can't kick that member — they may outrank me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.kick(reason);
        msg.channel.send(`👢 **${target.displayName}** was kicked. Reason: ${reason}`);
        break;
      }

      case "ban": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to ban. e.g. \`${prefix}ban @user reason\``);
        if (!target.bannable) return msg.reply("I can't ban that member — they may outrank me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.ban({ reason });
        msg.channel.send(`🔨 **${target.displayName}** was banned. Reason: ${reason}`);
        break;
      }

      case "mute": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to mute. e.g. \`${prefix}mute @user 10\``);
        const minutes = parseInt(args[1]) || 10;
        if (minutes < 1 || minutes > 40320) return msg.reply("Duration must be between 1 and 40320 minutes.");
        await target.timeout(minutes * 60_000, `Muted by ${msg.author.tag}`);
        msg.channel.send(`🔇 **${target.displayName}** muted for **${minutes} minute(s)**.`);
        break;
      }

      case "unmute": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member to unmute.");
        await target.timeout(null);
        msg.channel.send(`🔊 **${target.displayName}** has been unmuted.`);
        break;
      }

      case "warn": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to warn. e.g. \`${prefix}warn @user reason\``);
        const reason = args.slice(1).join(" ") || "No reason provided";
        const total = addWarning(msg.guild.id, target.id, reason, msg.author.tag);
        const thresholds = config.get(msg.guild.id).warnThresholds;
        const ladder = thresholds.map(t => `${t.emoji} ${t.at}`).join(" · ");
        msg.channel.send(
          `⚠️ **${target.displayName}** warned. Reason: ${reason}\n` +
          `Total warnings: **${total}** — auto-actions at: ${ladder}`
        );
        await applyThreshold(msg.channel, target, total, msg.guild.id);
        break;
      }

      case "warnings": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member to check warnings.");
        const list = getWarnings(msg.guild.id, target.id);
        if (!list.length) return msg.reply(`✅ **${target.displayName}** has no warnings.`);
        const formatted = list.map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.moderator}`).join("\n");
        msg.reply(`⚠️ **${target.displayName}** has **${list.length}** warning(s):\n${formatted}`);
        break;
      }

      case "clearwarns": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member to clear warnings for.");
        clearWarnings(msg.guild.id, target.id);
        msg.reply(`✅ Cleared all warnings for **${target.displayName}**.`);
        break;
      }

      case "clear": {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
          return msg.reply(`Provide a number between 1 and 100. e.g. \`${prefix}clear 10\``);
        }
        await msg.channel.bulkDelete(amount + 1, true);
        const notice = await msg.channel.send(`🧹 Deleted **${amount}** message(s).`);
        setTimeout(() => notice.delete().catch(() => {}), 3000);
        break;
      }

      case "purge": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a user to purge. e.g. \`${prefix}purge @user 20\``);
        const amount = parseInt(args[1]) || 10;
        if (amount < 1 || amount > 100) return msg.reply("Provide a number between 1 and 100.");
        const messages = await msg.channel.messages.fetch({ limit: 100 });
        const toDelete = messages.filter(m => m.author.id === target.id).first(amount);
        const deleted = await msg.channel.bulkDelete(toDelete, true).catch(() => null);
        const count = deleted?.size ?? 0;
        const notice = await msg.channel.send(`🧹 Deleted **${count}** message(s) from **${target.displayName}**.`);
        setTimeout(() => notice.delete().catch(() => {}), 4000);
        break;
      }

      case "slowmode": {
        const seconds = parseInt(args[0]);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
          return msg.reply(`Provide seconds 0–21600. e.g. \`${prefix}slowmode 5\``);
        }
        await msg.channel.setRateLimitPerUser(seconds);
        msg.reply(seconds === 0 ? "✅ Slowmode disabled." : `✅ Slowmode set to **${seconds}s**.`);
        break;
      }

      case "lock": {
        await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: false });
        msg.channel.send("🔒 This channel has been **locked**.");
        break;
      }

      case "unlock": {
        await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: null });
        msg.channel.send("🔓 This channel has been **unlocked**.");
        break;
      }

      case "lockall": {
        const channels = msg.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;
        for (const ch of channels.values()) {
          try {
            await ch.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: false });
            count++;
          } catch {}
        }
        msg.reply(`🔒 Locked **${count}** text channel(s). Use \`${prefix}unlockall\` to restore.`);
        break;
      }

      case "unlockall": {
        const channels = msg.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;
        for (const ch of channels.values()) {
          try {
            await ch.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: null });
            count++;
          } catch {}
        }
        msg.reply(`🔓 Unlocked **${count}** text channel(s).`);
        break;
      }

      case "nuke": {
        const confirmArgs = args[0]?.toLowerCase();
        if (confirmArgs !== "confirm") {
          return msg.reply(`⚠️ This will **DELETE and RECREATE** this channel, wiping all message history.\nType \`${prefix}nuke confirm\` to proceed. This cannot be undone.`);
        }
        const ch = msg.channel;
        const position = ch.position;
        const newChannel = await ch.clone({ reason: `Nuked by ${msg.author.tag}` });
        await newChannel.setPosition(position);
        await ch.delete();
        await newChannel.send("💥 Channel has been nuked. History? Gone. Fresh start.");
        break;
      }

      case "dehoist": {
        const hoistRegex = /^[^a-zA-Z0-9]/;
        const members = await msg.guild.members.fetch();
        let count = 0;
        for (const member of members.values()) {
          if (hoistRegex.test(member.displayName) && member.manageable) {
            try {
              await member.setNickname(`z${member.displayName}`, "Dehoist");
              count++;
            } catch {}
          }
        }
        msg.reply(`✅ Dehoisted **${count}** member(s) — added \`z\` prefix to remove them from the top of the member list.`);
        break;
      }

      default:
        return false;
    }
    return true;
  },
};
