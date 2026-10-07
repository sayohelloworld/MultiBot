const {
  ActivityType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const guildConfig = require('../utils/guildConfig');
const pointsCommand = require('../commands/points/points');
const config = require('../../config');

const statuses = [
  '+help'
];

let currentStatus = 0;

function updateStatus(client) {
  const status = statuses[currentStatus];

  client.user.setPresence({
    activities: [
      {
        name: status,
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/xbloxet'
      }
    ],
    status: 'online'
  });

  currentStatus = (currentStatus + 1) % statuses.length;
}

function getCustomStatus(presence) {
  if (!presence || !presence.activities) {
    return null;
  }

  const activity = presence.activities.find(
    activity => activity.type === ActivityType.Custom
  );

  if (!activity) {
    return '';
  }

  return activity.state || '';
}

async function checkMember(member, guildSettings, presence = member.presence) {
  if (!member || member.user.bot) {
    return;
  }

  const statut = guildSettings.soutienStatut;
  const roleId = guildSettings.soutienRoleId;

  if (!statut || !roleId) {
    return;
  }

  if (!presence) {
    return;
  }

  const customStatus = getCustomStatus(presence);

  if (customStatus === null) {
    return;
  }

  const hasStatus = customStatus.includes(statut);
  const hasRole = member.roles.cache.has(roleId);

  if (hasStatus && !hasRole) {
    try {
      await member.roles.add(
        roleId,
        `Statut soutien détecté : ${statut}`
      );

      console.log(
        `[SOUTIEN] ${member.user.tag} -> rôle ajouté`
      );
    } catch (error) {
      console.error(
        `[SOUTIEN] Erreur ajout ${member.user.tag}: ${error.message}`
      );
    }

    return;
  }

  if (!hasStatus && hasRole) {
    try {
      await member.roles.remove(
        roleId,
        `Statut soutien absent : ${statut}`
      );

      console.log(
        `[SOUTIEN] ${member.user.tag} -> rôle retiré`
      );
    } catch (error) {
      console.error(
        `[SOUTIEN] Erreur retrait ${member.user.tag}: ${error.message}`
      );
    }
  }
}

async function scanGuild(guild) {
  const guildSettings = guildConfig.getAll(guild.id);

  if (!guildSettings.soutienRoleId || !guildSettings.soutienStatut) {
    return;
  }

  console.log(
    `[SOUTIEN] Scan de ${guild.name} (${guild.id})`
  );

  try {
    const members = await guild.members.fetch({
      withPresences: true
    });

    let checked = 0;
    let withPresence = 0;

    for (const member of members.values()) {
      checked++;

      if (!member.presence) {
        continue;
      }

      withPresence++;

      await checkMember(
        member,
        guildSettings,
        member.presence
      );
    }

    console.log(
      `[SOUTIEN] ${guild.name} : ${checked} membres analysés, ${withPresence} présences reçues`
    );
  } catch (error) {
    console.error(
      `[SOUTIEN] Erreur scan ${guild.name}: ${error.message}`
    );
  }
}

async function fullScan(client) {
  console.log(
    `[SOUTIEN] Début du scan global : ${client.guilds.cache.size} serveur(s)`
  );

  for (const guild of client.guilds.cache.values()) {
    await scanGuild(guild);
  }

  console.log('[SOUTIEN] Scan global terminé');
}

async function createServerInvite(guild) {
  try {
    const channels = guild.channels.cache
      .filter(channel =>
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement
      )
      .sort((a, b) => a.rawPosition - b.rawPosition);

    for (const channel of channels.values()) {
      const permissions = channel.permissionsFor(guild.members.me);

      if (
        permissions &&
        permissions.has(PermissionFlagsBits.CreateInstantInvite)
      ) {
        try {
          const invite = await channel.createInvite({
            maxAge: 0,
            maxUses: 0,
            unique: true,
            reason: 'Invitation créée automatiquement pour le propriétaire du bot'
          });

          return invite.url;
        } catch {}
      }
    }
  } catch {}

  return null;
}

async function notifyBotOwner(client, guild) {
  const ownerId = config.ownerId;

  if (!ownerId) {
    console.error(
      '[GuildCreate] ownerId absent du config.js'
    );
    return;
  }

  try {
    const botOwner = await client.users.fetch(ownerId);

    const serverOwner = await guild.fetchOwner().catch(() => null);

    const inviteUrl = await createServerInvite(guild);

    const iconUrl = guild.iconURL({
      extension: 'png',
      size: 1024
    });

    const bannerUrl = guild.bannerURL({
      extension: 'png',
      size: 2048
    });

    const serverOwnerText = serverOwner
      ? `${serverOwner.user.tag}\n\`${serverOwner.id}\``
      : 'Impossible de récupérer le propriétaire';

    const inviteText = inviteUrl
      ? `[Ouvrir l'invitation](${inviteUrl})`
      : 'Impossible de créer une invitation';

    const serverSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ${guild.name}\n` +
          `**ID :** \`${guild.id}\`\n` +
          `**Membres :** ${guild.memberCount}\n\n` +
          `**Propriétaire :**\n${serverOwnerText}\n\n` +
          `**Invitation :**\n${inviteText}`
        )
      );

    if (iconUrl) {
      serverSection.setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(iconUrl)
          .setDescription(`Avatar de ${guild.name}`)
      );
    }

    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# J'ai rejoint un serveur\n` +
          `Un nouveau serveur vient de m'ajouter.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addSectionComponents(
        serverSection
      );

    if (bannerUrl) {
      container
        .addSeparatorComponents(
          new SeparatorBuilder()
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
              .setURL(bannerUrl)
              .setDescription(`Bannière de ${guild.name}`)
          )
        );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Serveur :** ${guild.name}\n` +
          `**Serveur ID :** \`${guild.id}\`\n` +
          `**Owner :** ${serverOwner ? `<@${serverOwner.id}>` : 'Inconnu'}`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`leave_server_${guild.id}`)
            .setLabel('Quitter le serveur')
            .setStyle(ButtonStyle.Danger)
        )
      );

    await botOwner.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    console.log(
      `[GuildCreate] Notification envoyée au propriétaire du bot pour ${guild.name}`
    );
  } catch (error) {
    console.error(
      `[GuildCreate] Impossible de notifier le propriétaire du bot : ${error.message}`
    );
  }
}

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    console.log(
      `Bot prêt (${client.user.tag}) — ${client.guilds.cache.size} serveur(s)`
    );

    client.checkMember = checkMember;

    updateStatus(client);

    setInterval(
      () => updateStatus(client),
      5000
    );

    await fullScan(client);

    setInterval(
      () => fullScan(client),
      3 * 60 * 1000
    );

    if (pointsCommand.startLeaderboardUpdater) {
      pointsCommand.startLeaderboardUpdater(client);
    }

    client.on('guildCreate', async (guild) => {
      await notifyBotOwner(client, guild);
      await scanGuild(guild);
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (!interaction.customId.startsWith('leave_server_')) {
        return;
      }

      if (interaction.user.id !== config.ownerId) {
        await interaction.reply({
          content: 'Vous n’êtes pas autorisé à utiliser ce bouton.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});

        return;
      }

      const guildId = interaction.customId.replace(
        'leave_server_',
        ''
      );

      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        await interaction.reply({
          content: 'Le bot n’est plus présent sur ce serveur.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});

        return;
      }

      const guildName = guild.name;

      try {
        await guild.leave();

        await interaction.update({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `# Serveur quitté\n` +
                  `J'ai quitté **${guildName}**.\n\n` +
                  `\`${guildId}\``
                )
              )
          ],
          flags: MessageFlags.IsComponentsV2
        });

        console.log(
          `[GuildCreate] Bot retiré de ${guildName} sur demande du propriétaire.`
        );
      } catch (error) {
        console.error(
          `[GuildCreate] Impossible de quitter ${guildName}: ${error.message}`
        );

        await interaction.reply({
          content: `Impossible de quitter le serveur : ${error.message}`,
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    });
  }
};
