const config = require("../handlers/config");

function canConfigure(member) {
  return member.permissions.has("Administrator") || config.isOwner(member.id);
}

module.exports = {
  async handle(msg, args) {
    if (!canConfigure(msg.member)) {
      msg.reply("🚫 Only Administrators or the bot owner can use `config`.");
      return true;
    }

    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "show") {
      msg.reply(config.format(msg.guild.id));
      return true;
    }

    const cfg = config.get(msg.guild.id);

    switch (sub) {
      case "prefix": {
        const p = args[1];
        if (!p || p.length > 3) return msg.reply("Provide a prefix (1–3 chars). e.g. `!config prefix .`");
        cfg.prefix = p;
        msg.reply(`✅ Prefix set to \`${p}\``);
        break;
      }

      case "aichat": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config aichat off`");
        cfg.aiChat = val === "on";
        msg.reply(`✅ AI chat on mention is now **${val}**.`);
        break;
      }

      case "automod": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config automod off`");
        cfg.automod.enabled = val === "on";
        msg.reply(`✅ Auto-mod is now **${val}**.`);
        break;
      }

      case "invites": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config invites off`");
        cfg.automod.blockInvites = val === "on";
        msg.reply(`✅ Invite blocking is now **${val}**.`);
        break;
      }

      case "spam": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config spam off`");
        cfg.automod.antiSpam = val === "on";
        msg.reply(`✅ Anti-spam is now **${val}**.`);
        break;
      }

      case "spamlimit": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 2 || n > 20) return msg.reply("Provide a number between 2 and 20. e.g. `!config spamlimit 6`");
        cfg.automod.spamLimit = n;
        msg.reply(`✅ Spam limit set to **${n} messages**.`);
        break;
      }

      case "badwords": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config badwords off`");
        cfg.automod.filterBadWords = val === "on";
        msg.reply(`✅ Bad word filter is now **${val}**.`);
        break;
      }

      case "badword": {
        const action = args[1]?.toLowerCase();
        const word = args[2]?.toLowerCase();
        if (!["add","remove"].includes(action) || !word) {
          return msg.reply("Usage: `!config badword add <word>` or `!config badword remove <word>`");
        }
        if (action === "add") {
          if (cfg.badWords.includes(word)) return msg.reply(`\`${word}\` is already in the list.`);
          cfg.badWords.push(word);
          msg.reply(`✅ Added \`${word}\` to the bad word list.`);
        } else {
          const idx = cfg.badWords.indexOf(word);
          if (idx === -1) return msg.reply(`\`${word}\` is not in the list.`);
          cfg.badWords.splice(idx, 1);
          msg.reply(`✅ Removed \`${word}\` from the bad word list.`);
        }
        break;
      }

      case "newaccount": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`. e.g. `!config newaccount off`");
        cfg.automod.newAccountProtection = val === "on";
        msg.reply(`✅ New account protection is now **${val}**.`);
        break;
      }

      case "newaccountdays": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 1 || n > 365) return msg.reply("Provide days between 1 and 365. e.g. `!config newaccountdays 14`");
        cfg.automod.newAccountDays = n;
        msg.reply(`✅ New account threshold set to **${n} days**.`);
        break;
      }

      default: {
        msg.reply([
          "**⚙️ Config Commands**",
          "`!config show` — view all settings",
          "`!config prefix <char>` — change command prefix",
          "`!config aichat <on|off>` — toggle AI chat on mention",
          "`!config automod <on|off>` — toggle all auto-mod",
          "`!config invites <on|off>` — toggle invite blocking",
          "`!config spam <on|off>` — toggle anti-spam",
          "`!config spamlimit <n>` — messages before spam trigger",
          "`!config badwords <on|off>` — toggle bad word filter",
          "`!config badword add/remove <word>` — edit word list",
          "`!config newaccount <on|off>` — toggle new account protection",
          "`!config newaccountdays <n>` — minimum account age in days",
        ].join("\n"));
      }
    }

    return true;
  },
};
