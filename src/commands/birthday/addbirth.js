const {
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'removebirth',
    description: 'Supprime l’anniversaire d’un membre',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Tu dois avoir la permission `Gérer le serveur`.');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply('❌ Mentionne un membre ou indique son ID.');
        }

        const config = guildConfig.getAll(message.guild.id);

        if (!config.birthdayConfig.birthdays[member.id]) {
            return message.reply(`❌ Aucun anniversaire n’est enregistré pour ${member}.`);
        }

        delete config.birthdayConfig.birthdays[member.id];

        guildConfig.save(message.guild.id, config);

        const container = new ContainerBuilder()
            .setAccentColor(3604294)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🎂 Anniversaire supprimé'),
                new TextDisplayBuilder()
                    .setContent(`L’anniversaire de ${member} a été supprimé.`)
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
