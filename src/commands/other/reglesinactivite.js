const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'reglesinactivite',
    description: 'Affiche et configure le règlement concernant l’inactivité du Staff',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'set') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            const text = args.slice(1).join(' ').trim();

            if (!text) {
                return message.reply('Utilisation : `+reglesinactivite set <texte>`');
            }

            guildConfig.set(message.guild.id, 'reglementInactif', text);

            return message.reply('Le règlement concernant l’inactivité du Staff a été configuré.');
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            guildConfig.set(message.guild.id, 'reglementInactif', null);

            return message.reply('Le règlement concernant l’inactivité du Staff a été supprimé.');
        }

        if (!config.reglementInactif) {
            return message.reply('Le règlement concernant l’inactivité du Staff n’a pas encore été configuré sur ce serveur.');
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(config.reglementInactif)
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};