const { EmbedBuilder } = require("discord.js");
const storage = require("./storage");
const config = require("./config");

const recentAwards = new Map();

function guildState(guildId) {
  const state = storage.state;
  if (!state.levels[guildId]) state.levels[guildId] = {};
  return state.levels[guildId];
}

function blankUser() {
  return { xp: 0, messages: 0, commands: 0, lastAwardAt: 0 };
}

function getUser(guildId, userId) {
  const guild = guildState(guildId);
  if (!guild[userId]) guild[userId] = blankUser();
  return guild[userId];
}

function levelForXp(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

function xpForLevel(level) {
  return Math.max(0, (Math.max(1, level) - 1) ** 2 * 100);
}

function progressFor(xp) {
  const level = levelForXp(xp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  return {
    level,
    current: xp - currentFloor,
    needed: nextFloor - currentFloor,
    next: nextFloor,
  };
}

function displayName(msg, userId) {
  return msg.guild.members.cache.get(userId)?.displayName || `<@${userId}>`;
}

function award(guildId, userId, amount, kind = "message") {
  const cfg = config.get(guildId);
  if (!cfg.levels.enabled) return null;

  const user = getUser(guildId, userId);
  const before = levelForXp(user.xp);
  user.xp += Math.max(0, Math.floor(amount));
  if (kind === "message") user.messages += 1;
  if (kind === "command") user.commands += 1;
  user.lastAwardAt = Date.now();
  storage.save();

  const after = levelForXp(user.xp);
  return {
    ...user,
    level: after,
    previousLevel: before,
    leveledUp: after > before,
    progress: progressFor(user.xp),
  };
}

function recordMessage(msg) {
  if (!msg.guild || msg.author.bot) return null;
  const cfg = config.get(msg.guild.id);
  if (!cfg.levels.enabled) return null;

  const key = `${msg.guild.id}:${msg.author.id}`;
  const now = Date.now();
  const cooldown = Math.max(5, cfg.levels.xpCooldownSeconds) * 1000;
  if (now - (recentAwards.get(key) || 0) < cooldown) return null;
  recentAwards.set(key, now);

  const amount = cfg.levels.xpPerMessage + Math.floor(Math.random() * (cfg.levels.xpBonusMax + 1));
  const result = award(msg.guild.id, msg.author.id, amount, "message");
  if (result?.leveledUp) {
    const channel = cfg.levels.levelUpChannelId
      ? msg.guild.channels.cache.get(cfg.levels.levelUpChannelId)
      : msg.channel;
    if (channel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor("#8b5cf6")
        .setTitle("Level up detected")
        .setDescription(`**${msg.member?.displayName || msg.author.username}** reached **Level ${result.level}**.`)
        .addFields({ name: "XP", value: `${result.xp.toLocaleString()}`, inline: true })
        .setFooter({ text: "Keep hanging out. The numbers are watching." })
        .setTimestamp();
      channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
  return result;
}

function recordCommand(msg) {
  if (!msg.guild || msg.author.bot) return null;
  return award(msg.guild.id, msg.author.id, config.get(msg.guild.id).levels.xpPerCommand, "command");
}

function profile(guildId, userId) {
  const user = getUser(guildId, userId);
  return { ...user, level: levelForXp(user.xp), progress: progressFor(user.xp) };
}

function leaderboard(guildId, limit = 10) {
  const guild = guildState(guildId);
  return Object.entries(guild)
    .map(([userId, user]) => ({ userId, ...user, level: levelForXp(user.xp) }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

function formatProfile(msg, userId = msg.author.id) {
  const p = profile(msg.guild.id, userId);
  const name = displayName(msg, userId);
  const filled = Math.min(20, Math.floor((p.progress.current / p.progress.needed) * 20));
  const bar = "▰".repeat(filled) + "▱".repeat(20 - filled);
  return [
    `**${name}**`,
    `Level **${p.level}** · **${p.xp.toLocaleString()} XP**`,
    `${bar} ${p.progress.current}/${p.progress.needed} to Level ${p.level + 1}`,
    `Messages: **${p.messages.toLocaleString()}** · Commands: **${p.commands.toLocaleString()}**`,
  ].join("\n");
}

module.exports = {
  award,
  recordMessage,
  recordCommand,
  profile,
  leaderboard,
  formatProfile,
  levelForXp,
  xpForLevel,
};