const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
require("dotenv").config();

const fun = require("./commands/fun");
const admin = require("./commands/admin");
const owner = require("./commands/owner");
const configure = require("./commands/configure");
const automod = require("./handlers/automod");
const ai = require("./handlers/ai");
const config = require("./handlers/config");
const events = require("./handlers/events");
const keepalive = require("./handlers/keepalive");
const levels = require("./handlers/levels");
const storage = require("./handlers/storage");

// Start keep-alive HTTP server (ping /ping with UptimeRobot)
keepalive.start();

const ACTIVITIES = [
  { name: "the server 👀",              type: ActivityType.Watching },
  { name: "everyone's messages 📖",      type: ActivityType.Watching },
  { name: "your business 🤫",            type: ActivityType.Watching },
  { name: "with your feelings 🎮",       type: ActivityType.Playing },
  { name: "chess with myself ♟️",        type: ActivityType.Playing },
  { name: "absolutely nothing 😴",       type: ActivityType.Playing },
  { name: "judge judy 📺",               type: ActivityType.Watching },
  { name: "the economy crash 📈",        type: ActivityType.Watching },
  { name: "your secrets 🤐",             type: ActivityType.Watching },
  { name: "minecraft alone 🎮",          type: ActivityType.Playing },
  { name: "lo-fi beats 🎵",              type: ActivityType.Listening },
  { name: ",wghelp for commands",        type: ActivityType.Listening },
  { name: "drama unfold 🍿",             type: ActivityType.Watching },
  { name: "the vibes shift ✨",           type: ActivityType.Watching },
  { name: "being weird competitively",   type: ActivityType.Competing },
  { name: "nothing. I'm just vibing",    type: ActivityType.Playing },
  { name: "the void stare back 🌑",      type: ActivityType.Watching },
  { name: "your typing indicator 👀",    type: ActivityType.Watching },
  { name: "the simulation 💻",           type: ActivityType.Playing },
  { name: "the group chat judgment",     type: ActivityType.Competing },
];

let activityIndex = Math.floor(Math.random() * ACTIVITIES.length);

function rotateActivity(client) {
  if (!client.user) return;
  const activity = ACTIVITIES[activityIndex % ACTIVITIES.length];
  client.user.setActivity(activity.name, { type: activity.type });
  activityIndex++;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

client.on("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  rotateActivity(client);
  // Rotate status every 3 minutes
  setInterval(() => rotateActivity(client), 3 * 60 * 1000);

  try {
    await client.application.fetch();
    const ownerObj = client.application.owner;
    const ownerId = ownerObj?.id ?? ownerObj?.ownerId;
    if (ownerId) {
      config.setOwner(ownerId);
      console.log(`Bot owner set: ${ownerId}`);
    }
  } catch (err) {
    console.error("Could not fetch bot owner:", err?.message);
  }
});

// Route a parsed command string through all handlers.
async function routeCommand(msg, commandText, guildPrefix) {
  const parts = commandText.split(/\s+/);
  const baseCommand = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (baseCommand === "config") {
    await configure.handle(msg, args);
    levels.recordCommand(msg);
    return true;
  }

  if (baseCommand === "owner") {
    await owner.handle(msg, args);
    return true;
  }

  const handled = await fun.handle(msg, baseCommand, args, guildPrefix);
  if (handled) {
    levels.recordCommand(msg);
    return true;
  }

  const adminHandled = await admin.handle(msg, guildPrefix + baseCommand, args, config);
  if (adminHandled) levels.recordCommand(msg);
  return adminHandled;
}

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    const blocked = await automod.check(msg);
    if (blocked) return;

    levels.recordMessage(msg);
    const guildPrefix = config.getPrefix(msg.guild.id);
    const isMentioned = msg.mentions.has(client.user);

    if (isMentioned) {
      const botMentionRegex = new RegExp(`<@!?${client.user.id}>`, "g");
      const stripped = msg.content.replace(botMentionRegex, "").trim();

      if (stripped) {
        const commandText = stripped.startsWith(guildPrefix)
          ? stripped.slice(guildPrefix.length).trim()
          : stripped;

        if (commandText) {
          const claimed = await routeCommand(msg, commandText, guildPrefix);
          if (claimed) return;
        }
      }

      await ai.reply(msg);
      return;
    }

    const content = msg.content.trim();
    if (content.startsWith(guildPrefix)) {
      const commandText = content.slice(guildPrefix.length).trim();
      if (commandText) {
        await routeCommand(msg, commandText, guildPrefix);
        return;
      }
    }

    if (fun.checkTrivia(msg)) return;
    await events.onMessage(msg);
  } catch (err) {
    console.error("messageCreate error:", err?.message);
  }
});

client.on("guildMemberAdd", async (member) => {
  const cfg = config.get(member.guild.id);
  if (cfg.raidMode) {
    const ageDays = (Date.now() - member.user.createdTimestamp) / 86400000;
    if (ageDays < cfg.raidAccountAgeDays) {
      await member.kick(`Raid mode: account ${Math.floor(ageDays)} day(s) old`).catch(() => {});
      const ch = member.guild.systemChannel;
      if (ch) ch.send(`🚨 Raid mode: kicked **${member.user.tag}** — account only ${Math.floor(ageDays)} day(s) old.`).catch(() => {});
      return;
    }
  }

  const channel = member.guild.systemChannel;
  if (!channel) return;
  const greets = [
    `👀 **${member.displayName}** just joined. welcome I guess. don't make it weird.`,
    `🚪 **${member.displayName}** has arrived. the vibe has officially changed.`,
    `👋 oh hey **${member.displayName}**. we were just talking about you. (we weren't)`,
    `📬 **${member.displayName}** joined. say hi or don't. whatever.`,
    `✨ **${member.displayName}** pulled up. let's see what they're about.`,
    `🎉 **${member.displayName}** is here. finally. we've been waiting. (we haven't)`,
  ];
  channel.send(greets[Math.floor(Math.random() * greets.length)]).catch(() => {});
});

client.on("guildMemberRemove", async (member) => {
  await events.onMemberLeave(member);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    await events.onMemberBoost(newMember);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err?.message ?? err);
});

process.on("SIGTERM", () => {
  storage.flush();
  client.destroy();
});

process.on("SIGINT", () => {
  storage.flush();
  client.destroy();
});

client.login(process.env.TOKEN).catch((err) => {
  console.error("Discord login failed:", err?.message || err);
  process.exit(1);
});
