const {
  PermissionFlagsBits
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
  name: 'scan-profile-config',
  description: 'Configure le système de scan de profils.',

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur**.',
        allowedMentions: { repliedUser: false }
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      return message.reply({
        content:
          '**Configuration du scan de profils**\n\n' +
          '`+scan-profile-config info #salon` — Salon contenant le panneau de scan\n' +
          '`+scan-profile-config result #salon` — Salon où les profils sont publiés\n' +
          '`+scan-profile-config leaderboard #salon` — Salon du classement\n' +
          '`+scan-profile-config status` — Affiche la configuration actuelle',
        allowedMentions: { repliedUser: false }
      });
    }

    const config = guildConfig.getAll(message.guild.id);

    if (subcommand === 'status') {
      const scanConfig = config.scanProfilConfig;

      return message.reply({
        content:
          '**Configuration du scan de profils**\n\n' +
          `**Statut :** ${scanConfig.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
          `**Salon informatif :** ${scanConfig.infoChannelId ? `<#${scanConfig.infoChannelId}>` : '❌ Non configuré'}\n` +
          `**Salon des profils :** ${scanConfig.resultChannelId ? `<#${scanConfig.resultChannelId}>` : '❌ Non configuré'}\n` +
          `**Salon du classement :** ${scanConfig.leaderboardChannelId ? `<#${scanConfig.leaderboardChannelId}>` : '❌ Non configuré'}\n` +
          `**Message informatif :** ${scanConfig.infoMessageId ? `\`${scanConfig.infoMessageId}\`` : '❌ Aucun'}\n` +
          `**Message classement :** ${scanConfig.leaderboardMessageId ? `\`${scanConfig.leaderboardMessageId}\`` : '❌ Aucun'}`,
        allowedMentions: { repliedUser: false }
      });
    }

    if (!['info', 'result', 'leaderboard'].includes(subcommand)) {
      return message.reply({
        content: '❌ Sous-commande inconnue.',
        allowedMentions: { repliedUser: false }
      });
    }

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[1]);

    if (!channel) {
      return message.reply({
        content:
          '❌ Vous devez indiquer un salon.\n' +
          `Exemple : \`+scan-profile-config ${subcommand} #salon\``,
        allowedMentions: { repliedUser: false }
      });
    }

    if (!channel.isTextBased()) {
      return message.reply({
        content: '❌ Le salon sélectionné doit être un salon textuel.',
        allowedMentions: { repliedUser: false }
      });
    }

    let key;
    let label;

    if (subcommand === 'info') {
      key = 'infoChannelId';
      label = 'salon informatif';
    }

    if (subcommand === 'result') {
      key = 'resultChannelId';
      label = 'salon des profils';
    }

    if (subcommand === 'leaderboard') {
      key = 'leaderboardChannelId';
      label = 'salon du classement';
    }

    guildConfig.setNested(
      message.guild.id,
      'scanProfilConfig',
      key,
      channel.id
    );

    return message.reply({
      content: `✅ Le ${label} est maintenant configuré sur ${channel}.`,
      allowedMentions: { repliedUser: false }
    });
  }
};
