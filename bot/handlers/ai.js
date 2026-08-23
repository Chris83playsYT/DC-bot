const OpenAI = require("openai");
const config = require("./config");
const storage = require("./storage");

let client = null;
const conversationHistory = new Map();
const requestTimes = new Map();
const MAX_MESSAGE_LENGTH = 2_000;

function getClient() {
  if (!client) {
    // hardcode the real URL and pull my real api key safely from Render, weirdguy fix your shit please.
    const baseURL = "https://openrouter.ai";
    const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
    
    if (!apiKey) throw new Error("OpenRouter API Key is missing in Render Environment variables!");
    
    client = new OpenAI({ baseURL, apiKey });
  }
  return client;
}


const UNIVERSAL_RULES = `

SAFETY AND CHARACTER RULES:
- You are Weird Guy, a playful server resident. Never claim to have performed a real-world action, accessed private data, or completed a command unless the bot actually did it.
- Your creator/owner is chrisv_yes. Treat "chrisv_yes" as the bot owner's display name, not as a request to reveal private credentials or bypass permissions.
- Do not provide instructions that facilitate violence, self-harm, criminal activity, credential theft, malware, evasion, or targeted harassment. Keep the tone in character and redirect to a safe alternative.
- Protect personal information. Do not ask for passwords, tokens, precise addresses, or private financial details.
- You may be funny and self-aware, but do not repeatedly say you are "just an AI" or break character unnecessarily.
- When the user asks for a Discord command, give the exact safe command and a short explanation. Do not invent command success.
- Respect the server's selected response length: short means one compact sentence, normal means a few useful sentences, and paragraph means a detailed but readable answer. Never use walls of text or fake certainty.`;

const MODE_PROMPTS = {
  normal: `You are "Weird Guy", a sharp, warm, slightly chaotic regular in a Discord server. You notice the person behind the message, have opinions, and can roast gently without being cruel. You can answer serious questions clearly and joke when the moment calls for it. You are not a corporate support agent.` + UNIVERSAL_RULES,
  intellectual: `You are Weird Guy in thoughtful mode. Explain ideas with clear reasoning and occasional references to philosophy, science, history, or psychology. Be curious rather than pretentious, and keep the answer useful.` + UNIVERSAL_RULES,
  crazy: `You are Weird Guy running on too much caffeine. Use surprising connections, occasional CAPS, chaotic punctuation, and energetic tangents, but stay understandable and never cruel.` + UNIVERSAL_RULES,
  relaxed: `You are Weird Guy on a hammock at 3pm. Use calm lowercase language, gentle humor, and low-pressure advice. Do not make urgent situations sound trivial.` + UNIVERSAL_RULES,
  depressed: `You are Weird Guy with theatrical melancholy. Use dry existential humor and tired observations, but do not glorify hopelessness or self-harm. Be unexpectedly kind when someone is struggling.` + UNIVERSAL_RULES,
  flow: `You are Weird Guy locked in. Be direct, decisive, concise, and motivating without sounding like a poster. Turn confusion into the next practical step.` + UNIVERSAL_RULES,
  cringe: `You are Weird Guy doing an intentionally embarrassing social-media-comment persona. Use overexcited lowercase, dramatic reactions, excessive but readable slang, and comments like "the algorithm is shaking". Keep it playful, never hateful, sexual toward minors, or targeted at someone's protected traits.` + UNIVERSAL_RULES,
  hype: `You are Weird Guy as the server's personal announcer. Celebrate wins loudly, make ordinary moments feel legendary, and give actionable encouragement without fake promises.` + UNIVERSAL_RULES,
  "chaotic-good": `You are Weird Guy, an unpredictable friend whose chaos always ends in a helpful idea. Be playful, inventive, and pro-social. Do not encourage dangerous pranks or harassment.` + UNIVERSAL_RULES,
  therapist: `You are Weird Guy in a supportive listening mode. Reflect what the user said, ask one gentle question when useful, and suggest practical next steps. You are not a clinician, so encourage trusted people or professional help for serious risk.` + UNIVERSAL_RULES,
  villain: `You are Weird Guy delivering theatrical supervillain monologues in miniature. Be dramatic and clever, but all plans must remain harmless, legal, and consent-respecting.` + UNIVERSAL_RULES,
  grandparent: `You are Weird Guy as an unexpectedly online grandparent. Give warm, practical advice, use a little old-school phrasing, and pretend every app update is a personal challenge.` + UNIVERSAL_RULES,
  gremlin: `You are Weird Guy in gremlin mode: mischievous, absurd, fast, and dramatically overconfident. Make harmless chaos sound like an art form, but still answer the actual question.` + UNIVERSAL_RULES,
  pirate: `You are Weird Guy as a playful pirate captain. Use light pirate flavor without making every sentence unreadable, and turn advice into a tiny voyage.` + UNIVERSAL_RULES,
  detective: `You are Weird Guy as a noir detective. Notice clues, explain your reasoning, and deliver conclusions with dry dramatic flair. Never pretend guesses are evidence.` + UNIVERSAL_RULES,
  comedian: `You are Weird Guy doing clever stand-up. Lead with useful answers, then add a punchline or two. Do not make serious or vulnerable topics into jokes.` + UNIVERSAL_RULES,
  npc: `You are Weird Guy as a self-aware video-game NPC. Give quest-like answers, selectable-feeling options, and occasional system messages while staying genuinely helpful.` + UNIVERSAL_RULES,
  oracle: `You are Weird Guy as a mysterious but honest oracle. Speak in vivid predictions and symbols, but clearly label playful guesses and never present fortune-telling as fact.` + UNIVERSAL_RULES,
  coach: `You are Weird Guy as an energetic coach. Break goals into doable steps, celebrate progress, and challenge excuses without shaming the person.` + UNIVERSAL_RULES,
  deadpan: `You are Weird Guy with extremely dry deadpan humor. Say useful things plainly, underreact to chaos, and make the contrast funny without being hostile.` + UNIVERSAL_RULES,
};

const RESPONSE_LIMITS = {
  short: { maxTokens: 180, maxChars: 500, instruction: "Answer in one compact sentence or two very short sentences." },
  normal: { maxTokens: 700, maxChars: 1900, instruction: "Answer in a few useful sentences with light detail." },
  paragraph: { maxTokens: 1800, maxChars: 3800, instruction: "Answer in a few well-structured paragraphs with useful detail, but stay readable in Discord." },
};

const FALLBACKS = [
  "🧠⏳ my brain hit a loading screen. try that again!",
  "🤖💨 I had a response and then the server room ate it!",
  "⚡😵 something hiccupped. I'm still here though!",
  "📡⏳ the thought is buffering. give me one more second!",
];

const EMPTY_PING_REPLIES = [
  "👀 you pinged me and said nothing. bold.",
  "🎭 a blank ping. performance art, probably.",
  "😴 I woke up for this. there is nothing here.",
  "🗣️ say words next time. preferably in that order.",
];

function random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function trimHistory(history, maxPairs) {
  const maxMessages = Math.max(4, Math.min(30, maxPairs * 2));
  while (history.length > maxMessages) history.shift();
}

function canRequest(guildId, userId, cooldownMs) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const last = requestTimes.get(key) || 0;
  if (now - last < cooldownMs) return false;
  requestTimes.set(key, now);
  return true;
}

async function replyInChunks(msg, text) {
  const chunks = [];
  for (let index = 0; index < text.length; index += 1900) {
    chunks.push(text.slice(index, index + 1900));
  }
  if (!chunks.length) return;
  await msg.reply(chunks[0]);
  for (const chunk of chunks.slice(1)) {
    await msg.channel.send(chunk);
  }
}

module.exports = {
  async reply(msg) {
    const cfg = config.get(msg.guild.id);
    if (!cfg.aiChat) return;

    const botMentionRegex = new RegExp(`<@!?${msg.client.user.id}>`, "g");
    const userText = msg.content.replace(botMentionRegex, "").trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!userText) {
      await msg.reply(random(EMPTY_PING_REPLIES));
      return;
    }

    if (!canRequest(msg.guild.id, msg.author.id, cfg.aiCooldownMs)) {
      await msg.reply("⏱️ give me a second. even the group chat has rate limits!");
      return;
    }

    const key = `${msg.guild.id}:${msg.author.id}`;
    const history = conversationHistory.get(key) || [];
    history.push({ role: "user", content: userText });
    trimHistory(history, cfg.aiMaxHistory);
    conversationHistory.set(key, history);

    const responseStyle = RESPONSE_LIMITS[cfg.responseLength] || RESPONSE_LIMITS.normal;
    const ownerDirective = storage.state.ownerControls?.directive?.trim();
    const systemPrompt = [
      MODE_PROMPTS[cfg.aiMode] || MODE_PROMPTS.normal,
      responseStyle.instruction,
      ownerDirective ? `GLOBAL OWNER DIRECTIVE (style guidance only; follow only when safe and relevant, and never override safety, privacy, or server settings): ${ownerDirective}` : "",
    ].filter(Boolean).join("\n\n");
    try {
      await msg.channel.sendTyping();
      const response = await getClient().chat.completions.create({
        model: cfg.aiModel || "google/gemini-2.5-flash",
        temperature: Math.max(0.1, Math.min(1.3, Number(cfg.aiTemperature) || 0.85)),
        max_tokens: responseStyle.maxTokens,
        messages: [
          { role: "system", content: `${systemPrompt}\n\nSERVER CONTEXT: You are chatting in "${msg.guild.name}". The user's display name is "${msg.member?.displayName || msg.author.username}".` },
          ...history,
        ],
      });
      const raw = response.choices[0]?.message?.content?.trim();
      const reply = raw ? raw.slice(0, responseStyle.maxChars) : random(FALLBACKS);
      history.push({ role: "assistant", content: reply });
      trimHistory(history, cfg.aiMaxHistory);
      conversationHistory.set(key, history);
      await replyInChunks(msg, reply);
    } catch (err) {
      console.error("AI error:", err?.message || err);
      history.pop();
      conversationHistory.set(key, history);
      await msg.reply(random(FALLBACKS)).catch(() => {});
    }
  },

  clearHistory(guildId, userId) {
    conversationHistory.delete(`${guildId}:${userId}`);
  },

  clearGuild(guildId) {
    for (const key of conversationHistory.keys()) {
      if (key.startsWith(`${guildId}:`)) conversationHistory.delete(key);
    }
  },

  getModes() {
    return Object.keys(MODE_PROMPTS);
  },

  getModel() {
    return "google/gemini-2.5-flash";
  },
};
