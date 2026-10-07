const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

function escapeMarkdown(text) {
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`');
}

module.exports = {
    name: 'notes',
    description: 'Afficher les notes internes d’un membre',

    async execute(client, message, args) {
        if (!message.guild) return;

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
                "Tu n'as pas la permission de consulter les notes."
            );
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Mentionne un membre pour voir ses notes.'
            );
        }

        const config = guildConfig.getAll(message.guild.id);

        const notes =
            config.moderationNotes?.[member.id] || [];

        if (notes.length === 0) {
            return message.reply(
                `**${member.user.tag}** n'a aucune note.`
            );
        }

        const container = new ContainerBuilder();

        let content =
            `## Notes de ${escapeMarkdown(member.user.tag)}\n` +
            `**Nombre de notes :** ${notes.length}\n`;

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(content)
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];

            const moderatorMember =
                message.guild.members.cache.get(
                    note.moderatorId
                );

            const moderatorName =
                moderatorMember?.user.tag ||
                'Modérateur inconnu';

            const date = new Date(
                note.createdAt
            ).toLocaleString('fr-FR');

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### Note #${i + 1}\n` +
                        `**Modérateur :** ${escapeMarkdown(moderatorName)}\n` +
                        `**Date :** ${date}\n` +
                        `**Contenu :** ${escapeMarkdown(note.content)}`
                    )
            );

            if (i < notes.length - 1) {
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );
            }
        }

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
