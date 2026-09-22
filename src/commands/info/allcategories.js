const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'allcategories',
  description: 'Affiche toutes les catégories du serveur.',

  async execute(client, message) {
    const categories = message.guild.channels.cache
      .filter(channel => channel.type === 4)
      .sort((a, b) => a.rawPosition - b.rawPosition);

    if (!categories.size) {
      return message.reply('❌ Aucune catégorie trouvée.');
    }

    const lines = categories.map((category, index) => {
      const children = message.guild.channels.cache.filter(
        channel => channel.parentId === category.id
      ).size;
      return `**${index + 1}.** ${category} — \`${children}\` salon${children > 1 ? 's' : ''}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(`**📁** **▸ Categories (${categories.size})**\n\n${lines.join('\n')}`);

    await message.reply({ embeds: [embed] });
  }
};
