const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    name: 'autoroles',
    description: 'Configure les rôles automatiquement attribués aux nouveaux membres.',

    async execute(client, message, args) {
        const guild = message.guild;

        if (!guild) {
            return message.reply(
                '❌ Cette commande ne peut être utilisée que dans un serveur.'
            );
        }

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles
            )
        ) {
            return message.reply(
                '❌ Vous devez avoir la permission **Gérer les rôles** pour utiliser cette commande.'
            );
        }

        if (!client.autoRoles) {
            client.autoRoles = new Map();
        }

        if (args.length === 1 && args[0].toLowerCase() === 'off') {
            client.autoRoles.delete(guild.id);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🎭 AutoRoles désactivé\n\n` +
                        `L'attribution automatique des rôles a été **désactivée** sur ce serveur.`
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

        if (args.length === 0) {
            const roleIds = client.autoRoles.get(guild.id) || [];

            if (roleIds.length === 0) {
                return message.reply(
                    'ℹ️ Aucun rôle automatique n’est configuré sur ce serveur.\n\n' +
                    'Utilisez `+autoroles @Rôle` pour en ajouter.'
                );
            }

            const roles = roleIds
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(Boolean);

            if (roles.length === 0) {
                client.autoRoles.delete(guild.id);

                return message.reply(
                    'ℹ️ Aucun rôle automatique valide n’est actuellement configuré.'
                );
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🎭 AutoRoles\n\n` +
                        `Les nouveaux membres recevront automatiquement :\n\n` +
                        roles.map(role => `• ${role}`).join('\n')
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Nombre de rôles :** ${roles.length}`
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const roles = message.mentions.roles;

        if (roles.size === 0) {
            return message.reply(
                '❌ Vous devez mentionner au moins un rôle.\n\n' +
                '**Exemple :** `+autoroles @Membre @Bienvenue`'
            );
        }

        const botMember = guild.members.me;

        const invalidRoles = [];
        const validRoles = [];

        for (const role of roles.values()) {

            if (role.id === guild.id) {
                invalidRoles.push(`${role} (@everyone)`);
                continue;
            }

            if (role.managed) {
                invalidRoles.push(`${role} (rôle géré)`);
                continue;
            }

            if (role.position >= botMember.roles.highest.position) {
                invalidRoles.push(`${role} (rôle trop élevé)`);
                continue;
            }

            validRoles.push(role);
        }

        if (validRoles.length === 0) {
            return message.reply(
                '❌ Aucun des rôles mentionnés ne peut être attribué par le bot.\n\n' +
                'Vérifiez que mes rôles sont placés **au-dessus** des rôles à attribuer.'
            );
        }

        client.autoRoles.set(
            guild.id,
            validRoles.map(role => role.id)
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🎭 AutoRoles configuré\n\n` +
                    `Chaque nouveau membre recevra automatiquement :\n\n` +
                    validRoles.map(role => `• ${role}`).join('\n')
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Nombre de rôles :** ${validRoles.length}\n` +
                    `**Configuré par :** ${message.author}`
                )
            );

        if (invalidRoles.length > 0) {
            container
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ⚠️ Rôles ignorés\n\n` +
                        invalidRoles.map(role => `• ${role}`).join('\n')
                    )
                );
        }

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
