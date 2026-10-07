const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const deletedMessages = new Map();

module.exports = {
    name: 'snipe',
    description: 'Affiche les messages supprimés récemment',

    init(client) {
        if (client._snipeInitialized) return;
        client._snipeInitialized = true;

        client.on('messageDelete', (message) => {
            if (!message.guild) return;
            if (message.partial) return;

            if (!deletedMessages.has(message.channel.id)) {
                deletedMessages.set(message.channel.id, []);
            }

            const snipes = deletedMessages.get(message.channel.id);

            snipes.unshift({
                content: message.content || null,
                author: message.author.tag,
                createdAt: message.createdTimestamp
            });

            if (snipes.length > 10) {
                snipes.pop();
            }
        });
    },

    async execute(client, message, args) {
        this.init(client);

        const snipes = deletedMessages.get(message.channel.id);

        if (!snipes || snipes.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Message supprimé\n\nAucun message supprimé récemment dans ce salon.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const index = parseInt(args[0]) - 1 || 0;

        if (index < 0 || index >= snipes.length) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Message supprimé\n\nIl y a seulement **${snipes.length}** message(s) supprimé(s).`
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const msg = snipes[index];

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Message supprimé\n\n**Auteur :** ${msg.author}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Contenu :**\n${msg.content || '*Message vide*'}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Message **${index + 1}/${snipes.length}**`
                )
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
