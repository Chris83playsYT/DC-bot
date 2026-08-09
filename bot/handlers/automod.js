const config = require("./config");
const security = require("./security");

const spamTracker = new Map();
const INVITE_PATTERN = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;

function isAdmin(member) {
  return security.isGuildAdmin(member);
}

async function checkSpam(msg, cfg) {
  const am = cfg.automod;
  if (!am.antiSpam) return false;

  const key = `${msg.guild.id}:${msg.author.id}`;
  const now = Date.now();
  const timestamps = (spamTracker.get(key) || []).filter(t => now - t < am.spamWindowMs);
  timestamps.push(now);
  spamTracker.set(key, timestamps);

  if (timestamps.length >= am.spamLimit) {
    await msg.delete().catch(() => {});
    const warning = await msg.channel.send(`⚠️ <@${msg.author.id}> slow down! You're sending messages too fast.`);
    await msg.member.timeout(60_000, "Auto-mod: spam detected").catch(() => {});
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    spamTracker.set(key, []);
    return true;
  }
  return false;
}

async function checkInvites(msg, cfg) {
  if (!cfg.automod.blockInvites) return false;
  if (!INVITE_PATTERN.test(msg.content)) return false;
  await msg.delete().catch(() => {});
  const warning = await msg.channel.send(`🚫 <@${msg.author.id}> Posting invite links is not allowed here.`);
  setTimeout(() => warning.delete().catch(() => {}), 5000);
  return true;
}

async function checkBadWords(msg, cfg) {
  if (!cfg.automod.filterBadWords) return false;
  const lower = msg.content.toLowerCase();
  const found = cfg.badWords.some(w => lower.includes(w));
  if (!found) return false;
  await msg.delete().catch(() => {});
  const warning = await msg.channel.send(`🚫 <@${msg.author.id}> Watch your language.`);
  setTimeout(() => warning.delete().catch(() => {}), 5000);
  return true;
}

async function checkNewAccount(msg, cfg) {
  if (!cfg.automod.newAccountProtection) return false;
  const days = (Date.now() - msg.author.createdTimestamp) / (1000 * 60 * 60 * 24);
  if (days < cfg.automod.newAccountDays && INVITE_PATTERN.test(msg.content)) {
    await msg.delete().catch(() => {});
    const warning = await msg.channel.send(`⚠️ <@${msg.author.id}> New accounts cannot post invite links.`);
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    return true;
  }
  return false;
}

async function checkMentionSpam(msg, cfg) {
  if (!cfg.automod.maxMentions || msg.mentions.users.size + msg.mentions.roles.size < cfg.automod.maxMentions) {
    return false;
  }
  await msg.delete().catch(() => {});
  const warning = await msg.channel.send(`🚫 <@${msg.author.id}> Too many mentions in one message.`);
  setTimeout(() => warning.delete().catch(() => {}), 5000);
  await msg.member.timeout(60_000, "Auto-mod: mention spam").catch(() => {});
  return true;
}

module.exports = {
  async check(msg) {
    if (!msg.guild) return false;
    if (isAdmin(msg.member)) return false;
    if (msg.author.bot) return false;

    const cfg = config.get(msg.guild.id);
    if (!cfg.automod.enabled) return false;

    // Do not punish commands from administrators, but still allow them to be
    // logged and rate-limited by Discord itself.
    if (isAdmin(msg.member)) return false;

    if (await checkNewAccount(msg, cfg)) return true;
    if (await checkMentionSpam(msg, cfg)) return true;
    if (await checkInvites(msg, cfg)) return true;
    if (await checkBadWords(msg, cfg)) return true;
    if (await checkSpam(msg, cfg)) return true;

    return false;
  },
};
