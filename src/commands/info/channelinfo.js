const {
  EmbedBuilder,
  ChannelType
} = require('discord.js');

function getChannelType(channel) {
  const types = {
    [ChannelType.GuildText]: 'Salon Textuel',
    [ChannelType.GuildVoice]: 'Salon Vocal',
    [ChannelType.GuildCategory]: 'Catégorie',
    [ChannelType.GuildAnnouncement]: 'Salon d\'annonces',
    [ChannelType.AnnouncementThread]: 'Thread d\'annonce',
    [ChannelType.PublicThread]: 'Thread Public',
    [ChannelType.PrivateThread]: 'Thread Privé',
    [ChannelType.GuildStageVoice]: 'Salon Stage',
    [ChannelType.GuildForum]: 'Forum',
    [ChannelType.GuildMedia]: 'Salon Média'
  };

  return types[channel.type] || 'Inconnu';
}

function getChannelIcon(channel) {
  if (channel.type === ChannelType.GuildVoice) {
    return '🔊';
  }

  if (channel.type === ChannelType.GuildCategory) {
    return '📁';
  }

  if (channel.type === ChannelType.GuildForum) {
    return '🗂️';
  }

  if (
    channel.type === ChannelType.AnnouncementThread ||
    channel.type === ChannelType.PublicThread ||
    channel.type === ChannelType.PrivateThread
  ) {
    return '🧵';
  }

  return '🪄';
}

function getSlowmode(channel) {
  if (
    !('rateLimitPerUser' in channel) ||
    !channel.rateLimitPerUser
  ) {
    return 'Aucun.';
  }

  const seconds = channel.rateLimitPerUser;

  if (seconds < 60) {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours} heure${hours > 1 ? 's' : ''}`;
}

function getCreationTimestamp(channel) {
  if (!channel.createdTimestamp) {
    return 'Inconnue';
  }

  return `<t:${Math.floor(channel.createdTimestamp / 1000)}:R> ` +
    `(<t:${Math.floor(channel.createdTimestamp / 1000)}:F>)`;
}

function getFirstMessageText(message) {
  if (!message) {
    return 'Aucun message.';
  }

  const content =
    message.content?.trim() ||
    'Message sans contenu';

  const shortened =
    content.length > 120
      ? `${content.slice(0, 117)}...`
      : content;

  return `**${shortened}**`;
}

module.exports = {
  name: 'channelinfo',
  description: 'Affiche les informations d\'un salon.',

  async execute(client, message, args) {
    let channel = message.channel;

    if (args[0]) {
      const mentionMatch =
        args[0].match(/^<#(\d+)>$/);

      const channelId = mentionMatch
        ? mentionMatch[1]
        : args[0];

      channel =
        message.guild.channels.cache.get(channelId) ||
        message.guild.channels.cache.find(
          (item) =>
            item.name.toLowerCase() ===
            channelId.toLowerCase()
        );

      if (!channel) {
        return message.reply(
          '❌ Salon introuvable.'
        );
      }
    }

    let firstMessage = null;

    if (
      channel.isTextBased() &&
      typeof channel.messages?.fetch === 'function'
    ) {
      try {
        const messages =
          await channel.messages.fetch({
            limit: 1,
            after: '0'
          });

        firstMessage =
          messages.sort(
            (a, b) =>
              a.createdTimestamp -
              b.createdTimestamp
          ).first();
      } catch {
        firstMessage = null;
      }
    }

    const icon = getChannelIcon(channel);

    const topic =
      'topic' in channel && channel.topic
        ? channel.topic
        : 'Aucun.';

    const category =
      channel.parent
        ? `${channel.parent}`
        : 'Aucune.';

    const position =
      channel.rawPosition ??
      channel.position ??
      0;

    const nsfw =
      'nsfw' in channel
        ? channel.nsfw
          ? 'Oui'
          : 'Non'
        : 'Non applicable';

    const slowmode =
      getSlowmode(channel);

    const channelType =
      getChannelType(channel);

    const description =
      `> *Salon:* ***${channel.name}*** ` +
      `*(**\`#${channel.name}\`** | **\`${channel.id}\`**)*\n` +

      `> *Sujet:* \`${topic}\`\n` +

      `> *Catégorie:* ${category} ` +
      `— *Position:* \`${position}\`\n` +

      `> *Type:* \`${channelType}\`\n` +

      `> *NSFW:* \`${nsfw}\`\n` +

      `> *Date de création:* ${getCreationTimestamp(channel)}\n` +

      `> *Mode lent:* \`${slowmode}\`\n` +

      `> *Premier message:* ` +
      `${getFirstMessageText(firstMessage)}`;

    const embed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle(`**${icon}** ** Channel Info (${channel.name})**`)
      .setDescription(description);

    await message.reply({
      embeds: [embed]
    });
  }
};
