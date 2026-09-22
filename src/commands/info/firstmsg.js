const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'firstmsg',
  description: 'Affiche le premier message d’un salon.',

  async execute(client, message, args) {
    let channel = message.channel;

    if (args[0]) {
      const match = args[0].match(/^<#(\d+)>$/);
      const id = match ? match[1] : args[0];
      channel = message.guild.channels.cache.get(id);
    }

    if (!channel || !channel.isTextBased() || typeof channel.messages?.fetch !== 'function') {
      return message.reply('❌ Salon textuel introuvable.');
    }

    try {
      const messages = await channel.messages.fetch({ limit: 1, after: '0' });
      const first = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first();

      if (!first) {
        return message.reply('❌ Aucun message trouvé.');
      }

      const content = first.content?.trim() || 'Message sans contenu';
      const shortened = content.length > 150 ? `${content.slice(0, 147)}...` : content;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(
          `**🕐** **▸ First Message (${channel.name})**\n\n` +
          `> *Auteur:* ${first.author}\n` +
          `> *Date:* <t:${Math.floor(first.createdTimestamp / 1000)}:F>\n` +
          `> *Contenu:* **${shortened}**\n\n` +
          `[Voir le message](${first.url})`
        );

      await message.reply({ embeds: [embed] });
    } catch {
      await message.reply('❌ Impossible de récupérer le premier message de ce salon.');
    }
  }
};
