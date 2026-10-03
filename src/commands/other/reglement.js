const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'reglement',
    usage: 'reglement',
    description: 'Affiche et configure le règlement du serveur.',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'set') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            const text = args.slice(1).join(' ').trim();

            if (!text) {
                return message.reply('Utilisation : `+reglement set <texte>`');
            }

            guildConfig.set(message.guild.id, 'reglementText', text);

            return message.reply('Le règlement a été configuré.');
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur**.');
            }

            guildConfig.set(message.guild.id, 'reglementText', null);

            return message.reply('Le règlement a été supprimé.');
        }

        if (!config.reglementText) {
            return message.reply('Le règlement n’a pas encore été configuré sur ce serveur.');
        }

        const sections = config.reglementText.split('\n---\n');

        const container = new ContainerBuilder();

        sections.forEach((section, index) => {
            if (index > 0) {
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(section)
            );
        });

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};