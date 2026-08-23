const { EmbedBuilder } = require("discord.js");
const poll = require("./poll");
const config = require("../handlers/config");
const premium = require("../handlers/premium");
const levels = require("../handlers/levels");
const security = require("../handlers/security");

// ── RESPONSE BANKS ────────────────────────────────────────────────────────────

const eightBallReplies = [
  "It is certain.", "Decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

const jokes = [
  "I told my dog he was adopted. He said 'I know, you throw like an idiot.'",
  "My therapist says I have trouble accepting things I can't change. We'll see about that.",
  "Why did the scarecrow win an award? Outstanding in his field. His coworkers hated him.",
  "I'm reading a book about anti-gravity. Cannot put it down. Send help.",
  "My wife said I needed to grow up. I told her to get out of my blanket fort.",
  "Why don't scientists trust atoms? They make up literally everything.",
  "I asked the librarian about paranoia books. She whispered 'they're right behind you.' Haven't been back.",
  "What do you call a fake noodle? An impasta. Been holding that for years.",
  "A skeleton walks into a bar and orders a beer and a mop.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why do cows wear bells? Their horns don't work.",
  "My doctor said I was going deaf. That was unexpected news.",
  "I used to hate facial hair but then it grew on me.",
  "I'm on a seafood diet. I see food and I eat it.",
  "Why did the math book look so sad? It had too many problems.",
  "I tried to write a joke about paper but it was tearable.",
];

const roasts = [
  "If brains were dynamite you wouldn't have enough to blow your hat off.",
  "You're the reason the gene pool needs a lifeguard. And warning signs.",
  "I'd roast you harder but my mom said I can't burn trash.",
  "You're not stupid. You just have a severe allergy to good ideas.",
  "I've seen better faces on a clock. A broken one.",
  "You're like a cloud — when you disappear it's a beautiful day.",
  "Some day you'll go far. I hope you stay there.",
  "You're proof evolution can go in reverse.",
  "You'd need a map to find your way out of a good idea.",
  "You have the energy of a wet napkin at a very important meeting.",
  "You're not the dumbest person I've met but hope they don't die.",
  "Your secrets are safe with me. I stopped listening immediately.",
  "You have your whole life to be an idiot. Take the day off.",
  "I'm not saying you're boring but you'd make a great screensaver.",
  "You're the human equivalent of a participation trophy.",
];

const compliments = [
  "You light up every room. Don't ruin it by talking about it.",
  "Honestly? You're kind of awesome. Don't let it go to your head.",
  "You have genuinely great energy. Which is rare. Protect it.",
  "The world is better with you in it. I don't say that lightly.",
  "You make people around you better just by existing. That's insane. Good insane.",
  "Your vibe is unmatched and I'm saying that as someone who doesn't give compliments.",
  "You're the human equivalent of finding $20 in a forgotten jacket.",
  "People probably don't tell you enough how genuinely solid you are.",
  "You're doing better than you think. That's a fact, not a guess.",
  "You have main character energy and you don't even know it.",
];

const weirdguyReplies = [
  "👀 oh you said my name. what do you want. I was busy",
  "nah not right now 😴 ...ok fine what",
  "you rang? I was literally in the middle of nothing and you interrupted it",
  "bro I JUST got here. what.",
  "…did you just say my name. why.",
  "I'm watching you. not creepy. ok maybe a little. what do you need.",
  "what do you WANT 😭 I'm so tired",
  "ok fine I'm here. happy? don't answer that.",
  "I heard my name and showed up reluctantly. here I am.",
  "you called? I almost didn't come.",
  "I was thinking about something completely unrelated. what now.",
  "every time bro. every single time.",
];

const truths = [
  "What's the most embarrassing thing you've done in the last week?",
  "What's a lie you've told that actually worked?",
  "Have you ever blamed someone else for something you did?",
  "What's the weirdest thing you've googled?",
  "What's a secret you've kept from your closest friend?",
  "Have you ever pretended to be asleep to avoid a conversation?",
  "What's something you did as a kid that you'd never admit?",
  "What's the pettiest thing you've ever done?",
  "When's the last time you cried and why?",
  "Have you ever talked bad about someone in this server?",
];

const dares = [
  "Change your nickname to 'Big Embarrassing Energy' for the next 10 minutes.",
  "Send a voice message saying something nice to someone you don't talk to often.",
  "Type your most used phrase 10 times in a row.",
  "Go 10 minutes without responding to anything.",
  "React to the last 5 messages with the most random emoji you can find.",
  "Write a 2-sentence story using only words that start with B.",
  "Send a compliment to the person two spots above you in the member list.",
  "Reply to the next 3 messages with only 'interesting.'",
  "Change your profile picture for 5 minutes (honor system).",
  "Send the most chaotic 10-word sentence you can think of.",
];

const wyrQuestions = [
  "Would you rather always speak in rhymes or always have to sing instead of speaking?",
  "Would you rather know when you'll die or how you'll die?",
  "Would you rather have no internet for a month or no food except salad for a month?",
  "Would you rather be able to talk to animals or speak all human languages?",
  "Would you rather always be 10 minutes late or always be 2 hours early?",
  "Would you rather never be able to use emojis or never be able to use punctuation?",
  "Would you rather lose all your memories from age 0-10 or all memories from the last year?",
  "Would you rather always have to say what you're thinking or never be able to speak again?",
  "Would you rather be famous but hated or completely unknown but loved by those who know you?",
  "Would you rather have a pause button for your life or a rewind button?",
];

const fortunes = [
  "A great opportunity is closer than it appears. Maybe check your DMs.",
  "The stars suggest you are doing better than you think. The stars also don't know you personally.",
  "Something unexpected will happen today. (This is always true. Fortune delivered.)",
  "Your energy is shifting. Probably because you moved your chair.",
  "An old connection will resurface. Whether that's good is above my pay grade.",
  "The universe has a plan for you. Whether you'll like it is a different question.",
  "Success is near. Closer than yesterday, at least. Probably.",
  "Someone is thinking about you right now. Make of that what you will.",
  "The path forward requires one small step. Not a metaphor. Just take a walk maybe.",
  "Today is a good day to try something different. Or not. Free will is real.",
];

const premiumQuotes = [
  "Luxury is having a plan and still choosing chaos.",
  "Your potential called. It says stop leaving it on read.",
  "The room changes when you enter. Sometimes because you opened the wrong door.",
  "A premium thought is just a normal thought with better lighting.",
  "You are not behind. You are taking the scenic route with suspicious confidence.",
];

const auraLevels = [
  ["✨", "radiant", "The server lighting improves when you arrive."],
  ["🔥", "dangerously magnetic", "People are pretending not to notice. Poorly."],
  ["🌙", "mysteriously composed", "You have said nothing and somehow won the room."],
  ["⚡", "high-voltage", "Please ground yourself before touching the group chat."],
  ["💎", "premium-grade", "Expensive energy. Questionable purchase decisions."],
  ["🪩", "socially luminous", "The algorithm is confused but supportive."],
];

const rpsChoices = ["rock", "paper", "scissors"];
const rpsWins = { rock: "scissors", paper: "rock", scissors: "paper" };

const activeTrivia = new Map();
const triviaQuestions = [
  { q: "What is the capital of France?", a: "paris", hint: "City of Lights" },
  { q: "How many sides does a hexagon have?", a: "6", hint: "It's in the name" },
  { q: "What planet is closest to the Sun?", a: "mercury", hint: "Starts with M" },
  { q: "What is the largest ocean on Earth?", a: "pacific", hint: "Truly massive" },
  { q: "How many colors are in a rainbow?", a: "7", hint: "Roy G Biv" },
  { q: "What gas do plants absorb?", a: "carbon dioxide", hint: "You breathe it out" },
  { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", hint: "Also designed flying machines" },
  { q: "What is the smallest planet?", a: "mercury", hint: "Also closest to the Sun" },
  { q: "In what year did the Titanic sink?", a: "1912", hint: "Early 20th century" },
  { q: "Chemical symbol for gold?", a: "au", hint: "Latin: Aurum" },
  { q: "How many bones in the adult human body?", a: "206", hint: "More than you'd guess" },
  { q: "What is the fastest land animal?", a: "cheetah", hint: "Big spotted cat" },
  { q: "How many strings does a standard guitar have?", a: "6", hint: "Standard. Not bass." },
  { q: "What year did World War 2 end?", a: "1945", hint: "Mid-forties" },
  { q: "What is the hardest natural substance on Earth?", a: "diamond", hint: "Very expensive" },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
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

function uwuify(text) {
  return text
    .replace(/r/g, "w").replace(/R/g, "W")
    .replace(/l/g, "w").replace(/L/g, "W")
    .replace(/n([aeiou])/gi, (_, v) => `ny${v}`)
    .replace(/th/g, "d").replace(/Th/g, "D")
    .replace(/!/g, "! uwu")
    .replace(/\./g, ". owo");
}

function deterministicPercent(userId, salt = "") {
  const str = userId + salt;
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 101;
}

function deterministicN(userId, max, salt = "") {
  const str = userId + salt;
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % (max + 1);
}

function safeCalc(expr) {
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) throw new Error("invalid");
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return (${expr})`)();
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shipScore(id1, id2) {
  return deterministicPercent([id1, id2].sort().join(""), "ship");
}

function shipBar(score) {
  const filled = Math.round(score / 10);
  return "❤️".repeat(filled) + "🖤".repeat(10 - filled);
}

function ppSize(userId) { return deterministicN(userId, 12, "pp"); }

function premiumOnly(msg) {
  if (premium.has(msg.author.id) || config.isOwner(msg.author.id)) return true;
  msg.reply("💎 That is a VIP command. Ask the bot owner to grant you premium.").catch(() => {});
  return false;
}

async function replyChunks(msg, text, limit = 1900) {
  const chunks = [];
  let current = "";
  for (const line of String(text).split("\n")) {
    if (line.length > limit) {
      if (current) { chunks.push(current); current = ""; }
      for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit));
      continue;
    }
    if (current && current.length + line.length + 1 > limit) {
      chunks.push(current);
      current = "";
    }
    current += `${current ? "\n" : ""}${line}`;
  }
  if (current) chunks.push(current);
  for (const chunk of chunks) await msg.reply(chunk);
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

module.exports = {
  checkTrivia(msg) {
    const active = activeTrivia.get(msg.channel.id);
    if (!active || msg.content.trim().toLowerCase() !== active.answer) return false;
    clearTimeout(active.timeout);
    activeTrivia.delete(msg.channel.id);
    msg.reply(`✅ **Correct!** Nice one, **${msg.member.displayName}**! Answer was \`${active.answer}\`.`).catch(() => {});
    return true;
  },

  async handle(msg, baseCommand, args, p = ",wg") {
    switch (baseCommand) {

      // ── CORE FUN ────────────────────────────────────────────────────
      case "weirdguy":
        msg.reply(rand(weirdguyReplies)); break;

      case "8ball":
        if (!args.length) return msg.reply(`ask me something. e.g. \`${p}8ball will I win?\``);
        msg.reply(`🎱 **${rand(eightBallReplies)}**`); break;

      case "coinflip": {
        const r = Math.random() < 0.5 ? "Heads" : "Tails";
        msg.reply(`🪙 **${r}!** ${rand({ Heads: ["don't read into it.", "nice."], Tails: ["it is what it is.", "sorry."] }[r])}`);
        break;
      }

      case "roll": {
        const sides = parseInt(args[0]) || 6;
        if (sides < 2 || sides > 1000) return msg.reply("pick 2–1000 sides.");
        msg.reply(`🎲 rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides}) — ${rand(["there you go.", "fate decided.", "don't blame me."])}`);
        break;
      }

      case "joke": msg.reply(rand(jokes)); break;

      case "mood": {
        const moods = [
          ["😌", "suspiciously calm", 82],
          ["🤨", "questioning everything", 58],
          ["🔥", "operating at unsafe levels of confidence", 94],
          ["🫠", "technically present", 31],
          ["✨", "weirdly optimistic", 76],
          ["🧃", "powered by a juice box and determination", 67],
        ];
        const [emoji, mood, score] = rand(moods);
        msg.reply(`${emoji} **Current Weird Guy mood:** ${mood}\nVibe stability: **${score}%** ${"▰".repeat(Math.floor(score / 10))}${"▱".repeat(10 - Math.floor(score / 10))}`);
        break;
      }

      case "vibecheck": {
        const target = msg.mentions.members?.first() || msg.member;
        const score = deterministicPercent(target.id, "vibe");
        const label = score >= 90 ? "legendary" : score >= 70 ? "immaculate" : score >= 45 ? "acceptable with evidence" : "under active investigation";
        msg.reply(`🔍 **Vibe Check:** ${target.displayName}\n${shipBar(score)} **${score}%** — ${label}.`);
        break;
      }

      case "roast": {
        const target = msg.mentions.members?.first();
        msg.reply(`🔥 ${target ? target.displayName : "yourself"}: ${rand(roasts)}`); break;
      }

      case "compliment": {
        const target = msg.mentions.members?.first();
        msg.reply(`💖 ${target ? `<@${target.id}>` : msg.author.username}: ${rand(compliments)}`); break;
      }

      case "rps": {
        const pick = args[0]?.toLowerCase();
        if (!rpsChoices.includes(pick)) return msg.reply(`pick \`rock\`, \`paper\`, or \`scissors\`.`);
        const bot = rand(rpsChoices);
        let result;
        if (pick === bot) result = "tie. I'll pretend I let you. 🤝";
        else if (rpsWins[pick] === bot) result = "you win. not processing that emotionally. 🎉";
        else result = "I win. obviously. 😎";
        msg.reply(`you chose **${pick}**, I chose **${bot}**. ${result}`);
        break;
      }

      case "poll": await poll.handle(msg, args); break;

      // ── CHOICE / GAMES ───────────────────────────────────────────────
      case "choose":
        if (args.length < 2) return msg.reply(`give me 2+ options. e.g. \`${p}choose pizza tacos sushi\``);
        msg.reply(`🎯 **${rand(args)}** — ${rand(["obviously.", "no contest.", "correct choice.", "I would have picked the same."])}`);
        break;

      case "ship": {
        const members = msg.mentions.members;
        if (!members || members.size < 2) return msg.reply(`mention 2 people. e.g. \`${p}ship @user1 @user2\``);
        const [m1, m2] = [...members.values()];
        const score = shipScore(m1.id, m2.id);
        const comment = score >= 90 ? "soulmates 💘" : score >= 70 ? "pretty solid 💕" : score >= 50 ? "could work 💛" : score >= 30 ? "it's complicated 🤔" : "I won't say it but you know 💀";
        msg.reply(`💘 **${m1.displayName}** + **${m2.displayName}**\n${shipBar(score)}\n**${score}%** — ${comment}`);
        break;
      }

      case "rate": {
        if (!args.length) return msg.reply(`give me something to rate. e.g. \`${p}rate pizza\``);
        const score = Math.floor(Math.random() * 11);
        const labels = ["absolute zero.", "historically bad.", "rough.", "not great.", "below average.", "perfectly mediocre.", "okay. it exists.", "genuinely decent.", "solid.", "excellent.", "10/10. peak."];
        msg.reply(`📊 **${args.join(" ")}**: **${score}/10** — ${labels[score]}`);
        break;
      }

      case "fight": {
        const target = msg.mentions.members?.first();
        if (!target || target.id === msg.client.user.id) {
          return msg.reply(`💀 **${msg.member.displayName}** challenged me to a fight. I'm a bot. I have no health bar. I win by default.`);
        }
        const winner = Math.random() < 0.5 ? msg.member : target;
        const loser = winner.id === msg.member.id ? target : msg.member;
        const outcomes = [
          `**${winner.displayName}** landed a critical hit and **${loser.displayName}** is down. gg.`,
          `**${loser.displayName}** tripped on the way in. **${winner.displayName}** wins by technicality.`,
          `After a 47-second staredown, **${loser.displayName}** blinked first. **${winner.displayName}** wins.`,
          `**${winner.displayName}** used "superior vocabulary." **${loser.displayName}** couldn't recover.`,
          `**${loser.displayName}** brought a knife to a vibe fight. **${winner.displayName}** wins on vibes.`,
        ];
        msg.reply(`⚔️ ${rand(outcomes)}`);
        break;
      }

      case "roulette": {
        const chambers = 6;
        const fired = Math.floor(Math.random() * chambers) === 0;
        if (fired) {
          const minutes = Math.floor(Math.random() * 10) + 1;
          msg.reply(`💀 **BANG.** <@${msg.author.id}> got hit — muted for **${minutes} minute(s)**. consequences are real.`);
          await msg.member.timeout(minutes * 60_000, "Russian roulette consequence").catch(() => {});
        } else {
          const remainingOdds = ["5/6", "4/5", "3/4", "2/3", "1/2", "1/1"][Math.floor(Math.random() * 6)];
          msg.reply(`🔫 *click.* **${msg.member.displayName}** survived. odds next time: worse.`);
        }
        break;
      }

      case "truth":
        msg.reply(`🎯 **Truth:** ${rand(truths)}`); break;

      case "dare":
        msg.reply(`🔥 **Dare:** ${rand(dares)}`); break;

      case "wyr":
        msg.reply(`🤔 **Would You Rather:**\n${rand(wyrQuestions)}`); break;

      case "trivia": {
        if (activeTrivia.has(msg.channel.id)) {
          const active = activeTrivia.get(msg.channel.id);
          return msg.reply(`⏳ already a trivia going: **${active.question}** (hint: ${active.hint})`);
        }
        const q = rand(triviaQuestions);
        const timeout = setTimeout(() => {
          activeTrivia.delete(msg.channel.id);
          msg.channel.send(`⏰ Time's up! Answer was **${q.a}**. nobody got it. embarrassing.`).catch(() => {});
        }, 30_000);
        activeTrivia.set(msg.channel.id, { question: q.q, answer: q.a, hint: q.hint, timeout });
        msg.reply(`🧠 **Trivia!** ${q.q}\n*Hint: ${q.hint}* — 30 seconds.`);
        break;
      }

      // ── TEXT MANIPULATION ────────────────────────────────────────────
      case "mock":
        if (!args.length) return msg.reply(`e.g. \`${p}mock hello there\``);
        msg.reply(mockText(args.join(" "))); break;

      case "reverse":
        if (!args.length) return msg.reply(`e.g. \`${p}reverse hello\``);
        msg.reply(args.join(" ").split("").reverse().join("")); break;

      case "clap":
        if (!args.length) return msg.reply(`e.g. \`${p}clap read the room\``);
        msg.reply(args.join(" 👏 ") + " 👏"); break;

      case "uwu":
        if (!args.length) return msg.reply(`e.g. \`${p}uwu hello there\``);
        msg.reply(uwuify(args.join(" "))); break;

      case "emojify": {
        if (!args.length) return msg.reply(`e.g. \`${p}emojify cool\``);
        const emojis = ["🔥", "💀", "✨", "👀", "💯", "🗿", "😭", "🤝", "🎯", "⚡"];
        const text = args.join(" ");
        const result = text.split("").map(c => c + (Math.random() < 0.3 ? " " + rand(emojis) : "")).join("");
        msg.reply(result.slice(0, 1000));
        break;
      }

      case "encode": {
        if (!args.length) return msg.reply(`e.g. \`${p}encode hello\``);
        msg.reply(`\`${Buffer.from(args.join(" ")).toString("base64")}\``);
        break;
      }

      case "decode": {
        if (!args.length) return msg.reply(`e.g. \`${p}decode aGVsbG8=\``);
        try {
          msg.reply(Buffer.from(args[0], "base64").toString("utf8"));
        } catch {
          msg.reply("❌ That's not valid base64.");
        }
        break;
      }

      case "calc": {
        if (!args.length) return msg.reply(`e.g. \`${p}calc 2 + 2\``);
        try {
          const result = safeCalc(args.join(" "));
          msg.reply(`🧮 \`${args.join(" ")} = ${result}\``);
        } catch {
          msg.reply("❌ Invalid expression. Numbers and + - * / ( ) % only.");
        }
        break;
      }

      // ── PERSONAL METERS ──────────────────────────────────────────────
      case "pp": {
        const target = msg.mentions.members?.first() || msg.member;
        const size = ppSize(target.id);
        const bar = "8" + "=".repeat(size) + "D";
        const comment = size >= 10 ? "…ok then." : size >= 7 ? "respectable." : size >= 4 ? "average." : "it's fine.";
        msg.reply(`📏 **${target.displayName}'s pp:**\n\`${bar}\` (${size} inches) — ${comment}`);
        break;
      }

      case "howgay": {
        const target = msg.mentions.members?.first() || msg.member;
        const score = deterministicPercent(target.id, "gay");
        msg.reply(`🏳️‍🌈 **${target.displayName}** is **${score}% gay**. the algorithm has spoken.`);
        break;
      }

      case "iq": {
        const target = msg.mentions.members?.first() || msg.member;
        const score = 60 + deterministicN(target.id, 80, "iq");
        const label = score >= 130 ? "genius" : score >= 110 ? "above average" : score >= 90 ? "average" : score >= 70 ? "below average" : "remarkable in its own way";
        msg.reply(`🧠 **${target.displayName}'s IQ: ${score}** — ${label}. (this is not real science)`);
        break;
      }

      case "rizz": {
        const target = msg.mentions.members?.first() || msg.member;
        const score = deterministicPercent(target.id, "rizz");
        const label = score >= 90 ? "unmatched rizz. dangerous." : score >= 70 ? "solid rizz. respectful." : score >= 50 ? "mid rizz. workable." : score >= 30 ? "rizz needs work." : "negative rizz. somehow impressive.";
        msg.reply(`✨ **${target.displayName}'s Rizz Score: ${score}/100** — ${label}`);
        break;
      }

      case "vibe": {
        const vibes = [
          "🔥 immaculate vibes right now. protect it.",
          "😐 mid vibes. not bad not good. it's a wednesday energy.",
          "💀 vibes are dead. pour one out.",
          "✨ surprisingly good vibes. don't jinx it.",
          "🌊 relaxed vibes. flowing. going with it.",
          "⚡ chaotic vibes. unhinged but make it work.",
          "😴 tired vibes. same honestly.",
          "🗿 unbothered vibes. nothing can touch you.",
        ];
        msg.reply(rand(vibes)); break;
      }

      // ── SERVER LEVELS ─────────────────────────────────────────────────
      case "rank":
      case "level":
      case "xp": {
        const target = msg.mentions.members?.first() || msg.member;
        await msg.reply(levels.formatProfile(msg, target.id));
        break;
      }

      case "leaderboard":
      case "levels": {
        const rows = levels.leaderboard(msg.guild.id, 10);
        if (!rows.length) return msg.reply("No XP has been earned here yet. Start talking. I believe in you almost.");
        const lines = rows.map((row, index) =>
          `**${index + 1}.** ${msg.guild.members.cache.get(row.userId)?.displayName || `<@${row.userId}>`} — Level **${row.level}** · **${row.xp.toLocaleString()} XP**`
        );
        await msg.reply(`**Server Level Leaderboard**\n${lines.join("\n")}`);
        break;
      }

      // ── SOCIAL ───────────────────────────────────────────────────────
      case "highfive": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`mention someone. e.g. \`${p}highfive @user\``);
        msg.reply(`🙌 **${msg.member.displayName}** high-fived **${target.displayName}**! o7`);
        break;
      }

      case "hug": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`mention someone. e.g. \`${p}hug @user\``);
        msg.reply(`🤗 **${msg.member.displayName}** hugged **${target.displayName}**! wholesome.`);
        break;
      }

      case "slap": {
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`mention someone. e.g. \`${p}slap @user\``);
        msg.reply(`👋 **${msg.member.displayName}** slapped **${target.displayName}** with a large trout. why.`);
        break;
      }

      // ── PREMIUM COMMANDS 💎 ──────────────────────────────────────────
      case "fortune": {
        if (!premium.has(msg.author.id) && !config.isOwner(msg.author.id)) {
          return msg.reply("💎 `fortune` is a **premium command**. Ask the server owner to grant you premium with `,wgowner premium add @you`.");
        }
        const embed = new EmbedBuilder()
          .setColor("#ffd700")
          .setTitle("🔮 Your Fortune")
          .setDescription(rand(fortunes))
          .setFooter({ text: "💎 Premium | Weird Guy Fortune" })
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "vip": {
        if (!premium.has(msg.author.id) && !config.isOwner(msg.author.id)) {
          return msg.reply("💎 You're not a premium user. Ask the owner to promote you.");
        }
        const embed = new EmbedBuilder()
          .setColor("#ffd700")
          .setTitle("💎 Premium Member")
          .setDescription(`**${msg.member.displayName}** is a verified premium member of this bot.`)
          .addFields(
            { name: "Exclusive Commands", value: "`fortune` `vip` `advice` `story`", inline: false },
            { name: "Status", value: "✅ Active Premium", inline: true },
          )
          .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "💎 Weird Guy Premium" })
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "advice": {
        if (!premium.has(msg.author.id) && !config.isOwner(msg.author.id)) {
          return msg.reply("💎 `advice` is a **premium command**.");
        }
        const adviceList = [
          "Stop waiting for the right time. There isn't one. Start anyway.",
          "The person you're comparing yourself to is also comparing themselves to someone else.",
          "Your energy is your most valuable resource. Spend it on things that actually matter to you.",
          "Most people are too focused on themselves to notice what you're embarrassed about.",
          "You don't need more motivation. You need a smaller first step.",
          "The version of you that future-you respects most is the one that showed up anyway.",
        ];
        msg.reply(`💎 **Advice for ${msg.member.displayName}:**\n${rand(adviceList)}`);
        break;
      }

      case "story": {
        if (!premiumOnly(msg)) return;
        const topic = args.join(" ") || "a bot with feelings";
        const stories = [
          `Once there was ${topic}. Nobody expected much. Turns out, that was the whole point.`,
          `The story of ${topic} begins like most things do: unexpectedly and slightly too late.`,
          `${topic} walked in and the room changed. Not dramatically. Just... slightly. Permanently.`,
          `Nobody talked about ${topic} until it was too late to ignore. Classic.`,
        ];
        msg.reply(`📖 **A Story About ${topic}:**\n${rand(stories)}`);
        break;
      }

      case "oracle": {
        if (!premiumOnly(msg)) return;
        const prophecies = [
          "The next message you send will change the vibe. Please use this power responsibly.",
          "A suspiciously convenient opportunity is approaching. It may be snacks.",
          "You will soon find exactly what you were looking for, after checking the same place twice.",
          "The prophecy says: take the small step. The dramatic soundtrack is optional.",
          "Your aura currently says 'one more episode.' The oracle does not judge. Much.",
        ];
        msg.reply(`🔮 **VIP Oracle:** ${rand(prophecies)}`);
        break;
      }

      case "heist": {
        if (!premiumOnly(msg)) return;
        const target = msg.mentions.members?.first();
        const partner = target ? target.displayName : "the nearest suspicious-looking teammate";
        const plans = [
          `Operation Snack Drawer is a go. You distract the server; ${partner} handles the imaginary getaway.`,
          `The plan is flawless: borrow the moon, replace it with a lamp, and deny everything.`,
          `You and ${partner} have been assigned a harmless mission: steal the spotlight, then return it politely.`,
          `The heist failed before it started because someone brought a spreadsheet. It was you.`,
        ];
        msg.reply(`🕶️ **VIP Heist Generator**\n${rand(plans)}`);
        break;
      }

      case "daily": {
        if (!premiumOnly(msg)) return;
        const challenges = [
          "compliment someone without adding a joke afterward",
          "make the next message in this server unnecessarily poetic",
          "drink water before sending another message",
          "turn a bad idea into a harmless good idea",
          "use an emoji you usually ignore",
          "tell someone here one specific thing they do well",
        ];
        msg.reply(`💎 **VIP Daily Challenge**\n${rand(challenges)}.`);
        break;
      }

      case "compat":
      case "chemistry": {
        if (!premiumOnly(msg)) return;
        const target = msg.mentions.members?.first();
        if (!target) return msg.reply(`Mention someone. e.g. \`${p}compat @user\``);
        const score = shipScore(msg.author.id, target.id);
        const comment = score >= 85 ? "dangerously synchronized" : score >= 65 ? "the server council approves" : score >= 40 ? "interesting chemistry" : "the paperwork is complicated";
        msg.reply(`🧪 **VIP Chemistry Scan**\n${msg.member.displayName} + ${target.displayName}\n${shipBar(score)} **${score}%** — ${comment}`);
        break;
      }

      case "vipstats": {
        if (!premiumOnly(msg)) return;
        const profile = levels.profile(msg.guild.id, msg.author.id);
        msg.reply(`💎 **VIP Stats for ${msg.member.displayName}**\nLevel **${profile.level}** · **${profile.xp.toLocaleString()} XP**\nMessages: **${profile.messages.toLocaleString()}** · Commands: **${profile.commands.toLocaleString()}**\nYour VIP aura is currently: **${rand(["legendary", "suspiciously powerful", "under review", "sparkly", "unreasonably confident"])}**`);
        break;
      }

      case "vipmenu":
      case "premiumhelp": {
        if (!premiumOnly(msg)) return;
        const embed = new EmbedBuilder()
          .setColor("#d4af37")
          .setTitle("💎 Weird Guy Black Card Lounge")
          .setDescription("Your premium access pass to the unnecessarily polished side of the bot.")
          .addFields(
            { name: "🔮 Insight", value: "`fortune` `oracle` `advice` `quote`", inline: true },
            { name: "🎭 Social", value: "`aura` `compat` `vip`", inline: true },
            { name: "🕶️ Chaos", value: "`heist` `daily` `story` `vipstats`", inline: true },
          )
          .setFooter({ text: "Premium access is global and granted by WeirdGuy." })
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "aura": {
        if (!premiumOnly(msg)) return;
        const target = msg.mentions.members?.first() || msg.member;
        const score = deterministicPercent(target.id, "aura");
        const [emoji, label, detail] = auraLevels[score % auraLevels.length];
        msg.reply(`${emoji} **VIP Aura Scan: ${target.displayName}**\n${shipBar(score)} **${score}%** — **${label}**\n*${detail}*`);
        break;
      }

      case "quote": {
        if (!premiumOnly(msg)) return;
        msg.reply(`💎 *Premium Quote Drop*\n> ${rand(premiumQuotes)}\n— **Weird Guy**`);
        break;
      }

      // ── INFO COMMANDS ────────────────────────────────────────────────
      case "botinfo":
      case "about": {
        const embed = new EmbedBuilder()
          .setColor("#ff6b35")
          .setTitle("✨ About Weird Guy")
          .setDescription("A playful, protective Discord companion built for useful tools, harmless chaos, and servers with personality.")
          .addFields(
            { name: "🎮 Fun", value: "Games, social commands, trivia, text tools, vibe checks, and leveling.", inline: true },
            { name: "🛡️ Safety", value: "Auto-moderation, warnings, raid mode, logs, timeouts, and protected targets.", inline: true },
            { name: "🤖 AI", value: "Mention Weird Guy for chat with 20 server-selectable personalities and 3 reply lengths.", inline: true },
            { name: "💎 Premium", value: "VIP lounge commands, aura scans, fortunes, challenges, and premium stats.", inline: true },
            { name: "⚙️ Server-first", value: "Prefixes, AI settings, automod, levels, and logs stay isolated to this server.", inline: true },
            { name: "👑 Owner", value: "Global controls are Discord-owner verified and password-gated. Temporary access is scoped and expires.", inline: true },
          )
          .setFooter({ text: "Weird Guy • Weird, useful, and responsibly chaotic" })
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "userinfo": {
        const target = msg.mentions.members?.first() || msg.member;
        const user = target.user;
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
            { name: "ID", value: user.id, inline: true },
            { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
            { name: "Account Created", value: `${formatDate(user.createdAt)}\n*(${timeAgo(user.createdAt)})*`, inline: true },
            { name: "Joined Server", value: target.joinedAt ? `${formatDate(target.joinedAt)}\n*(${timeAgo(target.joinedAt)})*` : "Unknown", inline: true },
            { name: `Roles (${roles.length})`, value: roles.length ? roles.join(" ") : "None" },
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
        const ch = guild.channels.cache;
        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) ?? undefined })
          .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: "Owner", value: owner ? `<@${owner.id}>` : "Unknown", inline: true },
            { name: "ID", value: guild.id, inline: true },
            { name: "Created", value: `${formatDate(guild.createdAt)}\n*(${timeAgo(guild.createdAt)})*`, inline: true },
            { name: "Members", value: `👥 ${guild.memberCount.toLocaleString()}`, inline: true },
            { name: "Roles", value: `🏷️ ${guild.roles.cache.size - 1}`, inline: true },
            { name: "Boosts", value: `✨ ${guild.premiumSubscriptionCount ?? 0}`, inline: true },
            { name: "Channels", value: `💬 ${ch.filter(c => c.type === 0).size} text  🔊 ${ch.filter(c => c.type === 2).size} voice`, inline: false },
          )
          .setFooter({ text: `Requested by ${msg.author.tag}` })
          .setTimestamp();
        if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "avatar": {
        const target = msg.mentions.members?.first() || msg.member;
        const url = target.user.displayAvatarURL({ dynamic: true, size: 1024 });
        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setTitle(`${target.user.tag}'s avatar`)
          .setImage(url)
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      // ── CONFIG / BOT ─────────────────────────────────────────────────
      case "aimode": {
        if (!security.isGuildAdmin(msg.member)) {
          return msg.reply("🚫 Only Administrators can change the AI mode.");
        }
        const mode = args[0]?.toLowerCase();
        const validModes = config.VALID_MODES;
        if (!mode) {
          const current = config.get(msg.guild.id).aiMode;
          return msg.reply(`**Current mode:** \`${current}\`\nModes: ${validModes.map(m => `\`${m}\``).join(", ")}\nUsage: \`${p}aimode [mode]\``);
        }
        const ok = config.setAiMode(msg.guild.id, mode);
        if (!ok) return msg.reply(`❌ Unknown mode. Choose: ${validModes.map(m => `\`${m}\``).join(", ")}`);
        const icons = { intellectual: "🎓", normal: "😎", crazy: "🤪", relaxed: "😌", depressed: "😔", flow: "🔥", cringe: "📱", hype: "📣", "chaotic-good": "🌀", therapist: "🫶", villain: "🦹", grandparent: "🧶" };
        msg.reply(`${icons[mode] || "🤖"} AI mode → **${mode}**`);
        break;
      }

      case "invite": {
        const clientId = msg.client.application?.id || msg.client.user.id;
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`;
        const embed = new EmbedBuilder()
          .setColor("#5865f2")
          .setTitle("🔗 Invite Weird Guy")
          .setDescription(`[Click here to add me to your server](${url})\n\nRequests **Administrator** — needed for full mod features.`)
          .setTimestamp();
        await msg.reply({ embeds: [embed] });
        break;
      }

      case "help":
        await replyChunks(msg, [
          `╭━━━ 🎮 **WEIRD GUY ARCADE** ━━━╮`,
          `┃ ⚡ Prefixes: \`!wg\` and \`,wg\` both work`,
          `┃ 🎲 **Quick Play**`,
          `┃ \`${p}weirdguy\` \`${p}8ball [question]\` \`${p}coinflip\` \`${p}roll [sides]\``,
          `┃ \`${p}joke\` \`${p}roast @user\` \`${p}compliment @user\` \`${p}rps [pick]\``,
          `┃ \`${p}mood\` \`${p}vibecheck [@user]\` \`${p}choose [options]\``,
          `┃ 🎯 **Games**`,
          `┃ \`${p}poll\` \`${p}ship @user @user\` \`${p}rate [thing]\` \`${p}fight @user\``,
          `┃ \`${p}roulette\` \`${p}trivia\` \`${p}truth\` \`${p}dare\` \`${p}wyr\``,
          `┃ 🪄 **Chaos Tools**`,
          `┃ \`${p}highfive\` \`${p}hug\` \`${p}slap @user\` \`${p}mock [text]\` \`${p}uwu [text]\``,
          `┃ \`${p}emojify [text]\` \`${p}encode [text]\` \`${p}decode [text]\` \`${p}calc [math]\``,
          `┃ 🏆 **Server Progress**`,
          `┃ \`${p}rank\` / \`${p}level\` — view XP · \`${p}leaderboard\` — top 10`,
          `┃ \`${p}avatar [@user]\` \`${p}userinfo [@user]\` \`${p}serverinfo\` \`${p}invite\``,
          "",
          `╭━━━ 💎 **VIP LOUNGE** ━━━╮`,
          `┃ \`${p}vipmenu\` \`${p}fortune\` \`${p}vip\` \`${p}advice\` \`${p}quote\``,
          `┃ \`${p}story [topic]\` \`${p}oracle\` \`${p}daily\` \`${p}aura [@user]\``,
          `┃ \`${p}compat @user\` \`${p}vipstats\` \`${p}heist\``,
          `┃ *VIP access is granted by the owner.*`,
          "",
          `╭━━━ ℹ️ **BOT INFO** ━━━╮`,
          `┃ \`${p}botinfo\` / \`${p}about\` — features, privacy, and control boundaries`,
          "",
          `╭━━━ 🤖 **AI LAB** ━━━╮`,
          `┃ Mention **@Weird Guy** to chat`,
          `┃ \`${p}aimode [mode]\` — ${config.VALID_MODES.map(m => `\`${m}\``).join(" ")}`,
          `┃ \`${p}config response <short|normal|paragraph>\` — server reply size`,
          "",
          `╭━━━ 🛡️ **ADMIN TOOLKIT** ━━━╮`,
          `┃ \`${p}kick\` \`${p}ban\` \`${p}softban\` \`${p}unban\` \`${p}mute\` \`${p}unmute\``,
          `┃ \`${p}warn\` \`${p}warnings\` \`${p}unwarn\` \`${p}clearwarns\``,
          `┃ \`${p}clear\` \`${p}purge\` \`${p}slowmode\` \`${p}lock\` \`${p}unlock\``,
          `┃ \`${p}announce #channel [message]\` \`${p}nick @user [name]\` \`${p}topic [text]\``,
          `┃ \`${p}serverstats\` \`${p}roleinfo @role\` \`${p}rolelist\` \`${p}memberinfo @user\``,
          `┃ \`${p}permissions\` \`${p}audit\` — bot access and moderation snapshot`,
          `┃ \`${p}config\` — server-only settings`,
          "",
          `╭━━━ 👑 **OWNER CONTROL ROOM** ━━━╮`,
          `┃ \`${p}owner overview\` \`${p}owner status\` \`${p}owner directive\` \`${p}owner chaos\``,
          `┃ \`${p}owner delegate add/remove/list\` — temporary scoped access`,
          `┃ \`${p}owner premium add/remove/list\` \`${p}owner broadcast\` \`${p}owner reset\``,
          "",
          `╰━━━ ✨ Use \`${p}[command]\` or mention @Weird Guy ✨ ━━━╯`,
        ].join("\n"));
        break;

      default:
        return false;
    }
    return true;
  },
};
