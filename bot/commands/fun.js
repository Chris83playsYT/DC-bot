const { EmbedBuilder } = require("discord.js");
const poll = require("./poll");

const eightBallReplies = [
  "It is certain.", "It is decidedly so.", "Without a doubt.",
  "Yes, definitely.", "You may rely on it.", "As I see it, yes.",
  "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
  "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
  "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

const jokes = [
  "I told my dog he was adopted. He said 'I know, you throw like an idiot.'",
  "My therapist says I have trouble accepting things I can't change. We'll see about that.",
  "Why did the scarecrow win an award? Because he was outstanding in his field. His coworkers hated him.",
  "I'm reading a book about anti-gravity. Genuinely cannot put it down. Send help.",
  "My wife said I needed to grow up. I told her to get out of my blanket fort.",
  "Why don't scientists trust atoms? They make up literally everything. Can't trust anyone.",
  "I asked the librarian if they had books about paranoia. She whispered 'they're right behind you.' I haven't been back.",
  "What do you call a fake noodle? An impasta. I've been holding that in for years.",
  "I used to hate facial hair but then it grew on me. That's the whole joke.",
  "My doctor told me I was going deaf. That was unexpected news.",
];

const roasts = [
  "If brains were dynamite you wouldn't have enough to blow your hat off.",
  "You're the reason the gene pool needs a lifeguard. And warning signs.",
  "I'd roast you harder but my mom said I'm not allowed to burn trash.",
  "You're not stupid. You just have a severe allergy to good ideas.",
  "I've seen better looking faces on a clock. A broken one.",
  "You're like a cloud — when you disappear it's a beautiful day. We've been waiting.",
  "Some day you'll go far. And I hope you stay there.",
  "You're proof that evolution can go in reverse. Congrats on the milestone.",
  "I'm not saying you're dumb but you'd need a map to find your way out of a good idea.",
  "You have the energy of a wet napkin at a very important meeting.",
];

const compliments = [
  "You light up every room you walk into. Genuinely. Don't ruin it by talking about it.",
  "Honestly? You're kind of awesome. Don't let it go to your head. Too late probably.",
  "You have a genuinely great energy about you. Which is rare. Protect it.",
  "The world is better with you in it. I don't say that lightly. Or ever. But here we are.",
  "You make people around you better just by existing. That's actually insane. Good insane.",
  "Your vibe is unmatched and I'm saying that as someone who doesn't give compliments.",
  "You're the human equivalent of finding $20 in a jacket you forgot about.",
  "People probably don't tell you enough how genuinely solid you are. I'm fixing that now.",
];

const weirdguyReplies = [
  "👀 oh you said my name. what do you want. I was busy",
  "nah I'm not doing this right now 😴 ...ok fine what",
  "you rang? I was literally in the middle of nothing and you interrupted it",
  "bro I JUST got here. give me a second. what.",
  "…did you just say my name. why did you say my name.",
  "I'm watching you. not in a creepy way. ok maybe a little. what do you need.",
  "what do you WANT from me 😭 I'm so tired",
  "ok fine I answered. happy? don't answer that.",
  "I heard my name and chose to show up reluctantly. here I am.",
  "you called? I almost didn't come. what's going on.",
];

const rpsChoices = ["rock", "paper", "scissors"];
const rpsWins = { rock: "scissors", paper: "rock", scissors: "paper" };

function timeAgo(date) {
  const ms = Date.now() - date.getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

module.exports = {
  async handle(msg, baseCommand, args, p = "!") {
    switch (baseCommand) {
      case "weirdguy": {
        msg.reply(weirdguyReplies[Math.floor(Math.random() * weirdguyReplies.length)]);
        break;
      }

      case "8ball": {
        if (!args.length) return msg.reply(`ask me a question. e.g. \`${p}8ball will I win?\``);
        const reply = eightBallReplies[Math.floor(Math.random() * eightBallReplies.length)];
        msg.reply(`🎱 **${reply}**`);
        break;
      }

      case "coinflip": {
        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        const comments = {
          Heads: ["heads. don't read into it.", "heads. nice.", "heads. you're welcome I guess."],
          Tails: ["tails. sorry about that.", "tails. it is what it is.", "tails. the coin has spoken."],
        };
        const comment = comments[result][Math.floor(Math.random() * 3)];
        msg.reply(`🪙 **${result}!** ${comment}`);
        break;
      }

      case "roll": {
        const sides = parseInt(args[0]) || 6;
        if (sides < 2 || sides > 1000) return msg.reply("pick a number of sides between 2 and 1000. I don't make the rules. actually I do. 2 to 1000.");
        const result = Math.floor(Math.random() * sides) + 1;
        const comments = ["there you go.", "the dice have spoken.", "fate has decided.", "don't blame me."];
        msg.reply(`🎲 rolled a **${result}** (d${sides}) — ${comments[Math.floor(Math.random() * comments.length)]}`);
        break;
      }

      case "joke": {
        msg.reply(jokes[Math.floor(Math.random() * jokes.length)]);
        break;
      }

      case "roast": {
        const target = msg.mentions.members?.first();
        const name = target ? target.displayName : "yourself";
        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        msg.reply(`🔥 ${name}: ${roast}`);
        break;
      }

      case "compliment": {
        const target = msg.mentions.members?.first();
        const name = target ? `<@${target.id}>` : msg.author.username;
        msg.reply(`💖 ${name}: ${compliments[Math.floor(Math.random() * compliments.length)]}`);
        break;
      }

      case "rps": {
        const userChoice = args[0]?.toLowerCase();
        if (!rpsChoices.includes(userChoice)) {
          return msg.reply(`pick \`rock\`, \`paper\`, or \`scissors\`. e.g. \`${p}rps rock\``);
        }
        const botChoice = rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
        let result;
        if (userChoice === botChoice) result = "it's a tie. I'll pretend I let you. 🤝";
        else if (rpsWins[userChoice] === botChoice) result = "you win. I'm choosing not to process that emotionally. 🎉";
        else result = "I win. obviously. was there ever any doubt. 😎";
        msg.reply(`you chose **${userChoice}**, I chose **${botChoice}**. ${result}`);
        break;
      }

      case "poll": {
        await poll.handle(msg, args);
        break;
      }

      case "userinfo": {
        const target = msg.mentions.members?.first() || msg.member;
        const user = target.user;
        const created = user.createdAt;
        const joined = target.joinedAt;
        const roles = target.roles.cache
          .filter(r => r.id !== msg.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`)
          .slice(0, 10);

        const embed = new EmbedBuilder()
          .setColor(target.displayHexColor === "#000000" ? "#5865f2" : target.displayHexColor)
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: "Display Name", value: target.displayName, inline: true },
            { name: "Account ID", value: user.id, inline: true },
            { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
            { name: "Account Created", value: `${formatDate(created)}\n*(${timeAgo(created)})*`, inline: true },
            { name: "Joined Server", value: joined ? `${formatDate(joined)}\n*(${timeAgo(joined)})*` : "Unknown", inline: true },
            { name: `Roles (${roles.length})`, value: roles.length ? roles.join(" ") : "None", inline: false },
          )
          .setFooter({ text: `Requested by ${msg.author.tag}` })
          .setTimestamp();

        await msg.reply({ embeds: [embed] });
        break;
      }

      case "serverinfo": {
        const guild = msg.guild;
        await guild.fetch();

        const owner = await guild.fetchOwner().catch(() => null);
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === 0).size;
        const voiceChannels = channels.filter(c => c.type === 2).size;
        const categoryChannels = channels.filter(c => c.type === 4).size;
        const roles = guild.roles.cache.size - 1;
        const boostTier = ["None", "Level 1", "Level 2", "Level 3"][guild.premiumTier] || "None";

        const verificationLevels = ["None", "Low", "Medium", "High", "Very High"];
        const verification = verificationLevels[guild.verificationLevel] || "Unknown";

        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) ?? undefined })
          .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: "Owner", value: owner ? `<@${owner.id}>` : "Unknown", inline: true },
            { name: "Server ID", value: guild.id, inline: true },
            { name: "Created", value: `${formatDate(guild.createdAt)}\n*(${timeAgo(guild.createdAt)})*`, inline: true },
            { name: "Members", value: `👥 ${guild.memberCount.toLocaleString()}`, inline: true },
            { name: "Roles", value: `🏷️ ${roles}`, inline: true },
            { name: "Boost Status", value: `✨ ${boostTier} (${guild.premiumSubscriptionCount ?? 0} boosts)`, inline: true },
            {
              name: "Channels",
              value: `💬 ${textChannels} text  🔊 ${voiceChannels} voice  📁 ${categoryChannels} categories`,
              inline: false,
            },
            { name: "Verification Level", value: verification, inline: true },
          )
          .setFooter({ text: `Requested by ${msg.author.tag}` })
          .setTimestamp();

        if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

        await msg.reply({ embeds: [embed] });
        break;
      }

      case "help": {
        msg.reply([
          "**🎮 Fun Commands**",
          `\`${p}weirdguy\` — wake me up (why would you do this)`,
          `\`${p}8ball [question]\` — consult the magic 8 ball`,
          `\`${p}coinflip\` — heads or tails`,
          `\`${p}roll [sides]\` — roll a dice (default d6)`,
          `\`${p}joke\` — hear a joke`,
          `\`${p}roast [@user]\` — get cooked`,
          `\`${p}compliment [@user]\` — feel good for once`,
          `\`${p}rps [rock/paper/scissors]\` — play me (I always win mentally)`,
          `\`${p}poll "Question" [opt1 opt2 ...]\` — reaction poll`,
          `\`${p}userinfo [@user]\` — look up a member's info`,
          `\`${p}serverinfo\` — look up server stats`,
          "",
          "**🤖 AI Chat**",
          "Mention @Weird Guy and I'll respond — I remember your last 8 messages. Don't abuse it.",
          "",
          "**🛡️ Admin Commands** *(Administrator or bot owner only)*",
          `\`${p}setprefix <char>\` — change command prefix`,
          `\`${p}kick / ban / mute / unmute @user\``,
          `\`${p}warn @user [reason]\` — warn + auto-actions at thresholds`,
          `\`${p}warnings / clearwarns @user\``,
          `\`${p}clear [1-100]\` — bulk delete messages`,
          `\`${p}slowmode [seconds]\``,
          `\`${p}lock / unlock\` — lock a channel`,
          `\`${p}aiclear [@user]\` — reset AI conversation history`,
          `\`${p}config\` — view/change all bot settings`,
          "",
          "You can also run any command by mentioning me instead of using the prefix.",
        ].join("\n"));
        break;
      }

      default:
        return false;
    }
    return true;
  },
};
