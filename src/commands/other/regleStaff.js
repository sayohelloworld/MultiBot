const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'reglestaff',
    description: 'Affiche et configure le règlement du Staff',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'set') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            const text = args.slice(1).join(' ').trim();

            if (!text) {
                return message.reply('Utilisation : `+reglestaff set <texte>`');
            }

            guildConfig.set(message.guild.id, 'reglementStaff', text);

            return message.reply('Le règlement du Staff a été configuré.');
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            guildConfig.set(message.guild.id, 'reglementStaff', null);

            return message.reply('Le règlement du Staff a été supprimé.');
        }

        if (!config.reglementStaff) {
            return message.reply('Le règlement du Staff n’a pas encore été configuré sur ce serveur.');
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(config.reglementStaff)
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};