const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    name: 'piconly',
    description: 'Définit le salon actuel comme salon réservé aux images et GIF.',

    async execute(client, message, args) {
        const channel = message.channel;
        const guild = message.guild;

        if (!guild) {
            return message.reply(
                '❌ Cette commande ne peut être utilisée que dans un serveur.'
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

        if (
            !guild.members.me.permissions.has(
                PermissionsBitField.Flags.ManageMessages
            )
        ) {
            return message.reply(
                '❌ Je n’ai pas la permission **Gérer les messages** dans ce salon.'
            );
        }

        const botPermissions = channel.permissionsFor(guild.members.me);

        if (
            !botPermissions?.has(
                PermissionsBitField.Flags.ManageMessages
            )
        ) {
            return message.reply(
                '❌ Je n’ai pas la permission **Gérer les messages** dans ce salon.'
            );
        }

        if (!client.picOnlyChannels) {
            client.picOnlyChannels = new Set();
        }

        if (client.picOnlyChannels.has(channel.id)) {
            client.picOnlyChannels.delete(channel.id);

            const disabledContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🖼️ Salon images uniquement\n\n` +
                        `Le mode **images uniquement** a été désactivé dans ${channel}.\n\n` +
                        `Les membres peuvent maintenant envoyer des messages normalement.`
                    )
                );

            return message.reply({
                components: [disabledContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }

        client.picOnlyChannels.add(channel.id);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🖼️ Salon images uniquement\n\n` +
                    `${channel} est maintenant configuré en **images uniquement**.\n\n` +
                    `Les membres peuvent envoyer :\n` +
                    `• 🖼️ Images\n` +
                    `• 🎞️ GIF\n` +
                    `• 📎 Fichiers image\n` +
                    `• 🔗 Liens contenant une image\n\n` +
                    `Tout autre message sera automatiquement supprimé.`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Configuration :** activée\n` +
                    `**Salon :** ${channel}\n` +
                    `**Configuré par :** ${message.author}`
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
