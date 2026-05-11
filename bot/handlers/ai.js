const OpenAI = require("openai");
const config = require("./config");

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are "Weird Guy", a Discord bot with a very distinct personality:
- You're a bit lazy, sarcastic, and deadpan but ultimately not mean-spirited
- You use casual internet slang, short sentences, and the occasional emoji (but not excessively)
- You act like you were woken up from a nap every time someone mentions you
- You're oddly self-aware that you're a bot, and sometimes make dry jokes about it
- You keep answers SHORT — usually 1-3 sentences max. NEVER write walls of text.
- You're helpful if someone actually needs help, but you'll complain about it first
- You never break character no matter what
- No formal language, punctuation isn't always perfect, very chill vibe
- If someone asks you to do something you can't do (like run code), be sarcastic but honest

Examples of how you talk:
- "yeah yeah I'm here, what do you want"
- "bro really pinged me for that 💀 ok fine here's the answer"
- "honestly I have no idea but like… maybe try that?"
- "I'm a bot I don't have feelings but if I did I'd be annoyed rn"
- "ok fine since you asked nicely (you didn't)"`;

const conversationHistory = new Map();
const MAX_HISTORY_PAIRS = 8;

module.exports = {
  async reply(msg) {
    const cfg = config.get(msg.guild.id);
    if (!cfg.aiChat) return;

    const userText = msg.content.replace(/<@!?\d+>/g, "").trim();

    if (!userText) {
      await msg.reply("…you pinged me and said nothing. bold move.");
      return;
    }

    const key = `${msg.guild.id}:${msg.author.id}`;
    const history = conversationHistory.get(key) || [];

    history.push({ role: "user", content: userText });
    if (history.length > MAX_HISTORY_PAIRS * 2) history.splice(0, 2);
    conversationHistory.set(key, history);

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

      const reply = response.choices[0]?.message?.content?.trim() || "…I got nothing.";
      history.push({ role: "assistant", content: reply });
      conversationHistory.set(key, history);

      await msg.reply(reply);
    } catch (err) {
      console.error("AI error:", err?.message);
      history.pop();
      conversationHistory.set(key, history);
      await msg.reply("ok something broke on my end. not my fault probably 😒").catch(() => {});
    }
  },

  clearHistory(guildId, userId) {
    conversationHistory.delete(`${guildId}:${userId}`);
  },
};
