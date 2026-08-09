const { PermissionsBitField } = require("discord.js");
const config = require("./config");

function hasAdministratorRole(member) {
  if (!member?.roles?.cache) return false;
  return member.roles.cache.some(role =>
    role.permissions?.has(PermissionsBitField.Flags.Administrator)
  );
}

function isGuildAdmin(member) {
  if (!member) return false;
  if (config.isOwner(member.id)) return true;
  if (hasAdministratorRole(member)) return true;

  const cfg = config.get(member.guild?.id);
  return Boolean(cfg?.adminRoleIds?.some(roleId => {
    const role = member.roles.cache.get(roleId);
    return role?.permissions?.has(PermissionsBitField.Flags.Administrator);
  }));
}

function isProtectedTarget(msg, target) {
  if (!target) return false;
  if (target.id === msg.author.id) return true;
  if (target.id === msg.client.user?.id) return true;
  if (config.isOwner(target.id)) return true;
  return Boolean(target.permissions?.has(PermissionsBitField.Flags.Administrator));
}

module.exports = {
  hasAdministratorRole,
  isGuildAdmin,
  isProtectedTarget,
};