const VALID_MODES = ["intellectual", "normal", "crazy", "relaxed", "depressed", "flow"];

const DEFAULT = () => ({
  prefix: "!",
  automod: {
    enabled: true,
    blockInvites: true,
    filterBadWords: true,
    antiSpam: true,
    newAccountProtection: true,
    newAccountDays: 7,
    spamLimit: 5,
    spamWindowMs: 4000,
  },
  badWords: ["badword1", "badword2"],
  warnThresholds: [
    { at: 3, action: "mute", durationMs: 600_000, label: "auto-muted for 10 minutes", emoji: "🔇" },
    { at: 5, action: "kick",  label: "auto-kicked from the server", emoji: "👢" },
    { at: 7, action: "ban",   label: "auto-banned from the server", emoji: "🔨" },
  ],
  aiChat: true,
  aiMode: "normal",
});

const configs = new Map();

let botOwnerId = null;

module.exports = {
  VALID_MODES,

  setOwner(id) {
    botOwnerId = id;
  },

  isOwner(userId) {
    return botOwnerId && userId === botOwnerId;
  },

  getOwnerId() {
    return botOwnerId;
  },

  get(guildId) {
    if (!configs.has(guildId)) configs.set(guildId, DEFAULT());
    return configs.get(guildId);
  },

  getPrefix(guildId) {
    return this.get(guildId).prefix;
  },

  setPrefix(guildId, p) {
    this.get(guildId).prefix = p;
  },

  setAiMode(guildId, mode) {
    if (!VALID_MODES.includes(mode)) return false;
    this.get(guildId).aiMode = mode;
    return true;
  },

  getAllGuilds() {
    return [...configs.entries()];
  },

  format(guildId) {
    const c = this.get(guildId);
    const am = c.automod;
    return [
      `**⚙️ Bot Configuration**`,
      `**Prefix:** \`${c.prefix}\``,
      `**AI Chat (on mention):** ${c.aiChat ? "✅ on" : "❌ off"}`,
      `**AI Mode:** \`${c.aiMode}\` — use \`!aimode [mode]\` to change`,
      ``,
      `**🛡️ Auto-Mod**`,
      `Anti-spam: ${am.antiSpam ? "✅" : "❌"} (${am.spamLimit} msgs / ${am.spamWindowMs}ms)`,
      `Invite blocking: ${am.blockInvites ? "✅" : "❌"}`,
      `Bad word filter: ${am.filterBadWords ? "✅" : "❌"}`,
      `New account protection: ${am.newAccountProtection ? "✅" : "❌"} (${am.newAccountDays} days)`,
      `Bad words list: ${c.badWords.length ? c.badWords.map(w => `\`${w}\``).join(", ") : "*(empty)*"}`,
      ``,
      `**⚠️ Warning Thresholds**`,
      ...c.warnThresholds.map(t => `${t.emoji} ${t.at} warns → ${t.label}`),
    ].join("\n");
  },
};
