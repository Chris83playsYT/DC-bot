const { EmbedBuilder } = require("discord.js");
const config = require("./config");

const COLORS = {
  kick:       "#ff9900",
  ban:        "#ff0000",
  softban:    "#ff6600",
  unban:      "#00cc44",
  mute:       "#ffcc00",
  unmute:     "#00cc44",
  warn:       "#ffaa00",
  clear:      "#0099ff",
  purge:      "#0099ff",
  nuke:       "#ff0000",
  lock:       "#cc00ff",
  unlock:     "#00aaff",
  lockall:    "#cc00ff",
  unlockall:  "#00aaff",
  dehoist:    "#888888",
  role_add:   "#00cc44",
  role_remove:"#ff6600",
  modnote:    "#aaaaaa",
  raidmode:   "#ff0000",
  slowmode:   "#5865f2",
};

const ICONS = {
  kick: "👢", ban: "🔨", softban: "🔨", unban: "✅",
  mute: "🔇", unmute: "🔊", warn: "⚠️", clear: "🧹",
  purge: "🧹", nuke: "💥", lock: "🔒", unlock: "🔓",
  lockall: "🔒", unlockall: "🔓", dehoist: "🔡",
  role_add: "🏷️", role_remove: "🏷️", modnote: "📝",
  raidmode: "🚨", slowmode: "⏱️",
};

module.exports = {
  async logAction(guild, { type, moderator, target, reason, extra } = {}) {
    try {
      const cfg = config.get(guild.id);
      if (!cfg.logChannelId) return;
      const channel = guild.channels.cache.get(cfg.logChannelId);
      if (!channel) return;

      const icon = ICONS[type] || "📋";
      const label = type.toUpperCase().replace(/_/g, " ");

      const embed = new EmbedBuilder()
        .setColor(COLORS[type] || "#888888")
        .setTitle(`${icon} ${label}`)
        .setTimestamp();

      if (moderator) {
        embed.addFields({ name: "Moderator", value: `<@${moderator.id}> \`${moderator.tag}\``, inline: true });
      }
      if (target) {
        const targetId = target.id || target;
        const targetTag = target.tag ? ` \`${target.tag}\`` : "";
        embed.addFields({ name: "Target", value: `<@${targetId}>${targetTag}`, inline: true });
      }
      if (reason) embed.addFields({ name: "Reason", value: reason });
      if (extra)  embed.addFields({ name: "Details", value: extra });

      await channel.send({ embeds: [embed] });
    } catch {}
  },
};
