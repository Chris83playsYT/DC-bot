const { ChannelType, PermissionsBitField } = require("discord.js");
const config = require("../handlers/config");
const logger = require("../handlers/logger");
const security = require("../handlers/security");

const storage = require("../handlers/storage");

// Explicitly verify the member has at least one role with Administrator permission.
// Also grants access to the registered bot owner unconditionally.
function isAdmin(member) {
  return security.isGuildAdmin(member);
}

function getWarnings(guildId, userId) {
  return storage.state.warnings[`${guildId}:${userId}`] || [];
}

function addWarning(guildId, userId, reason, moderator) {
  const key = `${guildId}:${userId}`;
  const list = getWarnings(guildId, userId);
  list.push({ reason, moderator, at: new Date().toISOString() });
  storage.state.warnings[key] = list;
  storage.save();
  return list.length;
}

function clearWarnings(guildId, userId) {
  delete storage.state.warnings[`${guildId}:${userId}`];
  storage.save();
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
  "announce","nick","memberinfo","channelinfo",
  "serverstats","roleinfo","unwarn","topic","permissions","rolelist","audit",
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
      case "permissions": {
        const me = msg.guild.members.me || await msg.guild.members.fetchMe().catch(() => null);
        if (!me) return msg.reply("⚠️ I couldn't inspect my server permissions.");
        const important = [
          ["Manage Messages", "ManageMessages"],
          ["Moderate Members", "ModerateMembers"],
          ["Kick Members", "KickMembers"],
          ["Ban Members", "BanMembers"],
          ["Manage Channels", "ManageChannels"],
          ["Manage Roles", "ManageRoles"],
          ["View Audit Log", "ViewAuditLog"],
        ];
        const lines = important.map(([label, flag]) =>
          `${me.permissions.has(flag) ? "✅" : "❌"} ${label}`
        );
        return msg.reply([
          `🛡️ **Weird Guy Permission Check — ${msg.guild.name}**`,
          ...lines,
          "",
          "Missing permissions can make a command fail even when you have Administrator.",
        ].join("\n"));
      }

      case "rolelist": {
        const roles = [...msg.guild.roles.cache.values()]
          .filter(role => role.id !== msg.guild.id)
          .sort((a, b) => b.position - a.position)
          .slice(0, 30);
        const lines = roles.map(role =>
          `${role.managed ? "🔗" : "🏷️"} <@&${role.id}> — **${role.members.size}** member(s)${role.hexColor !== "#000000" ? ` · ${role.hexColor}` : ""}`
        );
        return msg.reply([
          `🏷️ **Role Directory — ${msg.guild.name}**`,
          lines.join("\n") || "No custom roles found.",
          roles.length >= 30 ? "*Showing the 30 highest roles.*" : "",
        ].filter(Boolean).join("\n"));
      }

      case "audit": {
        const warnings = Object.entries(storage.state.warnings)
          .filter(([key]) => key.startsWith(`${msg.guild.id}:`));
        const warningCount = warnings.reduce((sum, [, list]) => sum + list.length, 0);
        const cfg = config.get(msg.guild.id);
        return msg.reply([
          `📋 **Admin Snapshot — ${msg.guild.name}**`,
          `⚠️ Active warning records: **${warnings.length}** · Total warnings: **${warningCount}**`,
          `🚨 Raid mode: **${cfg.raidMode ? "ON" : "OFF"}** · Auto-mod: **${cfg.automod.enabled ? "ON" : "OFF"}**`,
          `🧠 AI chat: **${cfg.aiChat ? "ON" : "OFF"}** · Levels: **${cfg.levels.enabled ? "ON" : "OFF"}**`,
          `📝 Log channel: ${cfg.logChannelId ? `<#${cfg.logChannelId}>` : "not configured"}`,
          `👮 Admin roles: **${cfg.adminRoleIds.length}** configured`,
        ].join("\n"));
      }

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

      case "announce": {
        const channel = msg.mentions.channels?.first();
        const channelIndex = channel ? args.indexOf(`<#${channel.id}>`) : -1;
        const announcement = channelIndex >= 0 ? args.slice(channelIndex + 1).join(" ") : "";
        if (!channel || !announcement) {
          return msg.reply(`Usage: \`${prefix}announce #channel [message]\``);
        }
        if (!channel.isTextBased()) return msg.reply("That is not a text channel.");
        const sent = await channel.send(`📢 **${msg.guild.name} Announcement**\n${announcement}`);
        await msg.reply(`✅ Announcement sent to <#${channel.id}>.`);
        await logger.logAction(msg.guild, { type: "announce", moderator: msg.author, extra: `#${channel.name}: ${announcement.slice(0, 500)}` });
        return sent;
      }

      case "nick":
      case "nickname": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}nick @user [new nickname]\` or \`${prefix}nick @user reset\``);
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't change the nickname of yourself, the bot, or a protected administrator/owner.");
        if (!target.manageable) return msg.reply("I can't manage that member — they may outrank my role.");
        const mention = `<@!?${target.id}>`;
        const mentionIndex = args.findIndex(value => value === mention || value === `<@${target.id}>` || value === `<@!${target.id}>`);
        const nickname = args.slice(Math.max(1, mentionIndex + 1)).join(" ");
        if (!nickname) return msg.reply("Provide a nickname or `reset`.");
        const next = nickname.toLowerCase() === "reset" ? null : nickname.slice(0, 32);
        await target.setNickname(next, `Changed by ${msg.author.tag}`);
        msg.reply(next ? `✅ Nickname set for **${target.displayName}**.` : `✅ Nickname reset for **${target.user.tag}**.`);
        await logger.logAction(msg.guild, { type: "nickname", moderator: msg.author, target: target.user, extra: next || "reset" });
        break;
      }

      case "memberinfo": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}memberinfo @user\``);
        const roles = target.roles.cache
          .filter(role => role.id !== msg.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.name)
          .slice(0, 15);
        return msg.reply([
          `**🔎 Member Info: ${target.user.tag}**`,
          `ID: \`${target.id}\``,
          `Joined: ${target.joinedAt ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>` : "unknown"}`,
          `Created: <t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,
          `Timed out: ${target.communicationDisabledUntilTimestamp ? `<t:${Math.floor(target.communicationDisabledUntilTimestamp / 1000)}:R>` : "no"}`,
          `Roles: ${roles.length ? roles.map(role => `\`${role}\``).join(", ") : "none"}`,
        ].join("\n"));
      }

      case "channelinfo": {
        const channel = msg.mentions.channels?.first() || msg.channel;
        return msg.reply([
          `**📌 Channel Info: #${channel.name}**`,
          `ID: \`${channel.id}\``,
          `Type: \`${channel.type}\``,
          `Position: **${channel.position ?? "n/a"}**`,
          `Slowmode: **${channel.rateLimitPerUser || 0}s**`,
          `Topic: ${channel.topic || "none"}`,
        ].join("\n"));
      }

      case "serverstats": {
        const members = await msg.guild.members.fetch().catch(() => msg.guild.members.cache);
        const humans = members.filter(member => !member.user.bot).size;
        const bots = members.filter(member => member.user.bot).size;
        const text = msg.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size;
        const voice = msg.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size;
        return msg.reply([
          `**📊 Server Stats: ${msg.guild.name}**`,
          `Members: **${members.size.toLocaleString()}** (${humans.toLocaleString()} humans · ${bots.toLocaleString()} bots)`,
          `Channels: **${msg.guild.channels.cache.size}** (${text} text · ${voice} voice)`,
          `Roles: **${Math.max(0, msg.guild.roles.cache.size - 1)}**`,
          `Boosts: **${msg.guild.premiumSubscriptionCount || 0}**`,
          `Created: <t:${Math.floor(msg.guild.createdTimestamp / 1000)}:D>`,
        ].join("\n"));
      }

      case "roleinfo": {
        const role = msg.mentions.roles?.first();
        if (!role) return msg.reply(`Usage: \`${prefix}roleinfo @role\``);
        const members = role.members?.size ?? msg.guild.members.cache.filter(member => member.roles.cache.has(role.id)).size;
        return msg.reply([
          `**🏷️ Role Info: ${role.name}**`,
          `ID: \`${role.id}\``,
          `Members: **${members}**`,
          `Position: **${role.position}**`,
          `Color: **${role.hexColor}**`,
          `Managed by integration: **${role.managed ? "yes" : "no"}**`,
          `Mentionable: **${role.mentionable ? "yes" : "no"}**`,
        ].join("\n"));
      }

      case "unwarn": {
        const target = msg.mentions.members?.first();
        const number = parseInt(args[1], 10);
        if (!target || !Number.isInteger(number) || number < 1) {
          return msg.reply(`Usage: \`${prefix}unwarn @user [warning-number]\``);
        }
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't edit warnings for yourself, the bot, or a protected administrator/owner.");
        const key = `${msg.guild.id}:${target.id}`;
        const list = getWarnings(msg.guild.id, target.id);
        if (number > list.length) return msg.reply(`That user has only **${list.length}** warning(s).`);
        const [removed] = list.splice(number - 1, 1);
        if (list.length) storage.state.warnings[key] = list;
        else delete storage.state.warnings[key];
        storage.save();
        await msg.reply(`✅ Removed warning **#${number}** from **${target.displayName}**: ${removed.reason}`);
        await logger.logAction(msg.guild, { type: "unwarn", moderator: msg.author, target: target.user, reason: removed.reason });
        break;
      }

      case "topic": {
        const value = args.join(" ");
        if (!value) return msg.reply(`Usage: \`${prefix}topic [new topic]\` or \`${prefix}topic clear\``);
        const topic = value.toLowerCase() === "clear" ? null : value.slice(0, 1024);
        await msg.channel.setTopic(topic, `Changed by ${msg.author.tag}`);
        return msg.reply(topic ? "✅ Channel topic updated." : "✅ Channel topic cleared.");
      }

      case "kick": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}kick @user [reason]\``);
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't moderate yourself, the bot, or a protected administrator/owner.");
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
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't moderate yourself, the bot, or a protected administrator/owner.");
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
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't moderate yourself, the bot, or a protected administrator/owner.");
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
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't moderate yourself, the bot, or a protected administrator/owner.");
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
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't change the timeout of yourself, the bot, or a protected administrator/owner.");
        await target.timeout(null);
        msg.channel.send(`🔊 **${target.displayName}** unmuted.`);
        await logger.logAction(msg.guild, { type: "unmute", moderator: msg.author, target: target.user });
        break;
      }

      case "warn": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Usage: \`${prefix}warn @user [reason]\``);
        if (security.isProtectedTarget(msg, target)) return msg.reply("🛡️ I won't warn yourself, the bot, or a protected administrator/owner.");
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
         const notes = storage.state.modNotes[key] || [];
        notes.push({ note, by: msg.author.tag, at: new Date().toISOString() });
         storage.state.modNotes[key] = notes;
         storage.save();
        msg.reply(`📝 Note added for **${target.displayName}** (${notes.length} total).`);
        await logger.logAction(msg.guild, { type: "modnote", moderator: msg.author, target: target.user, reason: note });
        break;
      }

      case "notes": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply("Mention a member.");
         const notes = storage.state.modNotes[`${msg.guild.id}:${target.id}`] || [];
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
