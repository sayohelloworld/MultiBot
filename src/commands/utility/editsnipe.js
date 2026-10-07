const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const editedMessages = new Map();

module.exports = {
    name: 'editsnipe',
    description: 'Affiche les messages modifiés récemment',

    init(client) {
        if (client._snipeEditInitialized) return;
        client._snipeEditInitialized = true;

        client.on('messageUpdate', (oldMessage, newMessage) => {
            if (!oldMessage.guild) return;
            if (oldMessage.partial || newMessage.partial) return;

            if (oldMessage.content === newMessage.content) return;

            if (!editedMessages.has(oldMessage.channel.id)) {
                editedMessages.set(oldMessage.channel.id, []);
            }

            const snipes = editedMessages.get(oldMessage.channel.id);

            snipes.unshift({
                oldContent: oldMessage.content || null,
                newContent: newMessage.content || null,
                author: oldMessage.author.tag,
                createdAt: oldMessage.createdTimestamp,
                editedAt: newMessage.editedTimestamp
            });

            if (snipes.length > 10) {
                snipes.pop();
            }
        });
    },

    async execute(client, message, args) {
        this.init(client);

        const snipes = editedMessages.get(message.channel.id);

        if (!snipes || snipes.length === 0) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Message modifié\n\nAucun message modifié récemment dans ce salon.'
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
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Message modifié\n\nIl y a seulement **${snipes.length}** message(s) modifié(s).`
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
                    `## Message modifié\n\n**Auteur :** ${msg.author}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Avant :**\n${msg.oldContent || '*Message vide*'}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Après :**\n${msg.newContent || '*Message vide*'}`
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
