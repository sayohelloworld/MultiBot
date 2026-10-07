const {
    PermissionsBitField
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'quarantine',
    description: 'Placer un membre en quarantaine',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles
            )
        ) {
            return message.reply(
                "Tu n'as pas la permission de gérer les rôles."
            );
        }

        const member =
            message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Mentionne un membre à placer en quarantaine.'
            );
        }

        if (member.id === message.guild.ownerId) {
            return message.reply(
                'Impossible de placer le propriétaire du serveur en quarantaine.'
            );
        }

        if (
            member.roles.highest.position >=
            message.member.roles.highest.position &&
            message.guild.ownerId !== message.author.id
        ) {
            return message.reply(
                'Tu ne peux pas placer ce membre en quarantaine car son rôle est supérieur ou égal au tien.'
            );
        }

        const botMember =
            message.guild.members.me;

        if (!botMember) {
            return message.reply(
                "Impossible de récupérer les permissions du bot."
            );
        }

        let quarantineRole = null;

        const config =
            guildConfig.getAll(message.guild.id);

        if (config.quarantineRoleId) {
            quarantineRole =
                message.guild.roles.cache.get(
                    config.quarantineRoleId
                );
        }

        if (!quarantineRole) {
            quarantineRole =
                message.guild.roles.cache.find(
                    role =>
                        role.name.toLowerCase() ===
                        'quarantaine'
                );
        }

        if (!quarantineRole) {
            quarantineRole =
                await message.guild.roles.create({
                    name: 'Quarantaine',
                    reason:
                        `Création automatique pour ${message.author.tag}`
                });
        }

        if (
            quarantineRole.position >=
            botMember.roles.highest.position
        ) {
            return message.reply(
                'Le rôle `Quarantaine` est placé au-dessus du rôle du bot. Déplace-le sous le rôle du bot.'
            );
        }

        config.quarantineRoleId =
            quarantineRole.id;

        guildConfig.save(
            message.guild.id,
            config
        );

        const rolesToRemove =
            member.roles.cache.filter(
                role =>
                    role.id !== message.guild.id &&
                    role.id !== quarantineRole.id &&
                    role.editable
            );

        try {
            if (rolesToRemove.size > 0) {
                await member.roles.remove(
                    rolesToRemove,
                    `Quarantaine par ${message.author.tag}`
                );
            }

            await member.roles.add(
                quarantineRole,
                `Quarantaine par ${message.author.tag}`
            );
        } catch (error) {
            console.error(
                '[QUARANTINE]',
                error
            );

            return message.reply(
                "Impossible de placer ce membre en quarantaine."
            );
        }

        return message.reply(
            `**${member.user.tag}** a été placé en quarantaine.`
        );
    }
};
