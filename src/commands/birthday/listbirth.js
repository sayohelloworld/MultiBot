const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'listbirth',
    description: 'Affiche les anniversaires enregistrés',

    async execute(client, message, args) {
        if (!message.guild) return;

        const config = guildConfig.getAll(message.guild.id);
        const birthdays = config.birthdayConfig.birthdays || {};

        const entries = Object.entries(birthdays);

        if (entries.length === 0) {
            return message.reply('❌ Aucun anniversaire n’est enregistré sur ce serveur.');
        }

        entries.sort((a, b) => {
            const dateA = a[1].month * 100 + a[1].day;
            const dateB = b[1].month * 100 + b[1].day;

            return dateA - dateB;
        });

        const lines = [];

        for (const [userId, birthday] of entries) {
            const member = message.guild.members.cache.get(userId);

            const username = member
                ? member.user.tag
                : `Utilisateur ${userId}`;

            lines.push(
                `🎂 **${String(birthday.day).padStart(2, '0')}/${String(birthday.month).padStart(2, '0')}** — ${username}`
            );
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## 🎂 Anniversaires de ${message.guild.name}`),
                new TextDisplayBuilder()
                    .setContent(lines.join('\n')),
                new TextDisplayBuilder()
                    .setContent(
                        `Total : **${entries.length}** anniversaire${entries.length > 1 ? 's' : ''} enregistré${entries.length > 1 ? 's' : ''}`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );

        return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
