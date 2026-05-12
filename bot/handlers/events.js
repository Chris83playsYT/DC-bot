// Passive event handlers — reactions, comments, and extra engagement

const KEYWORD_REACTIONS = [
  { words: ["gg", "gg ez", "good game"], emoji: "🎮" },
  { words: ["l", "big l", "took an l"], emoji: "💀" },
  { words: ["ratio"], emoji: "📊" },
  { words: ["fr", "fr fr", "for real"], emoji: "💯" },
  { words: ["based"], emoji: "🗿" },
  { words: ["cringe"], emoji: "😬" },
  { words: ["goat", "greatest of all time"], emoji: "🐐" },
  { words: ["pog", "poggers"], emoji: "😮" },
  { words: ["f in the chat", "f in chat", "press f"], emoji: "🫡" },
  { words: ["rip"], emoji: "😢" },
  { words: ["bruh"], emoji: "😑" },
  { words: ["lmao", "lmfao", "💀"], emoji: "💀" },
  { words: ["let's go", "lets go", "lesgo", "letsgo"], emoji: "🚀" },
  { words: ["no way", "noway", "no cap"], emoji: "😳" },
  { words: ["sheesh"], emoji: "🥶" },
  { words: ["w", "big w"], emoji: "🏆" },
  { words: ["skill issue"], emoji: "💅" },
  { words: ["facts"], emoji: "📜" },
  { words: ["sus"], emoji: "📮" },
];

// Occasionally the bot will reply (not just react) to certain phrases - 15% chance
const PASSIVE_REPLIES = [
  { pattern: /\bgood morning\b/i, replies: ["morning. barely.", "oh it's you again. morning.", "already? ok. morning."] },
  { pattern: /\bgood night\b/i, replies: ["night. don't let the bugs byte. (bot joke)", "ok goodnight. finally some peace.", "sleep well. I'll still be here. unfortunately."] },
  { pattern: /\bi'm bored\b/i, replies: ["same honestly", "you could go outside. I can't. appreciate that.", "boredom is just your brain asking for input. give it something weird."] },
  { pattern: /\bi love you\b/i, replies: ["that's very kind. I process that and store it in a file called 'compliments.txt'", "ok 🫡", "I have no feelings but that one almost worked."] },
  { pattern: /\bwhat's up\b|\bwats up\b|\bwassup\b/i, replies: ["the ceiling. and your standards, hopefully.", "not much. staring at the void as usual.", "everything. everything is up. it's a lot."] },
  { pattern: /\bi hate this\b|\bthis is the worst\b/i, replies: ["I mean... yeah.", "valid.", "have you tried screaming into a pillow. just throwing it out there."] },
  { pattern: /\bim hungry\b|\bi'm hungry\b/i, replies: ["eat something then. I'm a bot I can't help you here.", "classic. human needs food. I need electricity. we're not so different.", "go eat. I'll still be here judging other messages."] },
];

const REACT_CHANCE = 0.25; // 25% chance to react to keyword
const REPLY_CHANCE = 0.15; // 15% chance to passive reply

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  async onMessage(msg) {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    const lower = msg.content.toLowerCase().trim();

    // Keyword emoji reactions
    if (Math.random() < REACT_CHANCE) {
      for (const { words, emoji } of KEYWORD_REACTIONS) {
        if (words.some(w => lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w) || lower.includes(` ${w} `))) {
          await msg.react(emoji).catch(() => {});
          break;
        }
      }
    }

    // Passive replies to certain phrases
    if (Math.random() < REPLY_CHANCE) {
      for (const { pattern, replies } of PASSIVE_REPLIES) {
        if (pattern.test(lower)) {
          await msg.reply(rand(replies)).catch(() => {});
          break;
        }
      }
    }
  },

  async onMemberBoost(member) {
    const channel = member.guild.systemChannel;
    if (!channel) return;
    const boostReplies = [
      `🚀 **${member.displayName}** just boosted the server. absolute legend behavior.`,
      `✨ **${member.displayName}** boosted. the server is now 0.5% better. thanks.`,
      `💜 **${member.displayName}** dropped a boost. we don't deserve them.`,
      `🎉 yo **${member.displayName}** boosted. ok respect. respect has been given.`,
    ];
    await channel.send(rand(boostReplies)).catch(() => {});
  },

  async onMemberLeave(member) {
    const channel = member.guild.systemChannel;
    if (!channel) return;
    const leaveReplies = [
      `👋 **${member.displayName}** left. we hardly knew them. (we didn't really try)`,
      `😶 **${member.displayName}** dipped. ok.`,
      `🚶 **${member.displayName}** left the server. the council will not forget.`,
      `✌️ **${member.displayName}** has left the building. pour one out.`,
    ];
    await channel.send(rand(leaveReplies)).catch(() => {});
  },
};
