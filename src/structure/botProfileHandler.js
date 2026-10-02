const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const guildConfig = require('../utils/guildConfig');

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function getProfileConfig(guildId) {
    return guildConfig.getAll(guildId).botProfileConfig || {
        nickname: null,
        avatar: null,
        banner: null,
        bio: null
    };
}

function createPanel(guild, config) {
    const profile = config.botProfileConfig || {};

    const nickname = profile.nickname || 'Non configuré';
    const avatar = profile.avatar
        ? `[Voir l'image](${profile.avatar})`
        : 'Non configuré';
    const banner = profile.banner
        ? `[Voir l'image](${profile.banner})`
        : 'Non configuré';
    const bio = profile.bio || 'Non configurée';

    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 🤖 Profil du bot\n` +
                `Configuration du profil sur **${guild.name}**.\n\n` +
                `**✏️ Pseudo**\n${nickname}\n\n` +
                `**🖼️ Avatar**\n${avatar}\n\n` +
                `**🎨 Bannière**\n${banner}\n\n` +
                `**📝 Bio**\n${bio}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Les paramètres sont propres à ce serveur.`
            )
        );
}

function createButtons() {
    const row1 = new ActionRowBuilder().addComponents(
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_nickname')
            .setLabel('Pseudo')
            .setEmoji('✏️')
            .setStyle(require('discord.js').ButtonStyle.Primary),
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_avatar')
            .setLabel('Avatar')
            .setEmoji('🖼️')
            .setStyle(require('discord.js').ButtonStyle.Primary),
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_banner')
            .setLabel('Bannière')
            .setEmoji('🎨')
            .setStyle(require('discord.js').ButtonStyle.Primary),
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_bio')
            .setLabel('Bio')
            .setEmoji('📝')
            .setStyle(require('discord.js').ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_preview')
            .setLabel('Aperçu')
            .setEmoji('👁️')
            .setStyle(require('discord.js').ButtonStyle.Secondary),
        new (require('discord.js').ButtonBuilder)()
            .setCustomId('botprofile_reset')
            .setLabel('Réinitialiser')
            .setEmoji('♻️')
            .setStyle(require('discord.js').ButtonStyle.Danger)
    );

    return [row1, row2];
}

function createModal(type) {
    const data = {
        nickname: {
            title: 'Modifier le pseudo',
            label: 'Pseudo',
            placeholder: 'Nouveau pseudo du bot'
        },
        avatar: {
            title: 'Modifier l’avatar',
            label: 'URL de l’avatar',
            placeholder: 'https://exemple.com/avatar.png'
        },
        banner: {
            title: 'Modifier la bannière',
            label: 'URL de la bannière',
            placeholder: 'https://exemple.com/banner.png'
        },
        bio: {
            title: 'Modifier la bio',
            label: 'Bio',
            placeholder: 'Description du bot sur ce serveur'
        }
    };

    const current = data[type];

    const input = new TextInputBuilder()
        .setCustomId(`botprofile_value_${type}`)
        .setLabel(current.label)
        .setPlaceholder(current.placeholder)
        .setRequired(type !== 'bio')
        .setStyle(
            type === 'bio'
                ? TextInputStyle.Paragraph
                : TextInputStyle.Short
        );

    if (type === 'nickname') {
        input.setMaxLength(32);
    }

    if (type === 'bio') {
        input.setMaxLength(190);
    }

    return new ModalBuilder()
        .setCustomId(`botprofile_modal_${type}`)
        .setTitle(current.title)
        .addComponents(
            new ActionRowBuilder().addComponents(input)
        );
}

async function downloadImage(url) {
    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        throw new Error('URL invalide.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('L’URL doit utiliser HTTP ou HTTPS.');
    }

    const response = await fetch(url, {
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error('Impossible de récupérer cette image.');
    }

    const contentType =
        response.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
        throw new Error('L’URL fournie ne correspond pas à une image.');
    }

    const contentLength =
        Number(response.headers.get('content-length') || 0);

    if (contentLength > MAX_IMAGE_SIZE) {
        throw new Error('L’image ne doit pas dépasser 8 Mo.');
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
        throw new Error('L’image ne doit pas dépasser 8 Mo.');
    }

    return Buffer.from(arrayBuffer);
}

async function applyProfile(guild, profile) {
    const options = {
        nick: profile.nickname || null,
        bio: profile.bio || null
    };

    if (profile.avatar) {
        options.avatar = await downloadImage(profile.avatar);
    } else {
        options.avatar = null;
    }

    if (profile.banner) {
        options.banner = await downloadImage(profile.banner);
    } else {
        options.banner = null;
    }

    return guild.members.editMe(options);
}

function buildReply(guild, config) {
    return {
        flags: MessageFlags.IsComponentsV2,
        components: [
            createPanel(guild, config),
            ...createButtons()
        ]
    };
}

async function showPreview(interaction) {
    const member = await interaction.guild.members.fetchMe();

    const avatar =
        member.displayAvatarURL({
            size: 512,
            extension: 'png'
        });

    const banner =
        member.displayBannerURL({
            size: 1024,
            extension: 'png'
        });

    const profile = getProfileConfig(
        interaction.guild.id
    );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 👁️ Aperçu du profil\n\n` +
                `**Pseudo**\n${member.nickname || interaction.client.user.username}\n\n` +
                `**Bio**\n${profile.bio || 'Aucune bio configurée'}\n\n` +
                `**Avatar**\n${avatar}\n\n` +
                `**Bannière**\n${banner || 'Aucune bannière configurée'}`
            )
        );

    return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
    });
}

module.exports = {
    async execute(interaction) {
        if (!interaction.guild) return;

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return interaction.reply({
                content: '❌ Vous devez avoir la permission **Gérer le serveur**.',
                flags: MessageFlags.Ephemeral
            });
        }

        const id = interaction.customId;

        if (id === 'botprofile_preview') {
            return showPreview(interaction);
        }

        if (id === 'botprofile_reset') {
            guildConfig.set(
                interaction.guild.id,
                'botProfileConfig',
                {
                    nickname: null,
                    avatar: null,
                    banner: null,
                    bio: null
                }
            );

            try {
                await interaction.guild.members.editMe({
                    nick: null,
                    avatar: null,
                    banner: null,
                    bio: null
                });
            } catch (error) {
                console.error(
                    `[BOT PROFILE] Réinitialisation impossible : ${error.message}`
                );

                return interaction.reply({
                    content: '❌ Impossible de réinitialiser le profil du bot.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const config = guildConfig.getAll(
                interaction.guild.id
            );

            return interaction.update(
                buildReply(interaction.guild, config)
            );
        }

        const buttonTypes = [
            'nickname',
            'avatar',
            'banner',
            'bio'
        ];

        if (
            interaction.isButton() &&
            buttonTypes.includes(
                id.replace('botprofile_', '')
            )
        ) {
            const type = id.replace(
                'botprofile_',
                ''
            );

            return interaction.showModal(
                createModal(type)
            );
        }

        if (!interaction.isModalSubmit()) return;

        if (!id.startsWith('botprofile_modal_')) {
            return;
        }

        const type = id.replace(
            'botprofile_modal_',
            ''
        );

        if (
            !buttonTypes.includes(type)
        ) {
            return;
        }

        const value =
            interaction.fields.getTextInputValue(
                `botprofile_value_${type}`
            ).trim();

        const config = guildConfig.getAll(
            interaction.guild.id
        );

        const profile = {
            ...(config.botProfileConfig || {
                nickname: null,
                avatar: null,
                banner: null,
                bio: null
            })
        };

        if (type === 'nickname') {
            profile.nickname = value || null;
        }

        if (type === 'bio') {
            profile.bio = value || null;
        }

        if (type === 'avatar') {
            try {
                new URL(value);
            } catch {
                return interaction.reply({
                    content: '❌ L’URL de l’avatar est invalide.',
                    flags: MessageFlags.Ephemeral
                });
            }

            profile.avatar = value;
        }

        if (type === 'banner') {
            try {
                new URL(value);
            } catch {
                return interaction.reply({
                    content: '❌ L’URL de la bannière est invalide.',
                    flags: MessageFlags.Ephemeral
                });
            }

            profile.banner = value;
        }

        try {
            guildConfig.set(
                interaction.guild.id,
                'botProfileConfig',
                profile
            );

            await applyProfile(
                interaction.guild,
                profile
            );
        } catch (error) {
            console.error(
                `[BOT PROFILE] Modification impossible : ${error.message}`
            );

            return interaction.reply({
                content:
                    `❌ Impossible de modifier le profil du bot.\n` +
                    `\`${error.message}\``,
                flags: MessageFlags.Ephemeral
            });
        }

        const updatedConfig = guildConfig.getAll(
            interaction.guild.id
        );

        return interaction.update(
            buildReply(
                interaction.guild,
                updatedConfig
            )
        );
    }
};
