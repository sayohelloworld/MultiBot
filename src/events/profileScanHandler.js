const {
  Client,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags
} = require('discord.js');

const guildConfig = require('../utils/guildConfig');
const profileScanner = require('../utils/profileScanner');
const scanProfilLeaderboard = require('../utils/scanProfilLeaderboard');

let leaderboardInitialized = false;

function createProfileContainer(scan, includeLikeButton = false) {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2);

  if (scan.bannerURL) {
    const gallery = new MediaGalleryBuilder();

    gallery.addItems(
      new MediaGalleryItemBuilder()
        .setURL(scan.bannerURL)
    );

    container.addMediaGalleryComponents(gallery);

    container.addSeparatorComponents(
      new SeparatorBuilder()
    );
  }

  const profileText =
    `# 🔍・Scan du profil\n\n` +
    `**@${scan.username}**\n` +
    `${scan.globalName ? `**${scan.globalName}**\n` : ''}` +
    `ID : \`${scan.userId}\`\n\n` +
    `👤 **Username** : **${scan.usernameScore}/10**\n` +
    `📖 **Meaning** : **${scan.meaningScore ?? 0}/10**\n` +
    `🏅 **Badges** : **${scan.badgesScore}/10**\n` +
    `📅 **Account Age** : **${scan.accountAgeScore}/10**\n` +
    `⭐ **SCORE FINAL : ${scan.finalScore}/10**\n\n` +
    `🏅 **Badges détectés :**\n` +
    `${scan.badges?.length ? scan.badges.map(badge => `• ${badge.name}`).join('\n') : 'Aucun badge public'}\n\n` +
    `📅 **Compte créé :** <t:${Math.floor(new Date(scan.createdAt || scan.createdTimestamp || Date.now()).getTime() / 1000)}:D>\n\n` +
    `❤️ **${scan.likes || 0} like${(scan.likes || 0) > 1 ? 's' : ''}**`;

  if (scan.avatarURL) {
    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(profileText)
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(scan.avatarURL)
      );

    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(profileText)
    );
  }

  container.addSeparatorComponents(
    new SeparatorBuilder()
  );

  if (includeLikeButton) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`scan_profil_like:${scan.userId}`)
          .setLabel(`J'aime • ${scan.likes || 0}`)
          .setEmoji('❤️')
          .setStyle(ButtonStyle.Primary)
      )
    );
  }

  return container;
}

function createScanStartContainer() {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# 🔍・SCAN DE PROFIL\n\n` +
      `> Analyse automatiquement ton profil Discord et découvre ta note.\n\n` +
      `### 📋 Éléments analysés\n` +
      `👤 **Username**\n` +
      `🏅 **Badges Discord**\n` +
      `📅 **Ancienneté du compte**\n` +
      `💎 **Badge le plus rare**\n` +
      `⭐ **Note finale**\n\n` +
      `Chaque catégorie est évaluée sur **10**.\n\n` +
      `📢 Ton résultat sera également publié dans le salon dédié aux scans.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder()
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('scan_profil_launch')
        .setLabel('Lancer le scan')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Success)
    )
  );

  return container;
}

function getRankMedal(index) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `**${index + 1}.**`;
}

function createLeaderboardContainer(guildId, type) {
  const data = scanProfilLeaderboard.createLeaderboardData(guildId, 10);

  const settings = {
    username: {
      title: '👤・TOP USERNAME',
      description: 'Les meilleurs scores de noms d’utilisateur du serveur.',
      list: data.username,
      property: 'usernameScore',
      color: 0x5865F2
    },
    badges: {
      title: '🏅・TOP BADGES',
      description: 'Les profils ayant obtenu les meilleurs scores de badges.',
      list: data.badges,
      property: 'badgesScore',
      color: 0xF1C40F
    },
    final: {
      title: '⭐・TOP NOTES FINALES',
      description: 'Les profils ayant obtenu les meilleures notes globales.',
      list: data.final,
      property: 'finalScore',
      color: 0x9B59B6
    },
    likes: {
      title: '❤️・TOP LIKES',
      description: 'Les profils ayant reçu le plus de likes.',
      list: data.likes,
      property: 'likes',
      color: 0xE74C3C
    }
  };

  const setting = settings[type];

  const container = new ContainerBuilder()
    .setAccentColor(setting.color);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${setting.title}\n\n` +
      `> ${setting.description}\n\n` +
      `👥 **${setting.list.length} profil${setting.list.length > 1 ? 's' : ''} classé${setting.list.length > 1 ? 's' : ''}**`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder()
  );

  if (!setting.list.length) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📭 **Aucun profil scanné pour le moment.**\n\n` +
        `Lance un scan pour apparaître dans ce classement.`
      )
    );

    return container;
  }

  const galleryEntries = setting.list
    .slice(0, 3)
    .filter(entry => entry.avatarURL);

  if (galleryEntries.length) {
    const gallery = new MediaGalleryBuilder();

    for (const entry of galleryEntries) {
      gallery.addItems(
        new MediaGalleryItemBuilder()
          .setURL(entry.avatarURL)
      );
    }

    container.addMediaGalleryComponents(gallery);

    container.addSeparatorComponents(
      new SeparatorBuilder()
    );
  }

  const lines = setting.list.map((entry, index) => {
    const medal = getRankMedal(index);

    if (type === 'likes') {
      const likes = entry.likes || 0;

      return `${medal} <@${entry.userId}> — ❤️ **${likes} like${likes > 1 ? 's' : ''}**`;
    }

    return `${medal} <@${entry.userId}> — **${entry[setting.property]} / 10**`;
  });

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      lines.join('\n')
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder()
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🔄 *Classement mis à jour automatiquement après chaque scan.*`
    )
  );

  return container;
}

async function updateLeaderboard(guild) {
  const config = guildConfig.getAll(guild.id);
  const scanConfig = config.scanProfilConfig;

  if (!scanConfig?.leaderboardChannelId) {
    return;
  }

  const channel =
    guild.channels.cache.get(scanConfig.leaderboardChannelId) ||
    await guild.channels.fetch(scanConfig.leaderboardChannelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return;
  }

  const types = [
    {
      type: 'username',
      key: 'leaderboardUsernameMessageId'
    },
    {
      type: 'badges',
      key: 'leaderboardBadgesMessageId'
    },
    {
      type: 'final',
      key: 'leaderboardFinalMessageId'
    },
    {
      type: 'likes',
      key: 'leaderboardLikesMessageId'
    }
  ];

  for (const item of types) {
    const currentConfig = guildConfig.getAll(guild.id);
    const messageId =
      currentConfig.scanProfilConfig?.[item.key];

    const container = createLeaderboardContainer(
      guild.id,
      item.type
    );

    if (messageId) {
      const message = await channel.messages
        .fetch(messageId)
        .catch(() => null);

      if (message) {
        await message.edit({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            parse: []
          }
        });

        continue;
      }
    }

    const newMessage = await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        parse: []
      }
    });

    const saveConfig = guildConfig.getAll(guild.id);

    saveConfig.scanProfilConfig[item.key] = newMessage.id;

    guildConfig.save(
      guild.id,
      saveConfig
    );
  }
}

async function updateExistingProfiles(client) {
  if (!client?.guilds?.cache) {
    return;
  }

  for (const guild of client.guilds.cache.values()) {
    try {
      const config = guildConfig.getAll(guild.id);
      const scanConfig = config.scanProfilConfig;

      if (!scanConfig?.resultChannelId || !scanConfig?.scans) {
        continue;
      }

      const channel =
        guild.channels.cache.get(scanConfig.resultChannelId) ||
        await guild.channels.fetch(scanConfig.resultChannelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        continue;
      }

      for (const scan of Object.values(scanConfig.scans)) {
        if (!scan?.resultMessageId) {
          continue;
        }

        const message = await channel.messages
          .fetch(scan.resultMessageId)
          .catch(() => null);

        if (!message) {
          continue;
        }

        await message.edit({
          components: [
            createProfileContainer(scan, true)
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }
    } catch (error) {
      console.error(
        `[SCAN PROFIL] Erreur lors de la mise à jour des profils pour ${guild.name}:`,
        error
      );
    }
  }
}

async function initializeLeaderboards(client) {
  if (leaderboardInitialized) {
    return;
  }

  if (!client?.guilds?.cache) {
    return;
  }

  leaderboardInitialized = true;

  for (const guild of client.guilds.cache.values()) {
    try {
      const config = guildConfig.getAll(guild.id);

      if (!config.scanProfilConfig?.leaderboardChannelId) {
        continue;
      }

      await updateLeaderboard(guild);
    } catch (error) {
      console.error(
        `[SCAN PROFIL] Erreur lors de la mise à jour des TOP pour ${guild.name}:`,
        error
      );
    }
  }

  await updateExistingProfiles(client);
}

const originalEmit = Client.prototype.emit;

Client.prototype.emit = function(event, ...args) {
  const result = originalEmit.call(this, event, ...args);

  if (event === 'clientReady') {
    setTimeout(() => {
      initializeLeaderboards(this).catch(error => {
        console.error(
          '[SCAN PROFIL] Erreur lors de l’initialisation des TOP:',
          error
        );
      });
    }, 1000);
  }

  return result;
};

async function publishProfile(guild, scan) {
  const config = guildConfig.getAll(guild.id);
  const scanConfig = config.scanProfilConfig;

  if (!scanConfig?.resultChannelId) {
    return;
  }

  const channel =
    guild.channels.cache.get(scanConfig.resultChannelId) ||
    await guild.channels.fetch(scanConfig.resultChannelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return;
  }

  const container = createProfileContainer(scan, true);
  const previousMessageId = scan.resultMessageId;

  if (previousMessageId) {
    const previousMessage = await channel.messages
      .fetch(previousMessageId)
      .catch(() => null);

    if (previousMessage) {
      await previousMessage.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      return previousMessage;
    }
  }

  const message = await channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });

  const updatedConfig = guildConfig.getAll(guild.id);

  if (!updatedConfig.scanProfilConfig.scans[scan.userId]) {
    updatedConfig.scanProfilConfig.scans[scan.userId] = scan;
  }

  updatedConfig.scanProfilConfig.scans[scan.userId].resultMessageId =
    message.id;

  guildConfig.save(guild.id, updatedConfig);

  return message;
}

module.exports = {
  name: 'profileScanHandler',

  async execute(interaction) {
    if (!interaction.isButton()) {
      return;
    }

    if (!interaction.guild) {
      return;
    }

    const customId = interaction.customId;

    if (
      customId !== 'scan_profil_start' &&
      customId !== 'scan_profil_launch' &&
      !customId.startsWith('scan_profil_like:')
    ) {
      return;
    }

    const config = guildConfig.getAll(interaction.guild.id);
    const scanConfig = config.scanProfilConfig;

    if (!scanConfig?.enabled) {
      return interaction.reply({
        content: '❌ Le système de scan de profils est actuellement désactivé.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (customId === 'scan_profil_start') {
      return interaction.reply({
        components: [createScanStartContainer()],
        flags:
          MessageFlags.IsComponentsV2 |
          MessageFlags.Ephemeral
      });
    }

    if (customId === 'scan_profil_launch') {
      await interaction.deferUpdate();

      try {
        const scan = await profileScanner.scan(
          interaction.user
        );

        const savedScan =
          scanProfilLeaderboard.saveScan(
            interaction.guild.id,
            scan
          );

        await interaction.editReply({
          components: [
            createProfileContainer(savedScan, false)
          ],
          flags:
            MessageFlags.IsComponentsV2 |
            MessageFlags.Ephemeral
        });

        const publicScan =
          scanProfilLeaderboard.getScan(
            interaction.guild.id,
            interaction.user.id
          );

        if (publicScan) {
          await publishProfile(
            interaction.guild,
            publicScan
          );
        }

        await updateLeaderboard(
          interaction.guild
        );
      } catch (error) {
        console.error(
          '[SCAN PROFIL] Erreur pendant le scan :',
          error
        );

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245);

        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '# ❌・ERREUR DU SCAN\n\n' +
            'Une erreur est survenue pendant l’analyse de votre profil.\n\n' +
            '🔄 **Veuillez réessayer dans quelques instants.**'
          )
        );

        await interaction.editReply({
          components: [errorContainer],
          flags:
            MessageFlags.IsComponentsV2 |
            MessageFlags.Ephemeral
        });
      }

      return;
    }

    if (customId.startsWith('scan_profil_like:')) {
      const profileUserId = customId.split(':')[1];

      if (!profileUserId) {
        return interaction.reply({
          content: '❌ Profil invalide.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (profileUserId === interaction.user.id) {
        return interaction.reply({
          content: '❌ Vous ne pouvez pas liker votre propre profil.',
          flags: MessageFlags.Ephemeral
        });
      }

      const profile =
        scanProfilLeaderboard.getScan(
          interaction.guild.id,
          profileUserId
        );

      if (!profile) {
        return interaction.reply({
          content: '❌ Ce profil n’existe plus dans les profils scannés.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (
        scanProfilLeaderboard.hasLiked(
          interaction.guild.id,
          profileUserId,
          interaction.user.id
        )
      ) {
        return interaction.reply({
          content: '❌ Vous avez déjà liké ce profil.',
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      const like =
        scanProfilLeaderboard.addLike(
          interaction.guild.id,
          profileUserId,
          interaction.user.id
        );

      if (!like.success) {
        return interaction.editReply({
          content:
            like.reason === 'ALREADY_LIKED'
              ? '❌ Vous avez déjà liké ce profil.'
              : '❌ Impossible d’ajouter votre like.'
        });
      }

      const updatedProfile =
        scanProfilLeaderboard.getScan(
          interaction.guild.id,
          profileUserId
        );

      if (updatedProfile?.resultMessageId) {
        const resultChannel =
          interaction.guild.channels.cache.get(
            scanConfig.resultChannelId
          ) ||
          await interaction.guild.channels.fetch(
            scanConfig.resultChannelId
          ).catch(() => null);

        if (resultChannel?.isTextBased()) {
          const profileMessage =
            await resultChannel.messages
              .fetch(updatedProfile.resultMessageId)
              .catch(() => null);

          if (profileMessage) {
            await profileMessage.edit({
              components: [
                createProfileContainer(updatedProfile, true)
              ],
              flags: MessageFlags.IsComponentsV2
            });
          }
        }
      }

      if (scanConfig.resultChannelId) {
        const resultChannel =
          interaction.guild.channels.cache.get(
            scanConfig.resultChannelId
          ) ||
          await interaction.guild.channels.fetch(
            scanConfig.resultChannelId
          ).catch(() => null);

        if (resultChannel?.isTextBased()) {
          await resultChannel.send({
            content:
              `❤️ <@${profileUserId}> tu as reçu un like de <@${interaction.user.id}> !`,
            allowedMentions: {
              users: [
                profileUserId,
                interaction.user.id
              ]
            }
          });
        }
      }

      await updateLeaderboard(
        interaction.guild
      );

      return interaction.editReply({
        content:
          `❤️ Like ajouté ! Ce profil possède maintenant **${like.likes}** like${like.likes > 1 ? 's' : ''}.`
      });
    }
  }
};
