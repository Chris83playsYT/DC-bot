const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", msg => {
  if (msg.content === "!weirdguy") {
    const replies = [
      "👀 hey… what are you doing here",
      "nah bro I'm sleeping rn 😴",
      "why you looking at me like that 😭"
    ];
    msg.reply(replies[Math.floor(Math.random() * replies.length)]);
  }
});

client.login(process.env.TOKEN);
