const { EmbedBuilder } = require('discord.js');
const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'conditions',
    description: 'Affiche les conditions de partenariat du serveur',
    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);

        if (!config.conditionsText) {
            return message.reply('Les conditions de partenariat n\'ont pas encore été configurées sur ce serveur.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🤝 Conditions de partenariat')
            .setDescription(config.conditionsText)
            .setColor('#2f3136');

        await message.channel.send({ embeds: [embed] });
    }
};
