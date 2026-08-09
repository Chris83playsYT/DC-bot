const config = require("../handlers/config");
const security = require("../handlers/security");
const storage = require("../handlers/storage");

function canConfigure(member) {
  return security.isGuildAdmin(member);
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
        config.setPrefix(msg.guild.id, p);
        msg.reply(`✅ Prefix set to \`${p}\``);
        break;
      }

      case "aichat": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.aiChat = val === "on";
        storage.save();
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
        storage.save();
        msg.reply(`✅ Auto-mod is now **${val}**.`);
        break;
      }

      case "invites": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.blockInvites = val === "on";
        storage.save();
        msg.reply(`✅ Invite blocking is now **${val}**.`);
        break;
      }

      case "spam": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.antiSpam = val === "on";
        storage.save();
        msg.reply(`✅ Anti-spam is now **${val}**.`);
        break;
      }

      case "spamlimit": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 2 || n > 20) return msg.reply("Provide 2–20.");
        cfg.automod.spamLimit = n;
        storage.save();
        msg.reply(`✅ Spam limit set to **${n} messages**.`);
        break;
      }

      case "badwords": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.filterBadWords = val === "on";
        storage.save();
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
          storage.save();
          msg.reply(`✅ Added \`${word}\`.`);
        } else {
          const idx = cfg.badWords.indexOf(word);
          if (idx === -1) return msg.reply(`\`${word}\` not found.`);
          cfg.badWords.splice(idx, 1);
          storage.save();
          msg.reply(`✅ Removed \`${word}\`.`);
        }
        break;
      }

      case "newaccount": {
        const val = args[1]?.toLowerCase();
        if (!["on","off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.automod.newAccountProtection = val === "on";
        storage.save();
        msg.reply(`✅ New account protection is now **${val}**.`);
        break;
      }

      case "newaccountdays": {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 1 || n > 365) return msg.reply("Provide 1–365 days.");
        cfg.automod.newAccountDays = n;
        storage.save();
        msg.reply(`✅ New account threshold set to **${n} days**.`);
        break;
      }

      case "maxmentions": {
        const n = parseInt(args[1], 10);
        if (!Number.isInteger(n) || n < 2 || n > 20) return msg.reply("Provide a limit from 2–20 mentions.");
        cfg.automod.maxMentions = n;
        storage.save();
        return msg.reply(`✅ Mention protection set to **${n} mentions** per message.`);
      }

      case "adminrole": {
        const action = args[1]?.toLowerCase();
        const role = msg.mentions.roles?.first();
        if (!["add", "remove"].includes(action) || !role) {
          return msg.reply("Usage: `,wgconfig adminrole add @role` or `remove @role`.");
        }
        if (action === "add" && !role.permissions.has("Administrator")) {
          return msg.reply("That role does not have Discord's **Administrator** permission. Choose a role that does.");
        }
        if (action === "add") {
          config.addAdminRole(msg.guild.id, role.id);
          return msg.reply(`✅ **${role.name}** can now use server admin commands.`);
        }
        config.removeAdminRole(msg.guild.id, role.id);
        return msg.reply(`✅ Removed **${role.name}** from the bot admin role list.`);
      }

      case "levels": {
        const val = args[1]?.toLowerCase();
        if (!["on", "off"].includes(val)) return msg.reply("Use `on` or `off`.");
        cfg.levels.enabled = val === "on";
        storage.save();
        return msg.reply(`✅ Server leveling is now **${val}**.`);
      }

      case "levelchannel": {
        const val = args[1]?.toLowerCase();
        if (val === "off" || val === "none") {
          cfg.levels.levelUpChannelId = null;
          storage.save();
          return msg.reply("✅ Level-up announcements will use the active channel.");
        }
        const channel = msg.mentions.channels?.first();
        if (!channel) return msg.reply("Mention a channel or use `off`.");
        cfg.levels.levelUpChannelId = channel.id;
        storage.save();
        return msg.reply(`✅ Level-up announcements will go to <#${channel.id}>.`);
      }

      case "xpcooldown": {
        const n = parseInt(args[1], 10);
        if (!Number.isInteger(n) || n < 5 || n > 3600) return msg.reply("Provide a cooldown from 5–3600 seconds.");
        cfg.levels.xpCooldownSeconds = n;
        storage.save();
        return msg.reply(`✅ XP cooldown set to **${n} seconds**.`);
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
           "`adminrole add/remove @role` — allow a specific role to manage the bot",
           "`levels <on|off>` — toggle per-server leveling",
           "`levelchannel #channel|off` — choose level-up announcements",
           "`xpcooldown <seconds>` — set message XP cooldown",
           "`maxmentions <2–20>` — block mention spam",
        ].join("\n"));
      }
    }

    return true;
  },
};
