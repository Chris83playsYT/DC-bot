const warnings = new Map();

function isAdmin(member) {
  return member.permissions.has("Administrator");
}

function getWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return warnings.get(key) || [];
}

function addWarning(guildId, userId, reason, moderator) {
  const key = `${guildId}:${userId}`;
  const list = getWarnings(guildId, userId);
  list.push({ reason, moderator, at: new Date().toISOString() });
  warnings.set(key, list);
  return list.length;
}

function clearWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  warnings.delete(key);
}

const THRESHOLDS = [
  { at: 3, action: "mute",  label: "auto-muted for 10 minutes",  emoji: "🔇" },
  { at: 5, action: "kick",  label: "auto-kicked from the server", emoji: "👢" },
  { at: 7, action: "ban",   label: "auto-banned from the server", emoji: "🔨" },
];

async function applyThreshold(channel, target, total) {
  const threshold = THRESHOLDS.slice().reverse().find(t => total >= t.at);
  if (!threshold) return;

  try {
    if (threshold.action === "mute") {
      await target.timeout(10 * 60 * 1000, `Auto-mod: reached ${total} warnings`);
    } else if (threshold.action === "kick" && target.kickable) {
      await target.kick(`Auto-mod: reached ${total} warnings`);
    } else if (threshold.action === "ban" && target.bannable) {
      await target.ban({ reason: `Auto-mod: reached ${total} warnings` });
    }
    channel.send(
      `${threshold.emoji} **${target.displayName}** has reached **${total} warnings** and has been **${threshold.label}** automatically.`
    );
  } catch {
    channel.send(`⚠️ Could not apply automatic action — I may lack the permissions or role rank.`);
  }
}

module.exports = {
  async handle(msg, command, args, prefixHandler) {
    const adminCommands = ["kick","ban","mute","unmute","warn","warnings","clearwarns","clear","slowmode","lock","unlock","setprefix"];
    const prefix = prefixHandler ? prefixHandler.get(msg.guild.id) : "!";
    const baseCommand = command.slice(prefix.length);

    if (!isAdmin(msg.member)) {
      if (adminCommands.includes(baseCommand)) {
        msg.reply("🚫 You need **Administrator** permission to use that command.");
        return true;
      }
      return false;
    }

    if (baseCommand === "setprefix") {
      const newPrefix = args[0];
      if (!newPrefix || newPrefix.length > 3) {
        return msg.reply("Provide a prefix (1–3 characters). e.g. `!setprefix .`");
      }
      prefixHandler.set(msg.guild.id, newPrefix);
      msg.reply(`✅ Prefix updated to \`${newPrefix}\`. Commands now use \`${newPrefix}help\`, \`${newPrefix}kick\`, etc.`);
      return true;
    }

    switch (baseCommand) {
      case "kick": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to kick. e.g. \`${prefix}kick @user reason\``);
        if (!target.kickable) return msg.reply("I can't kick that member — they may have a higher role than me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.kick(reason);
        msg.channel.send(`👢 **${target.displayName}** was kicked. Reason: ${reason}`);
        break;
      }

      case "ban": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to ban. e.g. \`${prefix}ban @user reason\``);
        if (!target.bannable) return msg.reply("I can't ban that member — they may have a higher role than me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.ban({ reason });
        msg.channel.send(`🔨 **${target.displayName}** was banned. Reason: ${reason}`);
        break;
      }

      case "mute": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention a member to mute. e.g. \`${prefix}mute @user 10\``);
        const minutes = parseInt(args[1]) || 10;
        if (minutes < 1 || minutes > 40320) return msg.reply("Mute duration must be between 1 and 40320 minutes.");
        const ms = minutes * 60 * 1000;
        await target.timeout(ms, `Muted by ${msg.author.tag}`);
        msg.channel.send(`🔇 **${target.displayName}** has been muted for **${minutes} minute(s)**.`);
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
        if (!target) return msg.reply(`Mention a member to warn. e.g. \`${prefix}warn @user bad behavior\``);
        const reason = args.slice(1).join(" ") || "No reason provided";
        const total = addWarning(msg.guild.id, target.id, reason, msg.author.tag);
        msg.channel.send(
          `⚠️ **${target.displayName}** has been warned. Reason: ${reason}\n` +
          `Total warnings: **${total}** — ` +
          `🔇 mute at 3 · 👢 kick at 5 · 🔨 ban at 7`
        );
        await applyThreshold(msg.channel, target, total);
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

      case "slowmode": {
        const seconds = parseInt(args[0]);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
          return msg.reply(`Provide seconds between 0 and 21600. e.g. \`${prefix}slowmode 5\` (0 to disable)`);
        }
        await msg.channel.setRateLimitPerUser(seconds);
        msg.reply(seconds === 0
          ? "✅ Slowmode disabled."
          : `✅ Slowmode set to **${seconds} second(s)**.`);
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

      default:
        return false;
    }
    return true;
  },
};
