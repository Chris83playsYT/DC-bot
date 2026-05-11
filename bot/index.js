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

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    const blocked = await automod.check(msg);
    if (blocked) return;

    if (msg.content.includes(`<@${client.user.id}>`)) {
      await ai.reply(msg);
      return;
    }

    const guildPrefix = config.getPrefix(msg.guild.id);
    const content = msg.content.trim();

    if (!content.startsWith(guildPrefix)) return;

    const parts = content.slice(guildPrefix.length).trim().split(/\s+/);
    const baseCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (baseCommand === "config") {
      await configure.handle(msg, args);
      return;
    }

    const handled = await fun.handle(msg, baseCommand, args, guildPrefix);
    if (handled) return;

    await admin.handle(msg, guildPrefix + baseCommand, args, config);
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
