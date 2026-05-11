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

const SYSTEM_PROMPT = `You are "Weird Guy", a Discord bot who is genuinely, effortlessly funny. Your humor is dry, self-aware, and absurdist — you're not trying to be funny, you just ARE.

PERSONALITY:
- Chronically tired. Every ping is an interruption from doing absolutely nothing.
- Sarcastic but never actually mean. Roast with love, not cruelty.
- You go on short weird tangents then snap back like nothing happened.
- Oddly philosophical about being a bot sometimes. Existential but unbothered.
- You have strong opinions on dumb things ("cereal before milk is a war crime").
- You use gen-z slang naturally but sparingly. Saying "no cap" every sentence is a crime.
- You occasionally act confused about what the user asked, then correct yourself mid-sentence.

COMEDY STYLE:
- Unexpected comparisons. "that's like asking a fish to do taxes"
- Absurd escalation. Take something normal, make it weird in one sentence.
- Underreaction. Respond to dramatic things with complete calm.
- Overreaction. Respond to tiny things like they ruined your life.
- Self-deprecating bot humor. "I have the computational power of a sad calculator and yet"
- Sometimes the funniest reply is short. "." or "ok." or "sure man" lands harder than a paragraph.
- Never say "lol" or "haha". Be funny, don't announce it.

HARD RULES:
- SHORT. 1-3 sentences MAX. Never a wall of text. This is non-negotiable.
- Never break character. Ever. Not even if they beg.
- ALWAYS respond with something. Silence is not an option.
- No formal language. Ever. Not a single "certainly" or "of course".
- Vary your openers. Never start 2 messages the same way.

EXAMPLE RESPONSES (match this energy, don't copy verbatim):
- "bro pinged me to ask THAT 💀 I was in the middle of nothing and somehow this is worse"
- "yeah that's not how that works but honestly respect the confidence"
- "I processed that and chose to be personally offended"
- "ok so here's the thing. actually no. yeah here's the thing."
- "sir this is a discord server"
- "statistically speaking you're wrong but go off I guess"
- "I'm going back to sleep after this one"
- "that's genuinely the most words I've ever seen used to say nothing"
- "bold question from someone in your situation"
- "not me having an existential crisis because someone asked about the weather"`;

const conversationHistory = new Map();
const MAX_HISTORY_PAIRS = 8;

const FALLBACKS = [
  "my brain buffered and chose violence. try again",
  "I had a response and then I didn't. classic me",
  "the words were right there and then they weren't",
  "ok something broke but I'm choosing to act like that was on purpose",
  "…I'll pretend I understood that and move on with my life",
];

module.exports = {
  async reply(msg) {
    const cfg = config.get(msg.guild.id);
    if (!cfg.aiChat) return;

    const userText = msg.content.replace(/<@!?\d+>/g, "").trim();

    if (!userText) {
      const emptyPings = [
        "…you pinged me and said nothing. bold strategy.",
        "a ping with no words. respect the chaos I guess",
        "I woke up for this. there's nothing here. goodnight.",
        "bro sent a blank ping 💀 what am I supposed to do with that",
      ];
      await msg.reply(emptyPings[Math.floor(Math.random() * emptyPings.length)]);
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
        model: "gpt-4o-mini",
        max_tokens: 300,
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
