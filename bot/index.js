const { Client, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

const fun = require("./commands/fun");
const admin = require("./commands/admin");
const configure = require("./commands/configure");
const automod = require("./handlers/automod");
const ai = require("./handlers/ai");
const config = require("./handlers/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.on("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("the server 👀", { type: 3 });

  try {
    await client.application.fetch();
    const owner = client.application.owner;
    const ownerId = owner?.id ?? owner?.ownerId;
    if (ownerId) {
      config.setOwner(ownerId);
      console.log(`Bot owner set: ${ownerId}`);
    }
  } catch (err) {
    console.error("Could not fetch bot owner:", err?.message);
  }
});

// Route a parsed command string through all command handlers.
// Returns true if a handler claimed it, false otherwise.
async function routeCommand(msg, commandText, guildPrefix) {
  const parts = commandText.split(/\s+/);
  const baseCommand = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (baseCommand === "config") {
    await configure.handle(msg, args);
    return true;
  }

  const handled = await fun.handle(msg, baseCommand, args, guildPrefix);
  if (handled) return true;

  return admin.handle(msg, guildPrefix + baseCommand, args, config);
}

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    const blocked = await automod.check(msg);
    if (blocked) return;

    const guildPrefix = config.getPrefix(msg.guild.id);
    const isMentioned = msg.mentions.has(client.user);

    if (isMentioned) {
      // Strip only the bot's own mention(s), leave other @mentions intact
      const botMentionRegex = new RegExp(`<@!?${client.user.id}>`, "g");
      const stripped = msg.content.replace(botMentionRegex, "").trim();

      if (stripped) {
        // Accept both "@Bot kick @user" and "@Bot !kick @user"
        const commandText = stripped.startsWith(guildPrefix)
          ? stripped.slice(guildPrefix.length).trim()
          : stripped;

        if (commandText) {
          const claimed = await routeCommand(msg, commandText, guildPrefix);
          if (claimed) return;
        }
      }

      // No command matched — fall through to AI chat
      await ai.reply(msg);
      return;
    }

    // Normal prefix-based routing (no mention)
    const content = msg.content.trim();
    if (!content.startsWith(guildPrefix)) return;

    const commandText = content.slice(guildPrefix.length).trim();
    if (!commandText) return;

    await routeCommand(msg, commandText, guildPrefix);
  } catch (err) {
    console.error("messageCreate error:", err?.message);
  }
});

client.on("guildMemberAdd", (member) => {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(`👀 **${member.displayName}** just joined. welcome I guess. don't make it weird.`);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err?.message ?? err);
});

client.login(process.env.TOKEN);
