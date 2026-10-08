const {
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

function formatValue(value, type) {
    if (!value) return 'Non configuré';

    if (type === 'url') {
        return `[Voir l'image](${value})`;
    }

    return value;
}

function createPanel(guild, config) {
    const profile = config.botProfileConfig || {};

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 🤖 Profil du bot\n` +
                `Personnalisez l'apparence du bot uniquement sur **${guild.name}**.\n\n` +
                `**Pseudo**\n${formatValue(profile.nickname, 'text')}\n\n` +
                `**Avatar**\n${formatValue(profile.avatar, 'url')}\n\n` +
                `**Bannière**\n${formatValue(profile.banner, 'url')}\n\n` +
                `**Bio**\n${formatValue(profile.bio, 'text')}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Les modifications sont propres à ce serveur et n'affectent pas le profil global du bot.`
            )
        );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('botprofile_nickname')
            .setLabel('Pseudo')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('botprofile_avatar')
            .setLabel('Avatar')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('botprofile_banner')
            .setLabel('Bannière')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('botprofile_bio')
            .setLabel('Bio')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('botprofile_preview')
            .setLabel('Aperçu')
            .setEmoji('👁️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('botprofile_reset')
            .setLabel('Réinitialiser')
            .setEmoji('♻️')
            .setStyle(ButtonStyle.Danger)
    );

    return {
        flags: MessageFlags.IsComponentsV2,
        components: [
            container,
            row1,
            row2
        ]
    };
}

module.exports = {
    name: 'botconfig',
    description: 'Configure le profil du bot sur ce serveur.',

    createPanel,

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({
                content: '❌ Vous devez avoir la permission **Gérer le serveur**.',
                allowedMentions: {
                    repliedUser: false
                }
            });
        }

        const config = guildConfig.getAll(message.guild.id);

        return message.reply({
            ...createPanel(message.guild, config),
            allowedMentions: {
                repliedUser: false
            }
        });
    }
};
