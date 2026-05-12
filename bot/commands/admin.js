const { ChannelType, PermissionsBitField } = require("discord.js");
const config = require("../handlers/config");
const logger = require("../handlers/logger");

const warnings = new Map();
const modNotes = new Map();

// Explicitly verify the member has at least one role with Administrator permission.
// Also grants access to the registered bot owner unconditionally.
function isAdmin(member) {
  if (config.isOwner(member.id)) return true;
  return member.roles.cache.some(role =>
    role.permissions.has(PermissionsBitField.Flags.Administrator)
  );
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
      await target.timeout(threshold.durationMs, `Auto-mod: ${total} warnings`);
    } else if (threshold.action === "kick" && target.kickable) {
      await target.kick(`Auto-mod: ${total} warnings`);
    } else if (threshold.action === "ban" && target.bannable) {
      await target.ban({ reason: `Auto-mod: ${total} warnings` });
    }
    channel.send(`${threshold.emoji} **${target.displayName}** reached **${total} warnings** → **${threshold.label}** automatically.`);
  } catch {
    channel.send("⚠️ Could not apply automatic action — check my role rank and permissions.");
  }
}

const ADMIN_COMMANDS = [
  "kick","ban","softban","unban","mute","unmute","timeout",
  "warn","warnings","clearwarns","clear","purge","slowmode",
  "lock","unlock","lockall","unlockall","nuke","dehoist",
  "role","modnote","notes","raidmode","setprefix","aiclear",
];

module.exports = {
  async handle(msg, fullCommand, args, prefixHandler) {
    const prefix = prefixHandler ? prefixHandler.getPrefix(msg.guild.id) : ",wg";
    const baseCommand = fullCommand.slice(prefix.length);

    if (!isAdmin(msg.member)) {
      if (ADMIN_COMMANDS.includes(baseCommand)) {
        // Tell them what role they're missing
        const adminRoles = msg.guild.roles.cache
          .filter(r => r.permissions.has(PermissionsBitField.Flags.Administrator) && r.id !== msg.guild.id)
          .map(r => `**${r.name}**`)
          .slice(0, 5);
        const roleHint = adminRoles.length
          ? `You need one of: ${adminRoles.join(", ")}.`
          : "You need a role with **Administrator** permission.";
        await msg.reply(`🚫 Admin-only command. ${roleHint}`);
        return true;
      }
      return false;
    }

    switch (baseCommand) {
      case "setprefix": {
        const p = args[0];
        if (!p || p.length > 5) return msg.reply("Provide a prefix (1–5 chars).");
        config.setPrefix(msg.guild.id, p);
        msg.reply(`✅ Prefix set to \`${p}\``);
        break;
      }

      case "aiclear": {
        const target = msg.mentions.members?.first() || msg.member;
        require("../handlers/ai").clearHistory(msg.guild.id, target.id);
        msg.reply(`✅ Cleared AI history for **${target.displayName}**.`);
        break;
      }

      case "kick": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}kick @user [reason]\``);
        if (!target.kickable) return msg.reply("I can't kick that member — they may outrank me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.kick(reason);
        msg.channel.send(`👢 **${target.displayName}** was kicked. Reason: ${reason}`);
        await logger.logAction(msg.guild, { type: "kick", moderator: msg.author, target: target.user, reason });
        break;
      }

      case "ban": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}ban @user [reason]\``);
        if (!target.bannable) return msg.reply("I can't ban that member — they may outrank me.");
        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.ban({ reason });
        msg.channel.send(`🔨 **${target.displayName}** was banned. Reason: ${reason}`);
        await logger.logAction(msg.guild, { type: "ban", moderator: msg.author, target: target.user, reason });
        break;
      }

      case "softban": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}softban @user [reason]\``);
        if (!target.bannable) return msg.reply("I can't ban that member.");
        const reason = args.slice(1).join(" ") || "Softban";
        await target.ban({ reason, deleteMessageSeconds: 604800 });
        await msg.guild.bans.remove(target.id, "Softban auto-unban");
        msg.channel.send(`🔨 **${target.displayName}** softbanned — messages cleared, no permanent ban.`);
        await logger.logAction(msg.guild, { type: "softban", moderator: msg.author, target: target.user, reason });
        break;
      }

      case "unban": {
        const userId = args[0];
        if (!userId) return msg.reply(`Usage: \`${prefix}unban [user-id]\``);
        try {
          const banned = await msg.guild.bans.fetch(userId);
          await msg.guild.bans.remove(userId);
          msg.reply(`✅ Unbanned **${banned.user.tag}**.`);
          await logger.logAction(msg.guild, { type: "unban", moderator: msg.author, target: banned.user });
        } catch {
          msg.reply("❌ User not found in ban list. Check the ID.");
        }
        break;
      }

      case "mute":
      case "timeout": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}mute @user [minutes] [reason]\``);
        const minutes = parseInt(args[1]) || 10;
        if (minutes < 1 || minutes > 40320) return msg.reply("Duration: 1–40320 minutes.");
        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.timeout(minutes * 60_000, reason);
        msg.channel.send(`🔇 **${target.displayName}** muted for **${minutes} min**. Reason: ${reason}`);
        await logger.logAction(msg.guild, { type: "mute", moderator: msg.author, target: target.user, reason, extra: `Duration: ${minutes} minutes` });
        break;
      }

      case "unmute": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member to unmute.");
        await target.timeout(null);
        msg.channel.send(`🔊 **${target.displayName}** unmuted.`);
        await logger.logAction(msg.guild, { type: "unmute", moderator: msg.author, target: target.user });
        break;
      }

      case "warn": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}warn @user [reason]\``);
        const reason = args.slice(1).join(" ") || "No reason provided";
        const total = addWarning(msg.guild.id, target.id, reason, msg.author.tag);
        const thresholds = config.get(msg.guild.id).warnThresholds;
        const ladder = thresholds.map(t => `${t.emoji} ${t.at}`).join(" · ");
        msg.channel.send(`⚠️ **${target.displayName}** warned. Reason: ${reason}\nTotal: **${total}** — auto-actions at: ${ladder}`);
        await applyThreshold(msg.channel, target, total, msg.guild.id);
        await logger.logAction(msg.guild, { type: "warn", moderator: msg.author, target: target.user, reason, extra: `Total warnings: ${total}` });
        break;
      }

      case "warnings": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member.");
        const list = getWarnings(msg.guild.id, target.id);
        if (!list.length) return msg.reply(`✅ **${target.displayName}** has no warnings.`);
        msg.reply(`⚠️ **${target.displayName}** — **${list.length}** warning(s):\n${list.map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.moderator}`).join("\n")}`);
        break;
      }

      case "clearwarns": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member.");
        clearWarnings(msg.guild.id, target.id);
        msg.reply(`✅ Cleared all warnings for **${target.displayName}**.`);
        break;
      }

      case "clear": {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) return msg.reply(`Usage: \`${prefix}clear [1-100]\``);
        await msg.channel.bulkDelete(amount + 1, true);
        const notice = await msg.channel.send(`🧹 Deleted **${amount}** message(s).`);
        setTimeout(() => notice.delete().catch(() => {}), 3000);
        await logger.logAction(msg.guild, { type: "clear", moderator: msg.author, extra: `${amount} messages in #${msg.channel.name}` });
        break;
      }

      case "purge": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}purge @user [1-100]\``);
        const amount = parseInt(args[1]) || 10;
        if (amount < 1 || amount > 100) return msg.reply("Number must be 1–100.");
        const messages = await msg.channel.messages.fetch({ limit: 100 });
        const toDelete = messages.filter(m => m.author.id === target.id).first(amount);
        const deleted = await msg.channel.bulkDelete(toDelete, true).catch(() => null);
        const count = deleted?.size ?? 0;
        const notice = await msg.channel.send(`🧹 Deleted **${count}** message(s) from **${target.displayName}**.`);
        setTimeout(() => notice.delete().catch(() => {}), 4000);
        await logger.logAction(msg.guild, { type: "purge", moderator: msg.author, target: target.user, extra: `${count} messages` });
        break;
      }

      case "slowmode": {
        const seconds = parseInt(args[0]);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) return msg.reply(`Usage: \`${prefix}slowmode [0-21600]\``);
        await msg.channel.setRateLimitPerUser(seconds);
        msg.reply(seconds === 0 ? "✅ Slowmode disabled." : `✅ Slowmode set to **${seconds}s**.`);
        await logger.logAction(msg.guild, { type: "slowmode", moderator: msg.author, extra: `${seconds}s in #${msg.channel.name}` });
        break;
      }

      case "lock": {
        await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: false });
        msg.channel.send("🔒 Channel locked.");
        await logger.logAction(msg.guild, { type: "lock", moderator: msg.author, extra: `#${msg.channel.name}` });
        break;
      }

      case "unlock": {
        await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: null });
        msg.channel.send("🔓 Channel unlocked.");
        await logger.logAction(msg.guild, { type: "unlock", moderator: msg.author, extra: `#${msg.channel.name}` });
        break;
      }

      case "lockall": {
        const channels = msg.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;
        for (const ch of channels.values()) {
          try { await ch.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: false }); count++; } catch {}
        }
        msg.reply(`🔒 Locked **${count}** channels.`);
        await logger.logAction(msg.guild, { type: "lockall", moderator: msg.author, extra: `${count} channels` });
        break;
      }

      case "unlockall": {
        const channels = msg.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;
        for (const ch of channels.values()) {
          try { await ch.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: null }); count++; } catch {}
        }
        msg.reply(`🔓 Unlocked **${count}** channels.`);
        await logger.logAction(msg.guild, { type: "unlockall", moderator: msg.author, extra: `${count} channels` });
        break;
      }

      case "nuke": {
        if (args[0]?.toLowerCase() !== "confirm") {
          return msg.reply(`⚠️ This deletes and recreates this channel. Type \`${prefix}nuke confirm\` to proceed.`);
        }
        const ch = msg.channel;
        const position = ch.position;
        const newCh = await ch.clone({ reason: `Nuked by ${msg.author.tag}` });
        await newCh.setPosition(position);
        await ch.delete();
        await newCh.send("💥 Channel nuked. History gone. Fresh start.");
        await logger.logAction(msg.guild, { type: "nuke", moderator: msg.author, extra: `#${ch.name}` });
        break;
      }

      case "dehoist": {
        const members = await msg.guild.members.fetch();
        let count = 0;
        for (const member of members.values()) {
          if (/^[^a-zA-Z0-9]/.test(member.displayName) && member.manageable) {
            try { await member.setNickname(`z${member.displayName}`, "Dehoist"); count++; } catch {}
          }
        }
        msg.reply(`✅ Dehoisted **${count}** member(s).`);
        await logger.logAction(msg.guild, { type: "dehoist", moderator: msg.author, extra: `${count} members` });
        break;
      }

      case "role": {
        const sub = args[0]?.toLowerCase();
        const target = msg.mentions.members?.first();
        const role = msg.mentions.roles?.first();
        if (!["add", "remove"].includes(sub) || !target || !role) {
          return msg.reply(`Usage:\n\`${prefix}role add @user @role\`\n\`${prefix}role remove @user @role\``);
        }
        if (!role.editable) return msg.reply("I can't manage that role — it may be higher than mine.");
        if (sub === "add") {
          await target.roles.add(role);
          msg.reply(`✅ Added **${role.name}** to **${target.displayName}**.`);
          await logger.logAction(msg.guild, { type: "role_add", moderator: msg.author, target: target.user, extra: `Role: ${role.name}` });
        } else {
          await target.roles.remove(role);
          msg.reply(`✅ Removed **${role.name}** from **${target.displayName}**.`);
          await logger.logAction(msg.guild, { type: "role_remove", moderator: msg.author, target: target.user, extra: `Role: ${role.name}` });
        }
        break;
      }

      case "modnote": {
        const target = msg.mentions.members?.first();
        const note = args.slice(1).join(" ");
        if (!target || !note) return msg.reply(`Usage: \`${prefix}modnote @user [note]\``);
        const key = `${msg.guild.id}:${target.id}`;
        const notes = modNotes.get(key) || [];
        notes.push({ note, by: msg.author.tag, at: new Date().toISOString() });
        modNotes.set(key, notes);
        msg.reply(`📝 Note added for **${target.displayName}** (${notes.length} total).`);
        await logger.logAction(msg.guild, { type: "modnote", moderator: msg.author, target: target.user, reason: note });
        break;
      }

      case "notes": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member.");
        const notes = modNotes.get(`${msg.guild.id}:${target.id}`) || [];
        if (!notes.length) return msg.reply(`✅ No mod notes for **${target.displayName}**.`);
        msg.reply(`📝 **${target.displayName}** — ${notes.length} note(s):\n${notes.map((n, i) => `**${i + 1}.** ${n.note} — *${n.by}*`).join("\n")}`);
        break;
      }

      case "raidmode": {
        const sub = args[0]?.toLowerCase();
        const days = parseInt(args[1]) || 7;
        if (!["on", "off"].includes(sub)) return msg.reply(`Usage: \`${prefix}raidmode on [days]\` or \`${prefix}raidmode off\``);
        const enabled = sub === "on";
        config.setRaidMode(msg.guild.id, enabled, days);
        msg.reply(enabled
          ? `🚨 Raid mode **ON** — auto-kicking accounts newer than **${days} days**.`
          : "✅ Raid mode **OFF**."
        );
        await logger.logAction(msg.guild, { type: "raidmode", moderator: msg.author, extra: enabled ? `Enabled — accounts < ${days} days` : "Disabled" });
        break;
      }

      default:
        return false;
    }
    return true;
  },
};
