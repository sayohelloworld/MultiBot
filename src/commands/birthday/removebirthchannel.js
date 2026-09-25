const {
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'removebirthchannel',
    description: 'Supprime le salon des annonces d’anniversaire',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Tu dois avoir la permission `Gérer le serveur`.');
        }

        const config = guildConfig.getAll(message.guild.id);

        config.birthdayConfig.channelId = null;

        guildConfig.save(message.guild.id, config);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🎂 Salon supprimé'),
                new TextDisplayBuilder()
                    .setContent('Les annonces automatiques d’anniversaire sont maintenant désactivées.')
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
