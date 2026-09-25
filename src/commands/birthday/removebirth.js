const {
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'addbirth',
    description: 'Ajoute l’anniversaire d’un membre',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Tu dois avoir la permission `Gérer le serveur`.');
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const date = args[1];

        if (!member || !date) {
            return message.reply('❌ Utilisation : `+addbirth @membre JJ/MM`');
        }

        const match = date.match(/^(\d{1,2})\/(\d{1,2})$/);

        if (!match) {
            return message.reply('❌ La date doit être au format `JJ/MM`.');
        }

        const day = Number(match[1]);
        const month = Number(match[2]);

        if (month < 1 || month > 12) {
            return message.reply('❌ Le mois doit être compris entre 01 et 12.');
        }

        const daysInMonth = new Date(2000, month, 0).getDate();

        if (day < 1 || day > daysInMonth) {
            return message.reply('❌ Ce jour n’est pas valide pour ce mois.');
        }

        const config = guildConfig.getAll(message.guild.id);

        config.birthdayConfig.birthdays[member.id] = {
            day,
            month,
            lastAnnounced: null
        };

        guildConfig.save(message.guild.id, config);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 🎂 Anniversaire ajouté'),
                new TextDisplayBuilder()
                    .setContent(
                        `L’anniversaire de ${member} a été enregistré pour le **${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}**.`
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
