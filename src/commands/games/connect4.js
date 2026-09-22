const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'connect4',
    description: 'Joue au Puissance 4 contre un autre membre',

    async execute(client, message, args) {
        await message.channel.sendTypying();

        const opponent = message.mentions.users.first();

        if (!oppent) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# Puissance\nMentionne un membre avec qui jouer !`
                    )
                );
            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (opponent.id === message.author.id) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Puissance 4\n\nTu ne peux pas jouer contre toi-même.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (opponent.bot) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Puissance 4\n\nTu ne peux pas jouer contre un bot.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const players = [
            message.author,
            opponent
        ];

        const board = Array.from({ length: 6 }, () => Array(7).fill(null));

        let currentPlayer = 0;
        let gameOver = false;

        function renderBoard() {
            let result = '';

            for (let row = 0; row < 6; row++) {
                for (let column = 0; column < 7; column++) {
                    const cell = board[row][column];

                    if (cell === 0) {
                        result += '🔴';
                    } else if (cell === 1) {
                        result += '🟡';
                    } else {
                        result += '⚫';
                    }
                }

                result += '\n';
            }

            result += '\n`1  2  3  4  5  6  7`';

            return result;
        }

        function createButtons(disabled = false) {
            const firstRow = new ActionRowBuilder();
            const secondRow = new ActionRowBuilder();

            for (let column = 0; column < 7; column++) {
                const button = new ButtonBuilder()
                    .setCustomId(`puissance4_${column}`)
                    .setLabel(`${column + 1}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(
                        disabled ||
                        board[0][column] !== null
                    );

                if (column < 4) {
                    firstRow.addComponents(button);
                } else {
                    secondRow.addComponents(button);
                }
            }

            return [firstRow, secondRow];
        }

        function checkWin(player) {
            const directions = [
                [0, 1],
                [1, 0],
                [1, 1],
                [1, -1]
            ];

            for (let row = 0; row < 6; row++) {
                for (let column = 0; column < 7; column++) {
                    if (board[row][column] !== player) {
                        continue;
                    }

                    for (const [rowDirection, columnDirection] of directions) {
                        let count = 1;

                        for (let i = 1; i < 4; i++) {
                            const newRow = row + rowDirection * i;
                            const newColumn = column + columnDirection * i;

                            if (
                                newRow < 0 ||
                                newRow >= 6 ||
                                newColumn < 0 ||
                                newColumn >= 7
                            ) {
                                break;
                            }

                            if (board[newRow][newColumn] === player) {
                                count++;
                            } else {
                                break;
                            }
                        }

                        if (count >= 4) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        function isDraw() {
            return board[0].every(cell => cell !== null);
        }

        function dropPiece(column, player) {
            for (let row = 5; row >= 0; row--) {
                if (board[row][column] === null) {
                    board[row][column] = player;
                    return true;
                }
            }

            return false;
        }

        function createContainer(status) {
            return new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Puissance 4'
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `🔴 <@${players[0].id}>\n🟡 <@${players[1].id}>`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        renderBoard()
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(status)
                );
        }

        const initialContainer = createContainer(
            `C'est au tour de <@${players[currentPlayer].id}>.\nChoisis une colonne avec les boutons ci-dessous.`
        );

        const gameMessage = await message.reply({
            components: [
                initialContainer,
                ...createButtons()
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const collector = gameMessage.createMessageComponentCollector({
            filter: interaction =>
                interaction.user.id === players[0].id ||
                interaction.user.id === players[1].id,
            time: 120000
        });

        collector.on('collect', async interaction => {
            if (gameOver) {
                return;
            }

            if (interaction.user.id !== players[currentPlayer].id) {
                return interaction.reply({
                    content: `Ce n'est pas ton tour. C'est au tour de <@${players[currentPlayer].id}>.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const column = Number(
                interaction.customId.replace('puissance4_', '')
            );

            const player = currentPlayer;

            if (!dropPiece(column, player)) {
                return interaction.reply({
                    content: 'Cette colonne est pleine.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (checkWin(player)) {
                gameOver = true;
                collector.stop('win');

                const winnerEmoji = player === 0 ? '🔴' : '🟡';

                const container = createContainer(
                    `${winnerEmoji} **<@${players[player].id}> a gagné la partie !**`
                );

                return interaction.update({
                    components: [
                        container,
                        ...createButtons(true)
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            if (isDraw()) {
                gameOver = true;
                collector.stop('draw');

                const container = createContainer(
                    '🤝 **Égalité !** Le plateau est rempli.'
                );

                return interaction.update({
                    components: [
                        container,
                        ...createButtons(true)
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            currentPlayer = currentPlayer === 0 ? 1 : 0;

            const nextContainer = createContainer(
                `C'est au tour de <@${players[currentPlayer].id}>.\nChoisis une colonne avec les boutons ci-dessous.`
            );

            await interaction.update({
                components: [
                    nextContainer,
                    ...createButtons()
                ],
                flags: MessageFlags.IsComponentsV2
            });
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'win' || reason === 'draw') {
                return;
            }

            if (gameOver) {
                return;
            }

            gameOver = true;

            const container = createContainer(
                '⏱️ **Partie annulée.** Personne n\'a joué pendant 2 minutes.'
            );

            try {
                await gameMessage.edit({
                    components: [
                        container,
                        ...createButtons(true)
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
                console.error(error);
            }
        });
    }
};
