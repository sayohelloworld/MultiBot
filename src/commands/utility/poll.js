const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Crée un sondage interactif `+poll [question]`.',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const question = args.join(' ').trim();

        if (!question) {
            return message.reply(
                '❌ Vous devez fournir une question.\n\n' +
                '**Exemple :** `+poll Est-ce que vous aimez ce serveur ?`'
            );
        }

        if (question.length > 1000) {
            return message.reply(
                '❌ La question ne peut pas dépasser **1000 caractères**.'
            );
        }

        const votes = new Map();

        let yesVotes = 0;
        let noVotes = 0;

        const serverIcon = message.guild?.iconURL({
            extension: 'png',
            size: 256
        });

        const getContainer = () => {
            const totalVotes = yesVotes + noVotes;

            const yesPercentage = totalVotes > 0
                ? Math.round((yesVotes / totalVotes) * 100)
                : 0;

            const noPercentage = totalVotes > 0
                ? Math.round((noVotes / totalVotes) * 100)
                : 0;

            const container = new ContainerBuilder();

            if (serverIcon) {
                container.addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `# 📊 Sondage\n\n` +
                                `## ${question}`
                            )
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder({
                                media: {
                                    url: serverIcon
                                }
                            })
                        )
                );
            } else {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 📊 Sondage\n\n` +
                        `## ${question}`
                    )
                );
            }

            container
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**👍 Oui :** ${yesVotes} (${yesPercentage}%)\n` +
                        `**👎 Non :** ${noVotes} (${noPercentage}%)\n\n` +
                        `**Total des votes :** ${totalVotes}`
                    )
                );

            return container;
        };

        const getButtons = () => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('poll_yes')
                        .setLabel(`Oui (${yesVotes})`)
                        .setEmoji('👍')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('poll_no')
                        .setLabel(`Non (${noVotes})`)
                        .setEmoji('👎')
                        .setStyle(ButtonStyle.Danger)
                );
        };

        const pollMessage = await message.channel.send({
            components: [
                getContainer(),
                getButtons()
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const collector = pollMessage.createMessageComponentCollector({
            time: 24 * 60 * 60 * 1000
        });

        collector.on('collect', async (interaction) => {
            const userId = interaction.user.id;

            if (votes.has(userId)) {
                return interaction.reply({
                    content: '❌ Vous avez déjà voté dans ce sondage.',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'poll_yes') {
                yesVotes++;
                votes.set(userId, 'yes');
            }

            if (interaction.customId === 'poll_no') {
                noVotes++;
                votes.set(userId, 'no');
            }

            await interaction.update({
                components: [
                    getContainer(),
                    getButtons()
                ],
                flags: MessageFlags.IsComponentsV2
            });
        });

        collector.on('end', async () => {
            const totalVotes = yesVotes + noVotes;

            const yesPercentage = totalVotes > 0
                ? Math.round((yesVotes / totalVotes) * 100)
                : 0;

            const noPercentage = totalVotes > 0
                ? Math.round((noVotes / totalVotes) * 100)
                : 0;

            const finalContainer = new ContainerBuilder();

            if (serverIcon) {
                finalContainer.addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `# 📊 Sondage terminé\n\n` +
                                `## ${question}`
                            )
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder({
                                media: {
                                    url: serverIcon
                                }
                            })
                        )
                );
            } else {
                finalContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 📊 Sondage terminé\n\n` +
                        `## ${question}`
                    )
                );
            }

            finalContainer
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**👍 Oui :** ${yesVotes} (${yesPercentage}%)\n` +
                        `**👎 Non :** ${noVotes} (${noPercentage}%)\n\n` +
                        `**Total des votes :** ${totalVotes}`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `🔒 **Le sondage est maintenant fermé.**`
                    )
                );

            const disabledButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('poll_yes_disabled')
                        .setLabel(`Oui (${yesVotes})`)
                        .setEmoji('👍')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),

                    new ButtonBuilder()
                        .setCustomId('poll_no_disabled')
                        .setLabel(`Non (${noVotes})`)
                        .setEmoji('👎')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

            try {
                await pollMessage.edit({
                    components: [
                        finalContainer,
                        disabledButtons
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
                console.error('[POLL] Impossible de fermer le sondage :', error);
            }
        });
    }
};
