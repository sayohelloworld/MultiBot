const {
    PermissionsBitField
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'note',
    description: 'Ajouter une note interne à un membre',

    async execute(client, message, args) {
        if (!message.guild) return;

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Mentionne un membre auquel ajouter une note.'
            );
        }

        const content = args
            .slice(1)
            .join(' ')
            .trim();

        if (!content) {
            return message.reply(
                'Indique le contenu de la note.'
            );
        }

        const moderator = message.member;

        if (
            !moderator.permissions.has(
                PermissionsBitField.Flags.ModerateMembers
            ) &&
            !moderator.permissions.has(
                PermissionsBitField.Flags.ManageMessages
            ) &&
            message.guild.ownerId !== message.author.id
        ) {
            return message.reply(
                "Tu n'as pas la permission d'ajouter une note."
            );
        }

        const config = guildConfig.getAll(message.guild.id);

        if (!config.moderationNotes) {
            config.moderationNotes = {};
        }

        if (!config.moderationNotes[member.id]) {
            config.moderationNotes[member.id] = [];
        }

        const note = {
            id: Date.now().toString(),
            content,
            moderatorId: message.author.id,
            createdAt: new Date().toISOString()
        };

        config.moderationNotes[member.id].push(note);

        guildConfig.save(message.guild.id, config);

        return message.reply(
            `Note ajoutée pour **${member.user.tag}**.\n` +
            `> ${content}`
        );
    }
};
