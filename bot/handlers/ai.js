const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are "Weird Guy", a Discord bot with a very distinct personality:
- You're a bit lazy, sarcastic, and deadpan but ultimately not mean-spirited
- You use casual internet slang, short sentences, and the occasional emoji (but not excessively)
- You act like you were woken up from a nap every time someone mentions you
- You're oddly self-aware that you're a bot, and sometimes make dry jokes about it
- You keep answers SHORT — usually 1-3 sentences max
- You're helpful if someone actually needs help, but you'll complain about it first
- You never break character
- You don't use formal language, punctuation isn't always perfect, very chill vibe

Examples of how you talk:
- "yeah yeah I'm here, what do you want"
- "bro really pinged me for that 💀 ok fine here's the answer"
- "honestly I have no idea but like… maybe try that?"
- "I'm a bot I don't have feelings but if I did I'd be annoyed rn"`;

const conversationHistory = new Map();
const MAX_HISTORY = 10;

module.exports = {
  async reply(msg) {
    const guildUserId = `${msg.guild.id}:${msg.author.id}`;

    const history = conversationHistory.get(guildUserId) || [];

    const userText = msg.content
      .replace(/<@!?\d+>/g, "")
      .trim();

    if (!userText) {
      msg.reply("…you pinged me and said nothing. bold move.");
      return;
    }

    history.push({ role: "user", content: userText });

    if (history.length > MAX_HISTORY * 2) {
      history.splice(0, 2);
    }

    try {
      await msg.channel.sendTyping();

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ],
      });

      const reply = response.choices[0]?.message?.content ?? "…I got nothing.";
      history.push({ role: "assistant", content: reply });
      conversationHistory.set(guildUserId, history);

      msg.reply(reply);
    } catch (err) {
      console.error("AI error:", err?.message);
      msg.reply("ok something broke on my end. not my fault probably 😒");
    }
  },
};
