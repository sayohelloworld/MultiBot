const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'allpins',
  description: 'Affiche les messages épinglés du serveur.',

  async execute(client, message) {
    const channels = message.guild.channels.cache.filter(
      channel => channel.isTextBased() && typeof channel.messages?.fetchPins === 'function'
    );

    const pins = [];

    for (const channel of channels.values()) {
      try {
        const messages = await channel.messages.fetchPins();
        for (const pinned of messages.values()) {
          pins.push({ channel, message: pinned });
        }
      } catch {}
    }

    if (!pins.length) {
      return message.reply('❌ Aucun message épinglé trouvé.');
    }

    pins.sort((a, b) => b.message.createdTimestamp - a.message.createdTimestamp);

    const lines = pins.slice(0, 25).map((item, index) => {
      const content = item.message.content?.trim() || 'Message sans contenu';
      const shortened = content.length > 80 ? `${content.slice(0, 77)}...` : content;
      return `**${index + 1}.** ${item.channel} — [${shortened}](${item.message.url})`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(`**📌** **▸ Pinned Messages (${pins.length})**\n\n${lines.join('\n')}${pins.length > 25 ? '\n\n> Affichage limité aux 25 premiers.' : ''}`);

    await message.reply({ embeds: [embed] });
  }
};
