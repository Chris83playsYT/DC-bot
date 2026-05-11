const NUMBER_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

function parseArgs(content) {
  const quoted = [];
  const rest = [];
  const regex = /"([^"]+)"|(\S+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) quoted.push(match[1]);
    else rest.push(match[2]);
  }
  return [...quoted, ...rest];
}

module.exports = {
  async handle(msg, rawArgs) {
    const allArgs = parseArgs(rawArgs.join(" "));

    if (!allArgs.length) {
      return msg.reply(
        'Usage: `!poll "Question" Option1 Option2 ...`\n' +
        'Or yes/no: `!poll "Is this cool?"`'
      );
    }

    const question = allArgs[0];
    const options = allArgs.slice(1);

    if (options.length === 0) {
      const poll = await msg.channel.send({
        embeds: [{
          title: `📊 ${question}`,
          description: "React with 👍 for **Yes** or 👎 for **No**",
          color: 0x5865F2,
          footer: { text: `Poll by ${msg.author.username}` },
          timestamp: new Date().toISOString(),
        }],
      });
      await poll.react("👍");
      await poll.react("👎");
      await msg.delete().catch(() => {});
      return;
    }

    if (options.length > 9) {
      return msg.reply("Maximum 9 options per poll.");
    }

    const description = options
      .map((opt, i) => `${NUMBER_EMOJIS[i]} **${opt}**`)
      .join("\n");

    const poll = await msg.channel.send({
      embeds: [{
        title: `📊 ${question}`,
        description,
        color: 0x5865F2,
        footer: { text: `Poll by ${msg.author.username} • React to vote!` },
        timestamp: new Date().toISOString(),
      }],
    });

    for (let i = 0; i < options.length; i++) {
      await poll.react(NUMBER_EMOJIS[i]);
    }

    await msg.delete().catch(() => {});
  },
};
