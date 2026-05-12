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
        if (!p || p.length > 5) return msg.reply("Provide a prefix (1–5 chars). e.g. `,wgconfig prefix !`");
        cfg.prefix = p;
        msg.reply(`✅ Prefix set to \`${p}\``);
        break;
      }

      case "aichat": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.aiChat = val === "on";
        msg.reply(`✅ AI chat on mention is now **${val}**.`);
        break;
      }

      case "aimode": {
        const mode = args[1]?.toLowerCase();
        if (!mode) return msg.reply(`Modes: ${config.VALID_MODES.map(m => `\`${m}\``).join(", ")}`);
        const ok = config.setAiMode(msg.guild.id, mode);
        if (!ok) return msg.reply(`❌ Unknown mode. Choose: ${config.VALID_MODES.map(m => `\`${m}\``).join(", ")}`);
        msg.reply(`✅ AI mode set to **${mode}**.`);
        break;
      }

      case "logchannel": {
        const val = args[1]?.toLowerCase();
        if (val === "off" || val === "none") {
          config.setLogChannel(msg.guild.id, null);
          return msg.reply("✅ Mod logging disabled.");
        }
        const channel = msg.mentions.channels?.first();
        if (!channel) return msg.reply("Mention a channel or use `off`. e.g. `,wgconfig logchannel #mod-logs`");
        config.setLogChannel(msg.guild.id, channel.id);
        msg.reply(`✅ Mod actions will now be logged in <#${channel.id}>.`);
        break;
      }

      case "automod": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.enabled = val === "on";
        msg.reply(`✅ Auto-mod is now **${val}**.`);
        break;
      }

      case "invites": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.blockInvites = val === "on";
        msg.reply(`✅ Invite blocking is now **${val}**.`);
        break;
      }

      case "spam": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.antiSpam = val === "on";
        msg.reply(`✅ Anti-spam is now **${val}**.`);
        break;
      }

      case "spamlimit": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 2 || n > 20) return msg.reply("Provide 2–20.");
        cfg.automod.spamLimit = n;
        msg.reply(`✅ Spam limit set to **${n} messages**.`);
        break;
      }

      case "badwords": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.filterBadWords = val === "on";
        msg.reply(`✅ Bad word filter is now **${val}**.`);
        break;
      }

      case "badword": {
        const action = args[1]?.toLowerCase();
        const word = args[2]?.toLowerCase();
        if (!["add","remove"].includes(action) || !word) {
          return msg.reply("Usage: `,wgconfig badword add <word>` or `remove <word>`");
        }
        if (action === "add") {
          if (cfg.badWords.includes(word)) return msg.reply(`\`${word}\` is already listed.`);
          cfg.badWords.push(word);
          msg.reply(`✅ Added \`${word}\`.`);
        } else {
          const idx = cfg.badWords.indexOf(word);
          if (idx === -1) return msg.reply(`\`${word}\` not found.`);
          cfg.badWords.splice(idx, 1);
          msg.reply(`✅ Removed \`${word}\`.`);
        }
        break;
      }

      case "newaccount": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.newAccountProtection = val === "on";
        msg.reply(`✅ New account protection is now **${val}**.`);
        break;
      }

      case "newaccountdays": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 1 || n > 365) return msg.reply("Provide 1–365 days.");
        cfg.automod.newAccountDays = n;
        msg.reply(`✅ New account threshold set to **${n} days**.`);
        break;
      }

      default: {
        msg.reply([
          "**⚙️ Config Commands** — `,wgconfig [sub]`",
          "`show` — view all settings",
          "`prefix <char>` — change command prefix",
          "`aichat <on|off>` — toggle AI on mention",
          "`aimode <mode>` — change AI personality mode",
          "`logchannel #channel` or `off` — set mod log channel",
          "`automod <on|off>` — toggle all auto-mod",
          "`invites <on|off>` — toggle invite blocking",
          "`spam <on|off>` — toggle anti-spam",
          "`spamlimit <n>` — spam message threshold",
          "`badwords <on|off>` — toggle bad word filter",
          "`badword add/remove <word>` — edit word list",
          "`newaccount <on|off>` — new account protection",
          "`newaccountdays <n>` — minimum account age",
        ].join("\n"));
      }
    }

    return true;
  },
};
