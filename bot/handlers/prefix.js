const config = require("./config");

module.exports = {
  get(guildId) {
    return config.getPrefix(guildId);
  },

  getAll(guildId) {
    return config.getPrefixes(guildId);
  },

  set(guildId, prefix) {
    config.setPrefix(guildId, prefix);
  },

  DEFAULT_PREFIX: ",wg",
  ALIASES: ["!wg", ",wg"],
};
