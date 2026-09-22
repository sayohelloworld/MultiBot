const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    name: 'chdelete',
    description: 'Supprime un salon à partir de son ID',

    async execute(client, message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nTu n\'as pas la permission **Gérer les salons**.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const channelId = args[0];

        if (!channelId) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nIndique l\'ID du salon à supprimer.\n\n**Exemple :** `+chdelete 123456789012345678`'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        let channel;

        try {
            channel = await client.channels.fetch(channelId);
        } catch {
            channel = null;
        }

        if (!channel || !channel.guild) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nAucun salon valide ne correspond à cet ID.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (channel.guild.id !== message.guild.id) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nCe salon n\'appartient pas à ce serveur.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!channel.deletable) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nJe ne peux pas supprimer ce salon. Vérifie mes permissions et la hiérarchie du serveur.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const channelName = channel.name;

        try {
            await channel.delete(`Suppression via +chdelete par ${message.author.tag}`);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Salon supprimé\n\nLe salon **#${channelName}** a été supprimé avec succès.`
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Suppression de salon\n\nUne erreur est survenue lors de la suppression du salon.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};
