const { Client, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

const fun = require("./commands/fun");
const admin = require("./commands/admin");
const automod = require("./handlers/automod");
const ai = require("./handlers/ai");
const prefix = require("./handlers/prefix");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.on("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("the server 👀", { type: 3 });
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

    const guildPrefix = prefix.get(msg.guild.id);
    const content = msg.content.trim();

    if (!content.startsWith(guildPrefix)) return;

    const parts = content.slice(guildPrefix.length).trim().split(/\s+/);
    const baseCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    const handled = fun.handle(msg, baseCommand, args, guildPrefix);
    if (handled) return;

    await admin.handle(msg, guildPrefix + baseCommand, args, prefix);
  } catch (err) {
    console.error("messageCreate error:", err?.message);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err?.message ?? err);
});

client.on("guildMemberAdd", (member) => {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(
      `👀 **${member.displayName}** just joined. welcome I guess. don't make it weird.`
    );
  }
});

client.login(process.env.TOKEN);
