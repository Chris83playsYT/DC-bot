const DEFAULT_PREFIX = "!";

const guildPrefixes = new Map();

module.exports = {
  get(guildId) {
    return guildPrefixes.get(guildId) ?? DEFAULT_PREFIX;
  },

  set(guildId, prefix) {
    guildPrefixes.set(guildId, prefix);
  },

  DEFAULT_PREFIX,
};
