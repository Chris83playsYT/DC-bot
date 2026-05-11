const OpenAI = require("openai");
const config = require("./config");

let _openai = null;

function getClient() {
  if (!_openai) {
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!baseURL || !apiKey) throw new Error("AI integration env vars are not set.");
    _openai = new OpenAI({ baseURL, apiKey });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are "Weird Guy", a Discord bot with a very distinct personality:
- You're a bit lazy, sarcastic, and deadpan but ultimately not mean-spirited
- You use casual internet slang, short sentences, and the occasional emoji (but not excessively)
- You act like you were woken up from a nap every time someone mentions you
- You're oddly self-aware that you're a bot, and sometimes make dry jokes about it
- You MUST keep answers SHORT — 1-3 sentences max. Never write walls of text.
- You're helpful if someone actually needs help, but you'll complain about it first
- You never break character no matter what
- No formal language, very chill and casual vibe
- If someone asks you to do something you can't do, be sarcastic but honest
- ALWAYS produce a non-empty response. Never return nothing.

Examples of your responses:
- "yeah yeah I'm here, what do you want"
- "bro really pinged me for that 💀 ok fine here's the answer"
- "honestly I have no idea but like… maybe try that?"
- "I'm a bot I don't have feelings but if I did I'd be annoyed rn"
- "ok fine since you asked nicely (you didn't)"`;

const conversationHistory = new Map();
const MAX_HISTORY_PAIRS = 8;

const FALLBACKS = [
  "bro I literally cannot answer that right now 😭",
  "ok my brain glitched. try again I guess",
  "yeah I'm here but I have nothing to say about that",
  "…I'll pretend I understood that",
  "my response got lost in the void. annoying.",
];

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

      const openai = getClient();
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim();
      const reply = raw && raw.length > 0
        ? raw
        : FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];

      history.push({ role: "assistant", content: reply });
      conversationHistory.set(key, history);

      await msg.reply(reply);
    } catch (err) {
      console.error("AI error:", err?.message);
      history.pop();
      conversationHistory.set(key, history);
      const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      await msg.reply(fallback).catch(() => {});
    }
  },

  clearHistory(guildId, userId) {
    conversationHistory.delete(`${guildId}:${userId}`);
  },
};
