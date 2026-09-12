const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'rolemembers',
    description: 'Affiche la liste des membres possédant un rôle.',

    async execute(client, message, args) {
        if (!message.guild) return;

        const role =
            message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]) ||
            message.guild.roles.cache.find(
                r => r.name.toLowerCase() === args.join(' ').toLowerCase()
            );

        if (!role) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Rôle introuvable\n' +
                        'Veuillez mentionner un rôle ou fournir son ID/nom.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const members = [...role.members.values()]
            .sort((a, b) => a.user.username.localeCompare(b.user.username));

        let memberList;

        if (members.length === 0) {
            memberList = 'Aucun membre ne possède ce rôle.';
        } else {
            memberList = members
                .map((member, index) =>
                    `**${index + 1}.** ${member} — \`${member.user.tag}\``
                )
                .join('\n');

            if (memberList.length > 3500) {
                memberList =
                    memberList.slice(0, 3500) +
                    `\n\n... et ${members.length - memberList.split('\n').length} autre(s) membre(s).`;
            }
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# Membres du rôle\n\n` +
                    `**Rôle :** ${role}\n` +
                    `**Nombre de membres :** ${members.length}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(memberList)
            );

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
