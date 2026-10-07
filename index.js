const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");

const config = require("./config");
const guildConfig = require("./src/utils/guildConfig");
const statsTracker = require("./src/utils/statsTracker");
const snipe = require("./src/commands/utility/snipe");

function logAction(message) {
  const date = new Date().toISOString();
  console.log(`[${date}] ${message}`);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.prefix = config.prefix;
client.config = config;

require("./src/structure/commandHandler")(client);
require("./src/structure/slashCommandHandler")(client);
require("./src/structure/eventHandler")(client);

snipe.init(client);

const invitesCache = new Map();
const voiceSessions = new Map();

async function registerSlashCommands() {
  const commands = [];

  client.slashCommands.forEach(command => {
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  });

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: commands,
      }
    );

    console.log(
      `✅ ${commands.length} slash commands enregistrées globalement.`
    );
  } catch (error) {
    console.error(
      "❌ Impossible d'enregistrer les slash commands :",
      error
    );
  }
}

async function findUsedInvite(guild) {
  if (!guild) return null;

  let newInvites;

  try {
    newInvites = await guild.invites.fetch();
  } catch {
    return null;
  }

  const cached = invitesCache.get(guild.id);
  let used = null;

  if (cached) {
    newInvites.forEach((inv) => {
      const oldUses = cached.get(inv.code) || 0;

      if (inv.uses > oldUses) {
        used = inv;
      }
    });
  }

  invitesCache.set(
    guild.id,
    new Map(newInvites.map((i) => [i.code, i.uses]))
  );

  return used;
}

async function getBotAdder(guild, botId) {
  try {
    const logs = await guild.fetchAuditLogs({
      type: 28,
      limit: 5,
    });

    const entry = logs.entries.find(
      (e) => e.target?.id === botId
    );

    return entry?.executor || null;
  } catch {
    return null;
  }
}

client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  await registerSlashCommands();

  client.guilds.cache.forEach(async (guild) => {
    try {
      const invites = await guild.invites.fetch();

      invitesCache.set(
        guild.id,
        new Map(invites.map((i) => [i.code, i.uses]))
      );
    } catch {
      invitesCache.set(guild.id, new Map());
    }
  });
});

client.on("presenceUpdate", async (_, newPresence) => {
  const member = newPresence?.member;

  if (!member || !member.guild || member.user.bot) {
    return;
  }

  if (!client.checkMember) {
    return;
  }

  const cfg = guildConfig.getAll(member.guild.id);

  if (!cfg.soutienRoleId || !cfg.soutienStatut) {
    return;
  }

  await client.checkMember(
    member,
    cfg,
    newPresence
  ).catch(() => {});
});

client.on("guildMemberAdd", async (member) => {
  const cfg = guildConfig.getAll(member.guild.id);

  const memberCount = member.guild.memberCount;

  const welcomeMessage =
    `<a:cat:1548633716677677066> Bienvenue ${member} sur **${member.guild.name}** !\n` +
    `> <a:mario_spinning_star:1554974593867976804> Nous sommes maintenant **${memberCount} membres** sur le serveur.\n\n` +
    `> <a:Chat_MyFriendForever:1528327830511947896> \`/bloxet\` en statut pour perm image.\n` +
    `> <:regle:1554975038694883350> Je t'invite à lire le règlement dans <#1543748916552663070> afin d'éviter toute sanction, et à récupérer tes rôles dans <id:customize>`;

  if (cfg.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(
      cfg.welcomeChannelId
    );

    if (channel) {
      let content = welcomeMessage;

      if (cfg.welcomePingRoleId) {
        content =
          `<@&${cfg.welcomePingRoleId}>\n\n` +
          welcomeMessage;
      }

      channel
        .send({
          content,
          allowedMentions: {
            users: [member.id],
            roles: cfg.welcomePingRoleId
              ? [cfg.welcomePingRoleId]
              : [],
          },
        })
        .catch(() => {});
    }
  }

  if (cfg.logChannelId) {
    const logChannel = member.guild.channels.cache.get(
      cfg.logChannelId
    );

    if (logChannel) {
      logChannel
        .send(`📥 ${member} a rejoint le serveur`)
        .catch(() => {});
    }
  }

  if (cfg.welcomeRoleId) {
    const role = member.guild.roles.cache.get(
      cfg.welcomeRoleId
    );

    if (role) {
      member.roles.add(role).catch(() => {});
    }
  }
});

client.on("guildMemberRemove", async (member) => {
  const cfg = guildConfig.getAll(member.guild.id);

  if (!cfg.logChannelId) return;

  const logChannel = member.guild.channels.cache.get(
    cfg.logChannelId
  );

  if (!logChannel) return;

  const memberCount = member.guild.memberCount;

  const leaveEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle(
      `${member.user.tag} nous a quitté...`
    )
    .setDescription(
      `Il reste **${memberCount} membres** sur le serveur.`
    )
    .setThumbnail(
      member.user.displayAvatarURL({
        dynamic: true,
      })
    )
    .setFooter({
      text: member.guild.name,
      iconURL: member.guild.iconURL({
        dynamic: true,
      }),
    });

  logChannel
    .send({
      embeds: [leaveEmbed],
    })
    .catch(() => {});
});

function formatLog(type, message, extra = "") {
  const date = new Date().toISOString();

  const guildName = message.guild
    ? message.guild.name
    : "DM";

  const author = message.author
    ? message.author.tag
    : "Inconnu";

  const content =
    message.content || "[Pas de contenu]";

  console.log(
    `[${date}] [${type}] [${guildName}] ${author} : ${content} ${extra}`
  );
}

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  formatLog("ENVOYÉ", message);

  statsTracker.addMessage(message);
});

client.on("messageDelete", (message) => {
  if (!message.author || message.author.bot) return;

  formatLog("SUPPRIMÉ", message);
});

client.on(
  "messageUpdate",
  (oldMessage, newMessage) => {
    if (!newMessage.author || newMessage.author.bot) {
      return;
    }

    const oldContent =
      oldMessage.content || "[Pas de contenu]";

    const newContent =
      newMessage.content || "[Pas de contenu]";

    const date = new Date().toISOString();

    const guildName = newMessage.guild
      ? newMessage.guild.name
      : "DM";

    const author = newMessage.author.tag;

    console.log(
      `[${date}] [MODIFIÉ] [${guildName}] ${author}\n` +
        `Ancien : ${oldContent}\n` +
        `Nouveau : ${newContent}`
    );
  }
);

client.on(
  "voiceStateUpdate",
  (oldState, newState) => {
    const member =
      newState.member || oldState.member;

    if (!member || member.user.bot) return;

    const key =
      `${member.guild.id}:${member.id}`;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (!oldChannelId && newChannelId) {
      voiceSessions.set(key, {
        guildId: member.guild.id,
        userId: member.id,
        channelId: newChannelId,
        startedAt: Date.now(),
      });

      return;
    }

    if (oldChannelId && !newChannelId) {
      const session = voiceSessions.get(key);

      if (session) {
        statsTracker.addVoiceSession({
          guildId: session.guildId,
          userId: session.userId,
          channelId: session.channelId,
          startedAt: session.startedAt,
          endedAt: Date.now(),
        });

        voiceSessions.delete(key);
      }

      return;
    }

    if (
      oldChannelId &&
      newChannelId &&
      oldChannelId !== newChannelId
    ) {
      const session = voiceSessions.get(key);

      if (session) {
        statsTracker.addVoiceSession({
          guildId: session.guildId,
          userId: member.id,
          channelId: session.channelId,
          startedAt: session.startedAt,
          endedAt: Date.now(),
        });
      }

      voiceSessions.set(key, {
        guildId: member.guild.id,
        userId: member.id,
        channelId: newChannelId,
        startedAt: Date.now(),
      });
    }
  }
);

process.stdin.setEncoding("utf8");
process.stdin.resume();

process.stdin.on("data", async (data) => {
  const message = data.toString().trim();

  if (!message) return;

  try {
    const channel = await client.channels.fetch(
      "1485010294211219476"
    );

    if (!channel) {
      return logAction("Salon introuvable");
    }

    await channel.send(message);
  } catch (err) {
    console.error(err);
  }
});

process.on("unhandledRejection", (reason) => {
  logAction(`Rejet non géré : ${reason}`);
});

process.on("SIGINT", () => {
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  client.destroy();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ [Anti-Crash] Rejet non géré :", reason);
});

process.on("uncaughtException", (err, origin) => {
  console.error("⚠️ [Anti-Crash] Exception non capturée :", err);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.error("⚠️ [Anti-Crash] Surveillance d'exception :", err);
});

process.on("warning", (warning) => {
  console.warn(
    "⚠️ [Avertissement] :",
    warning.name,
    warning.message
  );
});

client.login(config.token);
