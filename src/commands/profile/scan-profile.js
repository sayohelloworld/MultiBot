const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'scan-profile',
  description: 'Gère le système de scan de profils.',

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour utiliser cette commande.',
        allowedMentions: { repliedUser: false }
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      return message.reply({
        content:
          '**Utilisation du système de scan**\n\n' +
          '`+scan-profile setup` — Envoie ou actualise le panneau\n' +
          '`+scan-profile on` — Active le système\n' +
          '`+scan-profile off` — Désactive le système',
        allowedMentions: { repliedUser: false }
      });
    }

    const config = guildConfig.getAll(message.guild.id);
    const scanConfig = config.scanProfilConfig;

    if (!scanConfig) {
      return message.reply({
        content: '❌ La configuration du scan de profils est introuvable.',
        allowedMentions: { repliedUser: false }
      });
    }

    if (subcommand === 'on') {
      if (
        !scanConfig.infoChannelId ||
        !scanConfig.resultChannelId ||
        !scanConfig.leaderboardChannelId
      ) {
        return message.reply({
          content:
            '❌ Le système n’est pas entièrement configuré.\n\n' +
            'Configurez d’abord les salons avec :\n' +
            '`+scan-profile-config info #salon`\n' +
            '`+scan-profile-config result #salon`\n' +
            '`+scan-profile-config leaderboard #salon`',
          allowedMentions: { repliedUser: false }
        });
      }

      guildConfig.setNested(
        message.guild.id,
        'scanProfilConfig',
        'enabled',
        true
      );

      return message.reply({
        content: '🟢 Le système de scan de profils est maintenant **activé**.',
        allowedMentions: { repliedUser: false }
      });
    }

    if (subcommand === 'off') {
      guildConfig.setNested(
        message.guild.id,
        'scanProfilConfig',
        'enabled',
        false
      );

      return message.reply({
        content: '🔴 Le système de scan de profils est maintenant **désactivé**.',
        allowedMentions: { repliedUser: false }
      });
    }

    if (subcommand === 'setup') {
      if (!scanConfig.infoChannelId) {
        return message.reply({
          content:
            '❌ Aucun salon informatif n’est configuré.\n\n' +
            'Utilisez : `+scan-profile-config info #salon`',
          allowedMentions: { repliedUser: false }
        });
      }

      const channel =
        message.guild.channels.cache.get(scanConfig.infoChannelId) ||
        await message.guild.channels
          .fetch(scanConfig.infoChannelId)
          .catch(() => null);

      if (!channel) {
        return message.reply({
          content: '❌ Le salon informatif configuré est introuvable.',
          allowedMentions: { repliedUser: false }
        });
      }

      if (!channel.isTextBased()) {
        return message.reply({
          content: '❌ Le salon informatif doit être un salon textuel.',
          allowedMentions: { repliedUser: false }
        });
      }

      const SCAN_GIF_URL = 'https://i.imgur.com/tdwu6x6.gif';
      const BUTTON_EMOJI = '🔍';

      const guildIcon = message.guild.iconURL({
        extension: 'png',
        size: 256
      });

      const container = new ContainerBuilder()

      const headerSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '# 🔍 SCAN DE PROFIL\n' +
            '### Analysez votre profil Discord'
          )
        );

      if (guildIcon) {
        headerSection.setThumbnailAccessory(
          new ThumbnailBuilder().setURL(guildIcon)
        );
      }

      container.addSectionComponents(headerSection);

      container.addSeparatorComponents(
        new SeparatorBuilder()
      );

      if (SCAN_GIF_URL) {
        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(SCAN_GIF_URL)
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder()
        );
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '## ✨ Découvrez la rareté de votre profil\n\n' +
          'Le système analyse plusieurs éléments de votre compte Discord afin de générer une note personnalisée sur **10**.\n\n' +
          '### 📊 Éléments analysés\n' +
          '👤 **Username**\n' +
          '🏅 **Badges Discord**\n' +
          '📅 **Ancienneté du compte**\n' +
          '💎 **Badge le plus rare**\n' +
          '⭐ **Note finale**\n\n' +
          '> Chaque catégorie possède sa propre note. Votre résultat sera également publié dans le salon dédié aux scans.'
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder()
      );

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('scan_profil_start')
            .setLabel('Scanner mon profil')
            .setEmoji(BUTTON_EMOJI)
            .setStyle(ButtonStyle.Primary)
        )
      );

      if (scanConfig.infoMessageId) {
        const existingMessage = await channel.messages
          .fetch(scanConfig.infoMessageId)
          .catch(() => null);

        if (existingMessage) {
          await existingMessage.edit({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          });

          return message.reply({
            content: `✅ Le panneau de scan a été actualisé dans ${channel}.`,
            allowedMentions: { repliedUser: false }
          });
        }
      }

      const sentMessage = await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      guildConfig.setNested(
        message.guild.id,
        'scanProfilConfig',
        'infoMessageId',
        sentMessage.id
      );

      return message.reply({
        content: `✅ Le panneau de scan a été envoyé dans ${channel}.`,
        allowedMentions: { repliedUser: false }
      });
    }

    return message.reply({
      content: '❌ Sous-commande inconnue.',
      allowedMentions: { repliedUser: false }
    });
  }
};
