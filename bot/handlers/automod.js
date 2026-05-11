const spamTracker = new Map();

const BAD_WORDS = ["slur1", "slur2", "badword1"];

const INVITE_PATTERN = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;

const SPAM_LIMIT = 5;
const SPAM_WINDOW_MS = 4000;
const NEW_ACCOUNT_DAYS = 7;

function isAdmin(member) {
  return member.permissions.has("Administrator");
}

async function checkSpam(msg) {
  const key = `${msg.guild.id}:${msg.author.id}`;
  const now = Date.now();
  const timestamps = (spamTracker.get(key) || []).filter(t => now - t < SPAM_WINDOW_MS);
  timestamps.push(now);
  spamTracker.set(key, timestamps);

  if (timestamps.length >= SPAM_LIMIT) {
    await msg.delete().catch(() => {});
    const warning = await msg.channel.send(`⚠️ <@${msg.author.id}> slow down! You're sending messages too fast.`);
    await msg.member.timeout(60_000, "Auto-mod: spam detected").catch(() => {});
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    spamTracker.set(key, []);
    return true;
  }
  return false;
}

async function checkInvites(msg) {
  if (!INVITE_PATTERN.test(msg.content)) return false;
  await msg.delete().catch(() => {});
  const warning = await msg.channel.send(`🚫 <@${msg.author.id}> Posting invite links is not allowed here.`);
  setTimeout(() => warning.delete().catch(() => {}), 5000);
  return true;
}

async function checkBadWords(msg) {
  const lower = msg.content.toLowerCase();
  const found = BAD_WORDS.some(w => lower.includes(w));
  if (!found) return false;
  await msg.delete().catch(() => {});
  const warning = await msg.channel.send(`🚫 <@${msg.author.id}> Watch your language.`);
  setTimeout(() => warning.delete().catch(() => {}), 5000);
  return true;
}

async function checkNewAccount(msg) {
  const accountAge = Date.now() - msg.author.createdTimestamp;
  const days = accountAge / (1000 * 60 * 60 * 24);
  if (days < NEW_ACCOUNT_DAYS && INVITE_PATTERN.test(msg.content)) {
    await msg.delete().catch(() => {});
    const warning = await msg.channel.send(
      `⚠️ <@${msg.author.id}> New accounts cannot post invite links.`
    );
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    return true;
  }
  return false;
}

module.exports = {
  async check(msg) {
    if (!msg.guild) return false;
    if (isAdmin(msg.member)) return false;
    if (msg.author.bot) return false;

    if (await checkNewAccount(msg)) return true;
    if (await checkInvites(msg)) return true;
    if (await checkBadWords(msg)) return true;
    if (await checkSpam(msg)) return true;

    return false;
  },

  BAD_WORDS,
};
