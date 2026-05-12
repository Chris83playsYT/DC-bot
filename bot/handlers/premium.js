// Premium users get exclusive commands. Granted globally by the bot owner.
const premiumUsers = new Set();

module.exports = {
  grant(userId) {
    premiumUsers.add(userId);
  },

  revoke(userId) {
    premiumUsers.delete(userId);
  },

  has(userId) {
    return premiumUsers.has(userId);
  },

  list() {
    return [...premiumUsers];
  },

  count() {
    return premiumUsers.size;
  },
};
