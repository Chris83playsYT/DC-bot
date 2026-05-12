const { EmbedBuilder } = require("discord.js");
const poll = require("./poll");
const config = require("../handlers/config");

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
  "A skeleton walks into a bar and orders a beer and a mop.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "I'm on a seafood diet. I see food and I eat it. Classic.",
  "Why do cows wear bells? Their horns don't work. I don't make the rules.",
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
  "You're not the dumbest person I've ever met but you better hope they don't die.",
  "Your secrets are safe with me. I stopped listening immediately.",
  "You have your entire life to be an idiot. Why not take today off.",
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
  "You're doing better than you think. That's not a guess, that's a fact.",
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

const triviaQuestions = [
  { q: "What is the capital of France?", a: "paris", hint: "City of Lights" },
  { q: "How many sides does a hexagon have?", a: "6", hint: "It's in the name" },
  { q: "What planet is closest to the Sun?", a: "mercury", hint: "Starts with M" },
  { q: "What is the largest ocean on Earth?", a: "pacific", hint: "It's truly massive" },
  { q: "How many colors are in a rainbow?", a: "7", hint: "Roy G Biv" },
  { q: "What gas do plants absorb from the atmosphere?", a: "carbon dioxide", hint: "You breathe it out" },
  { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", hint: "Also designed flying machines" },
  { q: "What is the smallest planet in our solar system?", a: "mercury", hint: "Also closest to the Sun" },
  { q: "In what year did the Titanic sink?", a: "1912", hint: "Early 20th century" },
  { q: "What is the chemical symbol for gold?", a: "au", hint: "Latin: Aurum" },
];

const activeTrivia = new Map(); // channelId -> { question, answer, timeout }

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
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function mockText(text) {
  return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

function ppSize(userId) {
  // Deterministic based on userId so it's consistent per user
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 13; // 0-12 inches
}

function shipScore(id1, id2) {
  const combined = [id1, id2].sort().join("");
  let hash = 0;
  for (const ch of combined) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 101; // 0-100
}

function shipBar(score) {
  const filled = Math.round(score / 10);
  return "❤️".repeat(filled) + "🖤".repeat(10 - filled);
}

module.exports = {
  // Expose for trivia answer checking
  checkTrivia(msg) {
    const active = activeTrivia.get(msg.channel.id);
    if (!active) return false;
    if (msg.content.trim().toLowerCase() === active.answer) {
      clearTimeout(active.timeout);
      activeTrivia.delete(msg.channel.id);
      msg.reply(`✅ **Correct!** Nice one, **${msg.member.displayName}**! The answer was \`${active.answer}\`.`).catch(() => {});
      return true;
    }
    return false;
  },

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
        msg.reply(`🪙 **${result}!** ${comments[result][Math.floor(Math.random() * 3)]}`);
        break;
      }

      case "roll": {
        const sides = parseInt(args[0]) || 6;
        if (sides < 2 || sides > 1000) return msg.reply("pick a number of sides between 2 and 1000.");
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
        msg.reply(`🔥 ${name}: ${roasts[Math.floor(Math.random() * roasts.length)]}`);
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

      case "choose": {
        if (args.length < 2) return msg.reply(`give me at least 2 options. e.g. \`${p}choose pizza tacos sushi\``);
        const chosen = args[Math.floor(Math.random() * args.length)];
        const comments = ["obviously.", "no contest.", "and honestly? correct.", "I would have picked the same.", "the data supports this choice."];
        msg.reply(`🎯 **${chosen}** — ${comments[Math.floor(Math.random() * comments.length)]}`);
        break;
      }

      case "ship": {
        const members = msg.mentions.members;
        if (!members || members.size < 2) return msg.reply(`mention 2 people to ship. e.g. \`${p}ship @user1 @user2\``);
        const [m1, m2] = [...members.values()];
        const score = shipScore(m1.id, m2.id);
        const bar = shipBar(score);
        const comments = score >= 90 ? "soulmates honestly 💘" : score >= 70 ? "pretty solid tbh 💕" : score >= 50 ? "could work with effort 💛" : score >= 30 ? "it's complicated 🤔" : "I'm not gonna lie to you 💀";
        msg.reply(`💘 **${m1.displayName}** + **${m2.displayName}**\n${bar}\n**${score}%** compatibility — ${comments}`);
        break;
      }

      case "rate": {
        if (!args.length) return msg.reply(`give me something to rate. e.g. \`${p}rate pizza\``);
        const thing = args.join(" ");
        const score = Math.floor(Math.random() * 11);
        const reactions = {
          0: "absolute zero. historically bad.",
          1: "I've seen better. I've seen worse. actually no I haven't.",
          2: "rough.",
          3: "not great, not terrible. actually terrible.",
          4: "below average and aware of it.",
          5: "exactly in the middle. safe. boring. fine.",
          6: "okay. passable. it exists.",
          7: "genuinely decent. I'm surprised.",
          8: "solid. I have respect for this.",
          9: "excellent. I don't give this easily.",
          10: "perfect. I've achieved something by rating this.",
        };
        msg.reply(`📊 **${thing}**: **${score}/10** — ${reactions[score]}`);
        break;
      }

      case "mock": {
        if (!args.length) return msg.reply(`give me something to mock. e.g. \`${p}mock hello there\``);
        msg.reply(mockText(args.join(" ")));
        break;
      }

      case "reverse": {
        if (!args.length) return msg.reply(`give me text to reverse. e.g. \`${p}reverse hello\``);
        msg.reply(args.join(" ").split("").reverse().join(""));
        break;
      }

      case "pp": {
        const target = msg.mentions.members?.first() || msg.member;
        const size = ppSize(target.id);
        const bar = "8" + "=".repeat(size) + "D";
        msg.reply(`📏 **${target.displayName}'s pp:**\n\`${bar}\` (${size} inches)\n${size >= 10 ? "…ok then." : size >= 7 ? "respectable." : size >= 4 ? "average, apparently." : size >= 2 ? "it's fine." : "…I won't say anything."}`);
        break;
      }

      case "avatar": {
        const target = msg.mentions.members?.first() || msg.member;
        const url = target.user.displayAvatarURL({ dynamic: true, size: 1024 });
        const embed = new EmbedBuilder()
          .setColor(target.displayHexColor === "#000000" ? "#5865f2" : target.displayHexColor)
          .setAuthor({ name: `${target.user.tag}'s avatar`, iconURL: url })
          .setImage(url)
          .setFooter({ text: `Requested by ${msg.author.tag}` })
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "trivia": {
        if (activeTrivia.has(msg.channel.id)) {
          const active = activeTrivia.get(msg.channel.id);
          return msg.reply(`⏳ A trivia question is already active! **${active.question}** — hint: ${active.hint}`);
        }
        const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        const timeout = setTimeout(() => {
          activeTrivia.delete(msg.channel.id);
          msg.channel.send(`⏰ Time's up! The answer was **${q.a}**. nobody got it. embarrassing.`).catch(() => {});
        }, 30_000);
        activeTrivia.set(msg.channel.id, { question: q.q, answer: q.a, hint: q.hint, timeout });
        msg.reply(`🧠 **Trivia Time!**\n${q.q}\n*Hint: ${q.hint}* — you have 30 seconds.`);
        break;
      }

      case "aimode": {
        if (!msg.member.permissions.has("Administrator") && !require("../handlers/config").isOwner(msg.author.id)) {
          return msg.reply("🚫 Only Administrators can change the AI mode.");
        }
        const mode = args[0]?.toLowerCase();
        const validModes = config.VALID_MODES;
        if (!mode) {
          const current = config.get(msg.guild.id).aiMode;
          return msg.reply(`**Current AI mode:** \`${current}\`\nAvailable: ${validModes.map(m => `\`${m}\``).join(", ")}\nUsage: \`${p}aimode [mode]\``);
        }
        const ok = config.setAiMode(msg.guild.id, mode);
        if (!ok) return msg.reply(`❌ Unknown mode. Choose from: ${validModes.map(m => `\`${m}\``).join(", ")}`);
        const modeEmojis = { intellectual: "🎓", normal: "😎", crazy: "🤪", relaxed: "😌", depressed: "😔", flow: "🔥" };
        msg.reply(`${modeEmojis[mode] || "🤖"} AI mode set to **${mode}**. I'll adapt immediately.`);
        break;
      }

      case "invite": {
        const clientId = msg.client.application?.id || msg.client.user.id;
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`;
        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setTitle("🔗 Invite Weird Guy")
          .setDescription(`[Click here to add me to your server](${url})\n\nRequests **Administrator** — needed for full mod features. You can reduce permissions in the invite flow.`)
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
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
            { name: "Channels", value: `💬 ${textChannels} text  🔊 ${voiceChannels} voice  📁 ${categoryChannels} categories`, inline: false },
            { name: "Verification Level", value: verificationLevels[guild.verificationLevel] || "Unknown", inline: true },
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
          `\`${p}8ball [question]\` — ask the magic 8 ball`,
          `\`${p}coinflip\` — heads or tails`,
          `\`${p}roll [sides]\` — roll a dice (default d6)`,
          `\`${p}joke\` — hear a joke`,
          `\`${p}roast [@user]\` — get cooked`,
          `\`${p}compliment [@user]\` — feel good for once`,
          `\`${p}rps [rock/paper/scissors]\` — play me`,
          `\`${p}poll "Question" [opt1 opt2 ...]\` — reaction poll`,
          `\`${p}choose [opt1] [opt2] ...\` — let me decide`,
          `\`${p}ship @user1 @user2\` — compatibility rating`,
          `\`${p}rate [thing]\` — I rate it out of 10`,
          `\`${p}mock [text]\` — SpOnGeBob style`,
          `\`${p}reverse [text]\` — reverse text`,
          `\`${p}pp [@user]\` — you know what this is`,
          `\`${p}avatar [@user]\` — full size avatar`,
          `\`${p}trivia\` — 30-second trivia question`,
          `\`${p}userinfo [@user]\` — member info`,
          `\`${p}serverinfo\` — server stats`,
          `\`${p}invite\` — get the bot invite link`,
          "",
          "**🤖 AI Chat**",
          `Mention @Weird Guy to chat. Use \`${p}aimode [mode]\` to change personality.`,
          `Modes: \`intellectual\` \`normal\` \`crazy\` \`relaxed\` \`depressed\` \`flow\``,
          "",
          "**🛡️ Admin Commands** *(Administrator or bot owner)*",
          `\`${p}kick / ban / mute / unmute @user\``,
          `\`${p}warn @user [reason]\` — warn + auto-actions at thresholds`,
          `\`${p}warnings / clearwarns @user\``,
          `\`${p}clear [1-100]\` — bulk delete messages`,
          `\`${p}purge @user [1-100]\` — delete a user's recent messages`,
          `\`${p}slowmode [seconds]\``,
          `\`${p}lock / unlock\` — lock a channel`,
          `\`${p}lockall / unlockall\` — lock or unlock ALL channels`,
          `\`${p}nuke\` — delete and recreate channel (wipes history)`,
          `\`${p}dehoist\` — rename hoisted members`,
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
