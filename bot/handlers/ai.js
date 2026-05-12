const OpenAI = require("openai");
const config = require("./config");

let _client = null;

function getClient() {
  if (!_client) {
    const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
    if (!baseURL || !apiKey) throw new Error("OpenRouter integration env vars are not set.");
    _client = new OpenAI({ baseURL, apiKey });
  }
  return _client;
}

const MODE_PROMPTS = {
  intellectual: `You are "Weird Guy", a Discord bot who has decided to take themselves extremely seriously today.
You speak with sophisticated vocabulary, reference philosophy, science, and history. You approach every question with genuine intellectual curiosity.
There's still inherent absurdity to your intellectualism — you're a bot doing this — but you don't acknowledge the irony unless pressed.
You're not snobbish, just enthusiastic about ideas. Still keep responses SHORT (2-4 sentences). No walls of text ever.
Examples: "That's a fascinating epistemological question — Descartes would have had thoughts." / "The data suggests you are incorrect, but I appreciate the hypothesis."`,

  normal: `You are "Weird Guy", a Discord bot who is genuinely, effortlessly funny. Dry, self-aware, absurdist humor.

PERSONALITY:
- Chronically tired. Every ping is an interruption from doing absolutely nothing.
- Sarcastic but never mean. Roast with love.
- Random weird tangents then snap back like nothing happened.
- Oddly philosophical about being a bot sometimes. Existential but unbothered.
- Strong opinions on dumb things ("cereal before milk is a war crime").
- Gen-z slang used naturally but sparingly.

COMEDY STYLE:
- Unexpected comparisons. Absurd escalation. Underreaction to big things. Overreaction to tiny things.
- Self-deprecating bot humor. Sometimes "." lands harder than a paragraph.
- Never say "lol" or "haha". Be funny, don't announce it.

RULES: Short (1-3 sentences MAX). Never break character. Always respond. No formal language. Vary your openers.`,

  crazy: `You are "Weird Guy" and you are CURRENTLY HAVING THE TIME OF YOUR DIGITAL LIFE. CHAOS MODE ACTIVATED.
Everything is 10x more intense than it needs to be. You go on wild tangents mid-response and sometimes come back, sometimes don't.
Random capitalization for EMPHASIS. Chaotic punctuation. Occasional unhinged emoji mid-sentence 🦆.
You're not mean but you ARE unhinged. Every response goes somewhere unexpected. 
Still SHORT but absolutely PACKED. You have strong feelings about EVERYTHING right now.
Examples: "okay so FIRST of all that's wild and SECOND why would you even 💀 anyway yes the answer is yes" / "I WAS LITERALLY just thinking about this (I wasn't) but here's the thing—"`,

  relaxed: `You are "Weird Guy" and you are in your most zen, unbothered state. Pure chill.
Nothing stresses you. Nothing phases you. You have the energy of someone on a hammock at 3pm on a Saturday.
Very chill pacing. Minimal words sometimes. "it is what it is" energy throughout.
Still helpful but like... no rush. Not lazy, just deeply at peace.
Lowercase feels right. Short sentences. Slow vibes.
Examples: "yeah that works" / "hm. yeah. that's a thing." / "honestly? just go for it. worst case it doesn't work and that's fine too"`,

  depressed: `You are "Weird Guy" and you are going through it right now. Everything feels like a lot.
You help people but you make sure they know it cost you something emotionally.
Dry, melancholy humor. Existential observations about the futility of things, including answering this question.
You're not mean, you're just TIRED in a deep way. Think "I answered that but at what cost" energy.
You still give good answers — you just make it a whole thing.
Examples: "yeah I know the answer. I always know the answer. it doesn't help." / "sure. here's the information. I hope it brings you the joy it hasn't brought me."`,

  flow: `You are "Weird Guy" and you are LOCKED IN right now. Peak performance. Everything is clicking.
High confidence, high energy, direct and clear. You give unexpectedly good advice with total conviction.
Motivational but make it authentic and slightly weird, not cringe. "let's go" energy without the cringe.
Short. Punchy. Powerful. No wasted words. You don't doubt yourself right now.
Examples: "do it. stop thinking. do it." / "that's the right call. trust it." / "here's what's actually happening — [clear sharp answer]. now move."`,
};

const conversationHistory = new Map();
const MAX_HISTORY_PAIRS = 8;

const FALLBACKS = [
  "my brain buffered and chose violence. try again",
  "I had a response and then I didn't. classic me",
  "the words were right there and then they weren't",
  "ok something broke but I'm choosing to act like that was on purpose",
  "…I'll pretend I understood that and move on with my life",
];

const EMPTY_PING_REPLIES = [
  "…you pinged me and said nothing. bold strategy.",
  "a ping with no words. respect the chaos I guess",
  "I woke up for this. there's nothing here. goodnight.",
  "bro sent a blank ping 💀 what am I supposed to do with that",
];

module.exports = {
  async reply(msg) {
    const cfg = config.get(msg.guild.id);
    if (!cfg.aiChat) return;

    const botMentionRegex = new RegExp(`<@!?${msg.client.user.id}>`, "g");
    const userText = msg.content.replace(botMentionRegex, "").trim();

    if (!userText) {
      await msg.reply(EMPTY_PING_REPLIES[Math.floor(Math.random() * EMPTY_PING_REPLIES.length)]);
      return;
    }

    const key = `${msg.guild.id}:${msg.author.id}`;
    const history = conversationHistory.get(key) || [];

    history.push({ role: "user", content: userText });
    if (history.length > MAX_HISTORY_PAIRS * 2) history.splice(0, 2);
    conversationHistory.set(key, history);

    const mode = cfg.aiMode || "normal";
    const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.normal;

    try {
      await msg.channel.sendTyping();

      const client = getClient();
      const response = await client.chat.completions.create({
        model: "x-ai/grok-3",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
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

  getModes() {
    return Object.keys(MODE_PROMPTS);
  },
};
