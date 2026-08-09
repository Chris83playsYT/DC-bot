const config = require("./config");

module.exports = {
  get(guildId) {
    return config.getPrefix(guildId);
  },

  set(guildId, prefix) {
    config.setPrefix(guildId, prefix);
  },

  DEFAULT_PREFIX: ",wg",
};
