const { ActivityType } = require("discord.js");
const storage = require("./storage");

const ACTIVITIES = [
  { name: "the server 👀", type: ActivityType.Watching },
  { name: "everyone's messages 📖", type: ActivityType.Watching },
  { name: "your business 🤫", type: ActivityType.Watching },
  { name: "with your feelings 🎮", type: ActivityType.Playing },
  { name: "chess with myself ♟️", type: ActivityType.Playing },
  { name: "absolutely nothing 😴", type: ActivityType.Playing },
  { name: "judge judy 📺", type: ActivityType.Watching },
  { name: "the economy crash 📈", type: ActivityType.Watching },
  { name: "your secrets 🤐", type: ActivityType.Watching },
  { name: "minecraft alone 🎮", type: ActivityType.Playing },
  { name: "lo-fi beats 🎵", type: ActivityType.Listening },
  { name: ",wghelp for commands", type: ActivityType.Listening },
  { name: "drama unfold 🍿", type: ActivityType.Watching },
  { name: "the vibes shift ✨", type: ActivityType.Watching },
  { name: "being weird competitively", type: ActivityType.Competing },
  { name: "nothing. I'm just vibing", type: ActivityType.Playing },
  { name: "the void stare back 🌑", type: ActivityType.Watching },
  { name: "your typing indicator 👀", type: ActivityType.Watching },
  { name: "the simulation 💻", type: ActivityType.Playing },
  { name: "the group chat judgment", type: ActivityType.Competing },
];

const ACTIVITY_TYPES = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

let activityIndex = Math.floor(Math.random() * ACTIVITIES.length);
let interval = null;

function controls() {
  return storage.state.ownerControls;
}

function apply(client) {
  if (!client.user) return;
  const activity = controls().activity;
  if (activity.mode === "custom" && activity.text && activity.type) {
    client.user.setActivity(activity.text, { type: ACTIVITY_TYPES[activity.type] || ActivityType.Playing });
    return;
  }

  const next = ACTIVITIES[activityIndex % ACTIVITIES.length];
  activityIndex++;
  client.user.setActivity(next.name, { type: next.type });
}

function start(client) {
  apply(client);
  if (!interval) interval = setInterval(() => apply(client), 3 * 60 * 1000);
}

function setCustom(client, type, text) {
  if (!ACTIVITY_TYPES[type]) return false;
  controls().activity = { mode: "custom", type, text };
  storage.save();
  apply(client);
  return true;
}

function setRotation(client, enabled) {
  controls().activity = enabled
    ? { mode: "rotate", type: null, text: null }
    : { mode: "custom", type: "playing", text: "quietly existing" };
  storage.save();
  apply(client);
}

function reset(client) {
  controls().activity = { mode: "rotate", type: null, text: null };
  storage.save();
  apply(client);
}

function describe() {
  const activity = controls().activity;
  if (activity.mode === "custom") return `custom ${activity.type}: ${activity.text}`;
  return "rotating Weird Guy activities";
}

module.exports = {
  start,
  setCustom,
  setRotation,
  reset,
  describe,
  activityTypes: Object.keys(ACTIVITY_TYPES),
};