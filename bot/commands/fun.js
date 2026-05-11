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
  "Why don't scientists trust atoms? Because they make up everything.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Why do cows wear bells? Because their horns don't work.",
  "I asked the librarian if they had books about paranoia. She whispered, 'They're right behind you.'",
  "What do you call a fake noodle? An impasta.",
  "Why can't you give Elsa a balloon? Because she'll let it go.",
  "I used to hate facial hair, but then it grew on me.",
];

const roasts = [
  "If brains were dynamite, you wouldn't have enough to blow your hat off.",
  "You're the reason the gene pool needs a lifeguard.",
  "I'd roast you harder but my mom said I'm not allowed to burn trash.",
  "You're not stupid, you just have bad luck thinking.",
  "I've seen better looking faces on a clock.",
  "You're like a cloud — when you disappear, it's a beautiful day.",
  "Some day you'll go far… and I hope you stay there.",
  "You're proof that evolution can go in reverse.",
];

const compliments = [
  "You light up every room you walk into! 🌟",
  "Honestly? You're kind of awesome. Don't tell anyone I said that.",
  "You have a genuinely great energy about you. 💫",
  "The world is better with you in it, fr.",
  "You're the human equivalent of a warm cup of hot chocolate. ☕",
  "You make people around you better just by being there.",
  "Your vibe is unmatched. Seriously.",
  "You deserve all the good things coming your way. 🙌",
];

const weirdguyReplies = [
  "👀 hey… what are you doing here",
  "nah bro I'm sleeping rn 😴",
  "why you looking at me like that 😭",
  "bro I literally just got here calm down",
  "…did you just say my name 👁️👁️",
  "I'm watching you. Not in a creepy way. ok maybe a little.",
  "what do you WANT from me 😭",
  "ok fine I'm here. happy now?",
];

const rpsChoices = ["rock", "paper", "scissors"];
const rpsWins = { rock: "scissors", paper: "rock", scissors: "paper" };

module.exports = {
  handle(msg, command, args) {
    switch (command) {
      case "!weirdguy": {
        msg.reply(weirdguyReplies[Math.floor(Math.random() * weirdguyReplies.length)]);
        break;
      }

      case "!8ball": {
        if (!args.length) return msg.reply("Ask me a question! e.g. `!8ball will I win?`");
        const reply = eightBallReplies[Math.floor(Math.random() * eightBallReplies.length)];
        msg.reply(`🎱 **${reply}**`);
        break;
      }

      case "!coinflip": {
        msg.reply(Math.random() < 0.5 ? "🪙 **Heads!**" : "🪙 **Tails!**");
        break;
      }

      case "!roll": {
        const sides = parseInt(args[0]) || 6;
        if (sides < 2 || sides > 1000) return msg.reply("Pick a number of sides between 2 and 1000.");
        const result = Math.floor(Math.random() * sides) + 1;
        msg.reply(`🎲 You rolled a **${result}** (d${sides})`);
        break;
      }

      case "!joke": {
        msg.reply(jokes[Math.floor(Math.random() * jokes.length)]);
        break;
      }

      case "!roast": {
        const target = msg.mentions.members?.first();
        const name = target ? target.displayName : "yourself";
        msg.reply(`🔥 ${name}: ${roasts[Math.floor(Math.random() * roasts.length)]}`);
        break;
      }

      case "!compliment": {
        const target = msg.mentions.members?.first();
        const name = target ? `<@${target.id}>` : msg.author.username;
        msg.reply(`💖 ${name}: ${compliments[Math.floor(Math.random() * compliments.length)]}`);
        break;
      }

      case "!rps": {
        const userChoice = args[0]?.toLowerCase();
        if (!rpsChoices.includes(userChoice)) {
          return msg.reply("Choose `rock`, `paper`, or `scissors`! e.g. `!rps rock`");
        }
        const botChoice = rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
        let result;
        if (userChoice === botChoice) result = "It's a tie! 🤝";
        else if (rpsWins[userChoice] === botChoice) result = "You win! 🎉 …lucky.";
        else result = "I win. obviously. 😎";
        msg.reply(`You chose **${userChoice}**, I chose **${botChoice}**. ${result}`);
        break;
      }

      case "!help": {
        msg.reply([
          "**🎮 Fun Commands**",
          "`!weirdguy` — wake me up",
          "`!8ball [question]` — ask the magic 8 ball",
          "`!coinflip` — heads or tails",
          "`!roll [sides]` — roll a dice (default d6)",
          "`!joke` — hear a joke",
          "`!roast [@user]` — get roasted",
          "`!compliment [@user]` — feel good for once",
          "`!rps [rock/paper/scissors]` — play me",
          "",
          "**🛡️ Admin Commands** *(requires Administrator)*",
          "`!kick @user [reason]`",
          "`!ban @user [reason]`",
          "`!mute @user [minutes]`",
          "`!unmute @user`",
          "`!warn @user [reason]` — auto-actions at thresholds:",
          "　　🔇 3 warnings → mute 10 min",
          "　　👢 5 warnings → kick",
          "　　🔨 7 warnings → ban",
          "`!warnings @user`",
          "`!clearwarns @user`",
          "`!clear [amount]` — delete messages (max 100)",
          "`!slowmode [seconds]` — set channel slowmode",
          "`!lock` / `!unlock` — lock or unlock a channel",
        ].join("\n"));
        break;
      }

      default:
        return false;
    }
    return true;
  },
};
