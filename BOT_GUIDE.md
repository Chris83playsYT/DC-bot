# Weird Guy Bot Guide

Weird Guy is a Discord bot for useful server tools, harmless chaos, AI chat, moderation, leveling, and VIP features.

## Prefixes

Both prefixes work everywhere:

```text
!wg <command>
,wg <command>
```

Example:

```text
!wg help
,wg botinfo
```

Server administrators can set an additional custom prefix with `,wgconfig prefix <prefix>`. The two standard prefixes always remain available.

## Start here

- `!wg help` — full command menu
- `!wg botinfo` or `!wg about` — what Weird Guy does
- Mention `@Weird Guy` — chat with the AI
- `!wg aimode <mode>` — choose an AI personality (administrator)
- `!wg rank` — view XP and level
- `!wg leaderboard` — server leaderboard

## Fun commands

Try `8ball`, `coinflip`, `roll`, `joke`, `roast`, `compliment`, `rps`, `choose`, `ship`, `rate`, `fight`, `trivia`, `truth`, `dare`, `wyr`, `mock`, `reverse`, `clap`, `uwu`, `emojify`, `calc`, `vibecheck`, `rizz`, `vibe`, `highfive`, `hug`, and `slap`.

Examples:

```text
,wg roll 20
,wg ship @Alex @Sam
,wg trivia
,wg emojify weekend plans
```

## Premium / VIP

Premium users can use `vipmenu`, `fortune`, `vip`, `advice`, `story`, `oracle`, `daily`, `aura`, `compat`, `vipstats`, `heist`, and `quote`.

The real owner grants VIP access with:

```text
,wgowner premium add @user
```

## Administration

Administrators can use moderation commands such as `kick`, `ban`, `softban`, `unban`, `mute`, `timeout`, `warn`, `warnings`, `unwarn`, `clearwarns`, `clear`, `purge`, `slowmode`, `lock`, `unlock`, `lockall`, `unlockall`, `nuke`, `dehoist`, `role`, `modnote`, `notes`, and `raidmode`.

Useful diagnostics:

- `!wg permissions` — verify the bot's Discord permissions
- `!wg rolelist` — list server roles
- `!wg audit` — moderation and feature snapshot
- `!wg serverstats` — member/channel/boost statistics
- `!wg channelinfo` — inspect a channel
- `!wg config` — view this server's isolated settings

## Owner controls

Owner commands require the Discord application owner and the private `OWNER_PASSWORD` secret. The password prompt and password response are deleted immediately when Discord permissions allow message deletion.

```text
,wgowner health
,wgowner overview
,wgowner whoami
,wgowner status playing Weird Guy
,wgowner confetti
,wgowner roast @user
,wgowner praise @user
,wgowner prank @user
,wgowner dice 20
,wgowner announce <message>
,wgowner say <message>
,wgowner delegate add @user 2h status chaos
,wgowner premium add @user
```

Global owner controls never change a server's local AI, moderation, prefix, or leveling settings.

## AI response lengths

Administrators can configure server-specific AI length:

```text
,wgconfig response short
,wgconfig response normal
,wgconfig response paragraph
```

## Keeping the bot online

The repository includes `render.yaml` for an always-on Render Worker. Set `TOKEN`, `OWNER_PASSWORD`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`, and `AI_INTEGRATIONS_OPENROUTER_BASE_URL` in Render's environment settings. The bot uses external process supervision rather than restarting itself in a loop.