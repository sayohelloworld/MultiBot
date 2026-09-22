const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

const warningsDatabase = require('../../utils/warningsDatabase');

module.exports = {
    name: 'cases',
    description: 'Afficher les dossiers de modération d’un membre',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const guild = message.guild;
        const moderator = message.member;

        const isOwner = guild.ownerId === moderator.id;

        const isAdministrator =
            moderator.permissions.has(
                PermissionsBitField.Flags.Administrator
            );

        const authorizedRoles =
            warningsDatabase.getPermissions(guild.id);

        const hasAuthorizedRole =
            moderator.roles.cache.some(role =>
                authorizedRoles.includes(role.id)
            );

        if (!isOwner && !isAdministrator && !hasAuthorizedRole) {
            return message.reply(
                "Tu n'as pas la permission d'utiliser cette commande."
            );
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                "Mentionne un membre pour voir ses dossiers de modération."
            );
        }

        let cases;

        try {
            cases = warningsDatabase.getUserWarnings(
                guild.id,
                member.id
            );
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des cases :',
                error
            );

            return message.reply(
                "Une erreur est survenue lors de la récupération des dossiers."
            );
        }

        if (!cases || cases.length === 0) {
            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Dossiers de modération\n\n` +
                    `Aucun dossier trouvé pour **${this.escapeMarkdown(member.user.tag)}**.`
                )
            );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const casesPerPage = 5;

        const pages = [];

        for (
            let i = 0;
            i < cases.length;
            i += casesPerPage
        ) {
            pages.push(
                cases.slice(
                    i,
                    i + casesPerPage
                )
            );
        }

        let page = 0;

        const getModeratorName = moderatorId => {
            const moderatorMember =
                guild.members.cache.get(moderatorId);

            if (moderatorMember) {
                return moderatorMember.user.tag;
            }

            return 'Modérateur inconnu';
        };

        const getCaseId = (caseData, index) => {
            if (caseData.id !== undefined && caseData.id !== null) {
                return String(caseData.id);
            }

            if (
                caseData.caseId !== undefined &&
                caseData.caseId !== null
            ) {
                return String(caseData.caseId);
            }

            return String(
                page * casesPerPage + index + 1
            );
        };

        const createContainer = () => {
            const container = new ContainerBuilder();

            let content =
                `## Dossiers de modération\n` +
                `**Membre :** ${this.escapeMarkdown(member.user.tag)}\n` +
                `**Total :** ${cases.length}\n\n`;

            pages[page].forEach((caseData, index) => {
                const globalIndex =
                    page * casesPerPage + index;

                const caseId =
                    getCaseId(caseData, index);

                const date = caseData.createdAt
                    ? new Date(
                        caseData.createdAt
                    ).toLocaleString('fr-FR')
                    : 'Date inconnue';

                const moderatorName =
                    getModeratorName(
                        caseData.moderatorId
                    );

                const reason =
                    caseData.reason ||
                    'Aucune raison';

                content +=
                    `### Case #${caseId}\n` +
                    `**Type :** Avertissement\n` +
                    `**Utilisateur :** ${this.escapeMarkdown(member.user.tag)}\n` +
                    `**Modérateur :** ${this.escapeMarkdown(moderatorName)}\n` +
                    `**Date :** ${date}\n` +
                    `**Raison :** ${this.escapeMarkdown(reason)}\n\n`;

                if (
                    globalIndex <
                    cases.length - 1
                ) {
                    content += `---\n\n`;
                }
            });

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(content)
            );

            if (pages.length > 1) {
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );
            }

            return container;
        };

        const createButtons = () => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('cases_previous')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),

                    new ButtonBuilder()
                        .setCustomId('cases_page')
                        .setLabel(
                            `Page ${page + 1}/${pages.length}`
                        )
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),

                    new ButtonBuilder()
                        .setCustomId('cases_next')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(
                            page === pages.length - 1
                        )
                );
        };

        const components = [
            createContainer()
        ];

        if (pages.length > 1) {
            components.push(
                createButtons()
            );
        }

        const reply = await message.reply({
            components,
            flags: MessageFlags.IsComponentsV2
        });

        if (pages.length <= 1) {
            return;
        }

        const collector =
            reply.createMessageComponentCollector({
                time: 120000
            });

        collector.on(
            'collect',
            async interaction => {
                if (
                    interaction.user.id !==
                    message.author.id
                ) {
                    return interaction.reply({
                        content:
                            "Tu ne peux pas utiliser ces boutons.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (
                    interaction.customId ===
                    'cases_previous' &&
                    page > 0
                ) {
                    page--;
                }

                if (
                    interaction.customId ===
                    'cases_next' &&
                    page < pages.length - 1
                ) {
                    page++;
                }

                await interaction.update({
                    components: [
                        createContainer(),
                        createButtons()
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        );

        collector.on(
            'end',
            async () => {
                try {
                    await reply.edit({
                        components: [
                            createContainer()
                        ],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch {}
            }
        );
    },

    escapeMarkdown(text) {
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1');
    }
};
