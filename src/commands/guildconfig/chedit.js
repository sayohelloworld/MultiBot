const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    RoleSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

module.exports = {
    name: 'chedit',
    description: 'Modifie les paramètres d’un salon',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Modification de salon\n\nTu n\'as pas la permission **Gérer les salons**.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const channelId = args[0];

        if (!channelId) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Modification de salon\n\nIndique l\'ID du salon à modifier.\n\n**Exemple :** `+chedit 123456789012345678`'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        let channel;

        try {
            channel = await client.channels.fetch(channelId);
        } catch {
            channel = null;
        }

        if (!channel || !channel.guild) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Modification de salon\n\nAucun salon valide ne correspond à cet ID.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (channel.guild.id !== message.guild.id) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Modification de salon\n\nCe salon n\'appartient pas à ce serveur.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!channel.manageable) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Modification de salon\n\nJe ne peux pas modifier ce salon. Vérifie mes permissions et la hiérarchie du serveur.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`chedit_menu_${message.author.id}`)
            .setPlaceholder('Choisir une modification')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Modifier le nom')
                    .setDescription('Changer le nom du salon')
                    .setValue('name'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Modifier la visibilité')
                    .setDescription('Rendre le salon public ou privé')
                    .setValue('visibility'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Modifier les permissions')
                    .setDescription('Gérer les permissions d’un rôle')
                    .setValue('permissions'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Modifier le NSFW')
                    .setDescription('Activer ou désactiver le mode NSFW')
                    .setValue('nsfw'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Salon annonce')
                    .setDescription('Voir les informations concernant le mode annonce')
                    .setValue('announcement')
            );

        const row = new ActionRowBuilder()
            .addComponents(menu);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Modification de salon\n\n` +
                    `**Salon :** <#${channel.id}>\n` +
                    `**ID :** \`${channel.id}\`\n` +
                    `**Nom :** ${channel.name}\n` +
                    `**Type :** ${getChannelType(channel)}\n` +
                    `**NSFW :** ${channel.nsfw ? 'Oui' : 'Non'}\n` +
                    `**Annonce :** ${channel.type === ChannelType.GuildAnnouncement ? 'Oui' : 'Non'}\n\n` +
                    `Sélectionne le paramètre que tu souhaites modifier.`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );

        const sentMessage = await message.reply({
            components: [
                container,
                row
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const collector = sentMessage.createMessageComponentCollector({
            time: 300000,
            filter: interaction => interaction.user.id === message.author.id
        });

        collector.on('collect', async interaction => {
            if (interaction.isStringSelectMenu()) {
                const selected = interaction.values[0];

                if (selected === 'name') {
                    const modal = new ModalBuilder()
                        .setCustomId(`chedit_name_${message.author.id}`)
                        .setTitle('Modifier le nom');

                    const input = new TextInputBuilder()
                        .setCustomId('channel_name')
                        .setLabel('Nouveau nom')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(100)
                        .setValue(channel.name);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(input)
                    );

                    return interaction.showModal(modal);
                }

                if (selected === 'visibility') {
                    const visibilityMenu = new StringSelectMenuBuilder()
                        .setCustomId(`chedit_visibility_${message.author.id}`)
                        .setPlaceholder('Choisir la visibilité')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Public')
                                .setDescription('Tout le monde peut voir le salon')
                                .setValue('public'),

                            new StringSelectMenuOptionBuilder()
                                .setLabel('Privé')
                                .setDescription('Seuls les rôles autorisés peuvent voir le salon')
                                .setValue('private')
                        );

                    const visibilityContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '## Visibilité du salon\n\nChoisis si le salon doit être public ou privé.'
                            )
                        );

                    return interaction.update({
                        components: [
                            visibilityContainer,
                            new ActionRowBuilder().addComponents(visibilityMenu)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }

                if (selected === 'permissions') {
                    const roleMenu = new RoleSelectMenuBuilder()
                        .setCustomId(`chedit_role_${message.author.id}`)
                        .setPlaceholder('Sélectionner un rôle');

                    const permissionsContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '## Permissions du salon\n\nSélectionne le rôle dont tu veux modifier les permissions.'
                            )
                        );

                    return interaction.update({
                        components: [
                            permissionsContainer,
                            new ActionRowBuilder().addComponents(roleMenu)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }

                if (selected === 'nsfw') {
                    const nsfwMenu = new StringSelectMenuBuilder()
                        .setCustomId(`chedit_nsfw_${message.author.id}`)
                        .setPlaceholder('Choisir une option')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Activer le NSFW')
                                .setValue('true'),

                            new StringSelectMenuOptionBuilder()
                                .setLabel('Désactiver le NSFW')
                                .setValue('false')
                        );

                    const nsfwContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## Mode NSFW\n\n` +
                                `État actuel : **${channel.nsfw ? 'Activé' : 'Désactivé'}**\n\n` +
                                `Choisis le nouvel état du salon.`
                            )
                        );

                    return interaction.update({
                        components: [
                            nsfwContainer,
                            new ActionRowBuilder().addComponents(nsfwMenu)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }

                if (selected === 'announcement') {
                    const isAnnouncement = channel.type === ChannelType.GuildAnnouncement;

                    const announcementContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## Salon annonce\n\n` +
                                `**État actuel :** ${isAnnouncement ? 'Salon d’annonce' : 'Salon classique'}\n\n` +
                                `Le type **salon d’annonce** ne peut pas être activé ou désactivé après la création du salon par l'API Discord.\n\n` +
                                `Pour obtenir un salon d’annonce, il faut créer un nouveau salon de type annonce.`
                            )
                        );

                    return interaction.update({
                        components: [
                            announcementContainer,
                            createBackButton(message.author.id)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }

                if (selected.startsWith('back')) {
                    return interaction.update({
                        components: [
                            createMainContainer(channel),
                            row
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                }
            }

            if (interaction.isRoleSelectMenu()) {
                const role = interaction.roles.first();

                if (!role) {
                    return interaction.reply({
                        content: 'Rôle invalide.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const permissionMenu = new StringSelectMenuBuilder()
                    .setCustomId(`chedit_permissions_${message.author.id}_${role.id}`)
                    .setPlaceholder('Sélectionner les permissions')
                    .setMinValues(1)
                    .setMaxValues(5)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Voir le salon')
                            .setValue('ViewChannel'),

                        new StringSelectMenuOptionBuilder()
                            .setLabel('Envoyer des messages')
                            .setValue('SendMessages'),

                        new StringSelectMenuOptionBuilder()
                            .setLabel('Lire l’historique')
                            .setValue('ReadMessageHistory'),

                        new StringSelectMenuOptionBuilder()
                            .setLabel('Ajouter des réactions')
                            .setValue('AddReactions'),

                        new StringSelectMenuOptionBuilder()
                            .setLabel('Joindre des fichiers')
                            .setValue('AttachFiles')
                    );

                const permissionContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## Permissions du salon\n\n` +
                            `**Rôle sélectionné :** <@&${role.id}>\n\n` +
                            `Sélectionne les permissions que tu souhaites **autoriser** pour ce rôle.`
                        )
                    );

                return interaction.update({
                    components: [
                        permissionContainer,
                        new ActionRowBuilder().addComponents(permissionMenu),
                        createBackButton(message.author.id)
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            if (interaction.isStringSelectMenu() && interaction.customId.startsWith('chedit_visibility_')) {
                const visibility = interaction.values[0];

                try {
                    if (visibility === 'public') {
                        await channel.permissionOverwrites.edit(
                            message.guild.roles.everyone,
                            {
                                ViewChannel: true
                            }
                        );
                    } else {
                        await channel.permissionOverwrites.edit(
                            message.guild.roles.everyone,
                            {
                                ViewChannel: false
                            }
                        );
                    }

                    const resultContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## Visibilité modifiée\n\nLe salon <#${channel.id}> est maintenant **${visibility === 'public' ? 'public' : 'privé'}**.`
                            )
                        );

                    return interaction.update({
                        components: [
                            resultContainer,
                            createBackButton(message.author.id)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch (error) {
                    return interaction.reply({
                        content: 'Une erreur est survenue lors de la modification de la visibilité.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            if (interaction.isStringSelectMenu() && interaction.customId.startsWith('chedit_nsfw_')) {
                const value = interaction.values[0] === 'true';

                try {
                    await channel.setNSFW(value);

                    const resultContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## NSFW modifié\n\nLe mode NSFW est maintenant **${value ? 'activé' : 'désactivé'}** sur <#${channel.id}>.`
                            )
                        );

                    return interaction.update({
                        components: [
                            resultContainer,
                            createBackButton(message.author.id)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch {
                    return interaction.reply({
                        content: 'Une erreur est survenue lors de la modification du mode NSFW.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            if (interaction.isStringSelectMenu() && interaction.customId.startsWith('chedit_permissions_')) {
                const parts = interaction.customId.split('_');
                const roleId = parts[3];
                const permissions = interaction.values;

                try {
                    const overwrite = {};

                    for (const permission of permissions) {
                        overwrite[permission] = true;
                    }

                    await channel.permissionOverwrites.edit(roleId, overwrite);

                    const permissionNames = {
                        ViewChannel: 'Voir le salon',
                        SendMessages: 'Envoyer des messages',
                        ReadMessageHistory: 'Lire l’historique',
                        AddReactions: 'Ajouter des réactions',
                        AttachFiles: 'Joindre des fichiers'
                    };

                    const list = permissions
                        .map(permission => `• ${permissionNames[permission]}`)
                        .join('\n');

                    const resultContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## Permissions modifiées\n\n` +
                                `**Rôle :** <@&${roleId}>\n\n` +
                                `**Permissions autorisées :**\n${list}`
                            )
                        );

                    return interaction.update({
                        components: [
                            resultContainer,
                            createBackButton(message.author.id)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch {
                    return interaction.reply({
                        content: 'Une erreur est survenue lors de la modification des permissions.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            if (interaction.isButton() && interaction.customId === `chedit_back_${message.author.id}`) {
                return interaction.update({
                    components: [
                        createMainContainer(channel),
                        row
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            if (interaction.isModalSubmit() && interaction.customId === `chedit_name_${message.author.id}`) {
                const newName = interaction.fields.getTextInputValue('channel_name').trim();

                if (!newName) {
                    return interaction.reply({
                        content: 'Le nom du salon ne peut pas être vide.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                try {
                    await channel.setName(
                        newName,
                        `Modification via +chedit par ${message.author.tag}`
                    );

                    const resultContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## Nom modifié\n\nLe salon a été renommé en **#${channel.name}**.`
                            )
                        );

                    return interaction.update({
                        components: [
                            resultContainer,
                            createBackButton(message.author.id)
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch {
                    return interaction.reply({
                        content: 'Une erreur est survenue lors de la modification du nom.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        });

        collector.on('end', async () => {
            try {
                await sentMessage.edit({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `## Modification de salon\n\nLa session de modification a expiré.`
                                )
                            )
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch {}
        });
    }
};

function getChannelType(channel) {
    const types = {
        [ChannelType.GuildText]: 'Texte',
        [ChannelType.GuildAnnouncement]: 'Annonce',
        [ChannelType.GuildVoice]: 'Vocal',
        [ChannelType.GuildCategory]: 'Catégorie',
        [ChannelType.GuildForum]: 'Forum',
        [ChannelType.GuildStageVoice]: 'Stage'
    };

    return types[channel.type] || 'Inconnu';
}

function createMainContainer(channel) {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Modification de salon\n\n` +
                `**Salon :** <#${channel.id}>\n` +
                `**ID :** \`${channel.id}\`\n` +
                `**Nom :** ${channel.name}\n` +
                `**Type :** ${getChannelType(channel)}\n` +
                `**NSFW :** ${channel.nsfw ? 'Oui' : 'Non'}\n` +
                `**Annonce :** ${channel.type === ChannelType.GuildAnnouncement ? 'Oui' : 'Non'}\n\n` +
                `Sélectionne le paramètre que tu souhaites modifier.`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        );
}

function createBackButton(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`chedit_back_${userId}`)
                .setLabel('Retour')
                .setStyle(ButtonStyle.Secondary)
        );
}
