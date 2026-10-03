const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const interpolHandler = require('../../structure/interpolHandler');

module.exports = {
    name: 'interpol',
    aliases: ['linkedin', 'recherche'],
    usage: 'interpol @membre',
    description: 'Lance le jeu INTERPOL ou LinkedIn sur le profil d’un membre.',

    async execute(client, message, args) {
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({
                content: '❌ Mentionne un membre.'
            });
        }

        if (member.user.bot) {
            return message.reply({
                content: '❌ Les bots ne peuvent pas participer à ce jeu.'
            });
        }

        if (member.id === message.author.id) {
            return message.reply({
                content: '❌ Tu ne peux pas utiliser ton propre profil.'
            });
        }

        const gameId = `${message.id}_${Date.now()}`;

        const avatar = member.user.displayAvatarURL({
            extension: 'png',
            size: 1024
        });

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
`# 🕵️ INTERPOL OU LINKEDIN ?

## ${member.user.username}

Est-ce que cette personne a plutôt un profil **LinkedIn** ou un profil **recherché par INTERPOL** ?`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL(avatar)
                            .setDescription(`Photo de profil de ${member.user.username}`)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `👤 ${member}`
                )
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`interpol_linkedin:${gameId}`)
                    .setLabel('LinkedIn')
                    .setEmoji('💼')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`interpol_interpol:${gameId}`)
                    .setLabel('INTERPOL')
                    .setEmoji('🚨')
                    .setStyle(ButtonStyle.Danger)
            );

        const sent = await message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [
                container,
                buttons
            ]
        });

        interpolHandler.createGame({
            id: gameId,
            messageId: sent.id,
            channelId: sent.channel.id,
            guildId: message.guild.id,
            targetId: member.id,
            targetUsername: member.user.username,
            avatar,
            createdBy: message.author.id
        });
    }
};
