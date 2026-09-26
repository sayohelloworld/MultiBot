const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'vc-manager',
    description: 'Configure le gestionnaire de salons vocaux',
    category: 'config',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply(
                '❌ Tu dois avoir la permission **Gérer le serveur**.'
            );
        }

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            const triggerId = guildConfig.get(
                message.guild.id,
                'voiceManagerTrigger'
            );

            const categoryId = guildConfig.get(
                message.guild.id,
                'voiceManagerCategory'
            );

            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '## 🎙️ Gestionnaire vocal'
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Salon déclencheur :** ${
                        triggerId ? `<#${triggerId}>` : 'Non configuré'
                    }\n` +
                    `**Catégorie :** ${
                        categoryId ? `<#${categoryId}>` : 'Non configurée'
                    }`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '**Configuration**\n' +
                    '`+vc-manager setup <ID salon vocal> <ID catégorie>`\n' +
                    '`+vc-manager disable`\n' +
                    '`+vc-manager info`'
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (subcommand === 'setup') {
            const triggerId = args[1];
            const categoryId = args[2];

            if (!triggerId || !categoryId) {
                return message.reply(
                    '❌ Utilisation : `+vc-manager setup <ID salon vocal> <ID catégorie>`'
                );
            }

            const triggerChannel = message.guild.channels.cache.get(triggerId);
            const category = message.guild.channels.cache.get(categoryId);

            if (!triggerChannel) {
                return message.reply(
                    '❌ Le salon vocal indiqué est introuvable sur ce serveur.'
                );
            }

            if (!category) {
                return message.reply(
                    '❌ La catégorie indiquée est introuvable sur ce serveur.'
                );
            }

            if (triggerChannel.type !== ChannelType.GuildVoice) {
                return message.reply(
                    '❌ Le premier ID doit correspondre à un **salon vocal**.'
                );
            }

            if (category.type !== ChannelType.GuildCategory) {
                return message.reply(
                    '❌ Le deuxième ID doit correspondre à une **catégorie**.'
                );
            }

            guildConfig.set(
                message.guild.id,
                'voiceManagerTrigger',
                triggerChannel.id
            );

            guildConfig.set(
                message.guild.id,
                'voiceManagerCategory',
                category.id
            );

            return message.reply(
                `✅ **Gestionnaire vocal configuré.**\n\n` +
                `**Salon déclencheur :** ${triggerChannel}\n` +
                `**Catégorie de création :** ${category}`
            );
        }

        if (subcommand === 'disable') {
            guildConfig.set(
                message.guild.id,
                'voiceManagerTrigger',
                null
            );

            guildConfig.set(
                message.guild.id,
                'voiceManagerCategory',
                null
            );

            return message.reply(
                '✅ **Gestionnaire vocal désactivé.**\nLes salons vocaux temporaires ne seront plus créés.'
            );
        }

        if (subcommand === 'info') {
            const triggerId = guildConfig.get(
                message.guild.id,
                'voiceManagerTrigger'
            );

            const categoryId = guildConfig.get(
                message.guild.id,
                'voiceManagerCategory'
            );

            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '## 🎙️ Configuration du gestionnaire vocal'
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Salon déclencheur**\n${
                        triggerId ? `<#${triggerId}>` : 'Non configuré'
                    }\n\n` +
                    `**Catégorie de création**\n${
                        categoryId ? `<#${categoryId}>` : 'Non configurée'
                    }`
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        return message.reply(
            '❌ Sous-commande inconnue. Utilise `+vc-manager` pour afficher l’aide.'
        );
    }
};
