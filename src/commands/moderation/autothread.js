const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionsBitField,
    ChannelType
} = require('discord.js');

module.exports = {
    name: 'autothread',
    description: 'Active ou désactive la création automatique d’un thread pour chaque message.',

    async execute(client, message, args) {
        const guild = message.guild;
        const channel = message.channel;

        if (!guild) {
            return message.reply(
                '❌ Cette commande ne peut être utilisée que dans un serveur.'
            );
        }

        if (channel.type !== ChannelType.GuildText) {
            return message.reply(
                '❌ Cette commande doit être utilisée dans un salon textuel classique.'
            );
        }

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels
            )
        ) {
            return message.reply(
                '❌ Vous devez avoir la permission **Gérer les salons** pour utiliser cette commande.'
            );
        }
        const botPermissions = channel.permissionsFor(guild.members.me);

        if (
            !botPermissions?.has(
                PermissionsBitField.Flags.CreatePublicThreads
            ) ||
            !botPermissions?.has(
                PermissionsBitField.Flags.SendMessagesInThreads
            )
        ) {
            return message.reply(
                '❌ Je n’ai pas les permissions nécessaires pour créer et utiliser des threads dans ce salon.'
            );
        }

        if (!client.autoThreadChannels) {
            client.autoThreadChannels = new Set();
        }

        if (client.autoThreadChannels.has(channel.id)) {
            client.autoThreadChannels.delete(channel.id);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🧵 AutoThread désactivé\n\n` +
                        `La création automatique de threads a été **désactivée** dans ${channel}.\n\n` +
                        `Les nouveaux messages ne créeront plus automatiquement de thread.`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Désactivé par :** ${message.author}`
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        client.autoThreadChannels.add(channel.id);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🧵 AutoThread activé\n\n` +
                    `La création automatique de threads est maintenant **activée** dans ${channel}.\n\n` +
                    `Chaque nouveau message envoyé par un membre créera automatiquement son propre thread.`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Salon :** ${channel}\n` +
                    `**Activé par :** ${message.author}`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
