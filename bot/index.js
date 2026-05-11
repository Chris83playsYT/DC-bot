const { Client, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

const fun = require("./commands/fun");
const admin = require("./commands/admin");
const automod = require("./handlers/automod");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const PERSONALITY_REPLIES = [
  "yeah? what do you want from me 😭",
  "ok ok I'm listening… maybe.",
  "bro just said my name like I owe them something 💀",
  "👁️ I heard that.",
  "you called? I was busy doing nothing important.",
  "don't @ me unless it's serious 😤",
  "…yes? speak.",
  "oh so NOW you want to talk to me 😒",
];

client.on("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("the server 👀", { type: 3 });
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) return;

  const blocked = await automod.check(msg);
  if (blocked) return;

  const content = msg.content.trim();
  const parts = content.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (content.includes(`<@${client.user.id}>`)) {
    const reply = PERSONALITY_REPLIES[Math.floor(Math.random() * PERSONALITY_REPLIES.length)];
    msg.reply(reply);
    return;
  }

  const handled = fun.handle(msg, command, args);
  if (handled) return;

  await admin.handle(msg, command, args);
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
