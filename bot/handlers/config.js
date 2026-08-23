const storage = require("./storage");
const VALID_MODES = [
  "normal", "intellectual", "crazy", "relaxed", "depressed", "flow",
  "cringe", "hype", "chaotic-good", "therapist", "villain", "grandparent",
  "gremlin", "pirate", "detective", "comedian", "npc", "oracle", "coach", "deadpan",
];

const DEFAULT = () => ({
  prefix: ",wg",
  automod: {
    enabled: true,
    blockInvites: true,
    filterBadWords: true,
    antiSpam: true,
    newAccountProtection: true,
    newAccountDays: 7,
    spamLimit: 5,
    spamWindowMs: 4000,
    maxMentions: 5,
  },
  badWords: ["badword1", "badword2"],
  warnThresholds: [
    { at: 3, action: "mute", durationMs: 600_000, label: "auto-muted for 10 minutes", emoji: "🔇" },
    { at: 5, action: "kick",  label: "auto-kicked from the server", emoji: "👢" },
    { at: 7, action: "ban",   label: "auto-banned from the server", emoji: "🔨" },
  ],
  aiChat: true,
  aiMode: "normal",
  aiModel: "google/gemini-2.5-flash",
  aiTemperature: 0.85,
  aiMaxHistory: 12,
  aiCooldownMs: 2500,
  responseLength: "normal",
  adminRoleIds: [],
  logChannelId: null,
  raidMode: false,
  raidAccountAgeDays: 7,
  levels: {
    enabled: true,
    xpPerMessage: 8,
    xpBonusMax: 12,
    xpPerCommand: 5,
    xpCooldownSeconds: 45,
    levelUpChannelId: null,
  },
});

let botOwnerId = storage.state.ownerProfile?.id || null;
const BOT_OWNER_NAME = "chrisv_yes";

function mergeConfig(saved) {
  const base = DEFAULT();
  const result = { ...base, ...(saved || {}) };
  result.automod = { ...base.automod, ...(saved?.automod || {}) };
  result.levels = { ...base.levels, ...(saved?.levels || {}) };
  result.badWords = Array.isArray(saved?.badWords) ? saved.badWords : base.badWords;
  result.warnThresholds = Array.isArray(saved?.warnThresholds) ? saved.warnThresholds : base.warnThresholds;
  result.adminRoleIds = Array.isArray(saved?.adminRoleIds) ? saved.adminRoleIds : [];
  result.responseLength = ["short", "normal", "paragraph"].includes(result.responseLength)
    ? result.responseLength
    : "normal";
  return result;
}

module.exports = {
  VALID_MODES,
  RESPONSE_LENGTHS: ["short", "normal", "paragraph"],

  setOwner(id, profile = {}) {
    if (!id) return;
    botOwnerId = id;
    const previous = storage.state.ownerProfile || {};
    storage.state.ownerProfile = {
      ...previous,
      id,
      username: profile.username || previous.username || null,
      tag: profile.tag || previous.tag || null,
      displayName: profile.displayName || previous.displayName || BOT_OWNER_NAME,
      savedAt: previous.savedAt || new Date().toISOString(),
    };
    storage.save();
  },
  isOwner(userId) { return Boolean(botOwnerId && userId === botOwnerId); },
  getOwnerId() { return botOwnerId; },
  getOwnerProfile() { return storage.state.ownerProfile; },
  getOwnerName() { return BOT_OWNER_NAME; },

  get(guildId) {
    const configs = storage.state.configs;
    if (!configs[guildId]) {
      configs[guildId] = DEFAULT();
      storage.save();
    } else {
      configs[guildId] = mergeConfig(configs[guildId]);
    }
    return configs[guildId];
  },

  getPrefix(guildId) { return this.get(guildId).prefix; },
  getPrefixes(guildId) {
    return [...new Set([this.get(guildId).prefix, "!wg", ",wg"])];
  },
  setPrefix(guildId, p) {
    this.get(guildId).prefix = p;
    storage.save();
  },

  setAiMode(guildId, mode) {
    if (!VALID_MODES.includes(mode)) return false;
    this.get(guildId).aiMode = mode;
    storage.save();
    return true;
  },

  setResponseLength(guildId, length) {
    if (!this.RESPONSE_LENGTHS.includes(length)) return false;
    this.get(guildId).responseLength = length;
    storage.save();
    return true;
  },

  setLogChannel(guildId, channelId) {
    this.get(guildId).logChannelId = channelId;
    storage.save();
  },

  setRaidMode(guildId, enabled, ageDays) {
    const cfg = this.get(guildId);
    cfg.raidMode = enabled;
    if (ageDays !== undefined) cfg.raidAccountAgeDays = ageDays;
    storage.save();
  },

  addAdminRole(guildId, roleId) {
    const cfg = this.get(guildId);
    if (!cfg.adminRoleIds.includes(roleId)) cfg.adminRoleIds.push(roleId);
    storage.save();
  },

  removeAdminRole(guildId, roleId) {
    const cfg = this.get(guildId);
    cfg.adminRoleIds = cfg.adminRoleIds.filter(id => id !== roleId);
    storage.save();
  },

  getAllGuilds() { return Object.entries(storage.state.configs); },

  format(guildId) {
    const c = this.get(guildId);
    const am = c.automod;
    return [
      `**⚙️ Bot Configuration**`,
      `**Prefix:** \`${c.prefix}\``,
      `**AI Chat:** ${c.aiChat ? "✅ on" : "❌ off"} | **AI Mode:** \`${c.aiMode}\``,
      `**AI Model:** \`${c.aiModel}\``,
      `**AI Response Length:** \`${c.responseLength}\``,
      `**Admin Roles:** ${c.adminRoleIds.length ? c.adminRoleIds.map(id => `<@&${id}>`).join(", ") : "Discord Administrator roles"}`,
      `**Levels:** ${c.levels.enabled ? `✅ on (${c.levels.xpPerMessage}–${c.levels.xpPerMessage + c.levels.xpBonusMax} XP/message)` : "❌ off"}`,
      `**Log Channel:** ${c.logChannelId ? `<#${c.logChannelId}>` : "not set"}`,
      `**Raid Mode:** ${c.raidMode ? `🚨 ON (kicks accounts < ${c.raidAccountAgeDays}d)` : "✅ off"}`,
      ``,
      `**🛡️ Auto-Mod**`,
      `Anti-spam: ${am.antiSpam ? "✅" : "❌"} (${am.spamLimit} msgs / ${am.spamWindowMs}ms)`,
      `Invite blocking: ${am.blockInvites ? "✅" : "❌"}`,
      `Bad word filter: ${am.filterBadWords ? "✅" : "❌"}`,
      `New account protection: ${am.newAccountProtection ? "✅" : "❌"} (${am.newAccountDays} days)`,
      `Mention protection: ${am.maxMentions} mentions/message`,
      `Bad words: ${c.badWords.length ? c.badWords.map(w => `\`${w}\``).join(", ") : "*(empty)*"}`,
      ``,
      `**⚠️ Warning Thresholds**`,
      ...c.warnThresholds.map(t => `${t.emoji} ${t.at} warns → ${t.label}`),
    ].join("\n");
  },
};
