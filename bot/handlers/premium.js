// Premium users get exclusive commands. Granted globally by the bot owner.
const storage = require("./storage");

module.exports = {
  grant(userId) {
    if (!storage.state.premiumUsers.includes(userId)) {
      storage.state.premiumUsers.push(userId);
      storage.save();
    }
  },

  revoke(userId) {
    storage.state.premiumUsers = storage.state.premiumUsers.filter(id => id !== userId);
    storage.save();
  },

  has(userId) {
    return storage.state.premiumUsers.includes(userId);
  },

  list() {
    return [...storage.state.premiumUsers];
  },

  count() {
    return storage.state.premiumUsers.length;
  },
};
