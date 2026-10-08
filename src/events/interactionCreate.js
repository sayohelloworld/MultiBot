const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profileScanHandler = require("./profileScanHandler");
const botProfileHandler = require("../structure/botProfileHandler");
const welcomeHandler = require("../structure/welcomeHandler");

const file = path.join(__dirname, "../../data/questions.json");

function loadData() {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

module.exports = {
    name: "interactionCreate",
    once: false,

    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(
                interaction.commandName
            );

            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: "Une erreur est survenue.",
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                }
            }

            return;
        }

        if (!interaction.guild) return;

        const welcomeIds = [
            "welcome_channel",
            "welcome_message",
            "welcome_ping_role",
            "welcome_ping_toggle",
            "welcome_status_toggle",
            "welcome_preview",
            "welcome_reset",
            "welcome_channel_select",
            "welcome_ping_role_select",
            "welcome_message_modal"
        ];

        if (
            (
                interaction.isButton() ||
                interaction.isModalSubmit() ||
                interaction.isChannelSelectMenu() ||
                interaction.isRoleSelectMenu()
            ) &&
            welcomeIds.includes(interaction.customId)
        ) {
            return welcomeHandler.execute(interaction);
        }

        if (
            (
                interaction.isButton() ||
                interaction.isModalSubmit()
            ) &&
            interaction.customId.startsWith("botprofile_")
        ) {
            return botProfileHandler.execute(interaction);
        }

        if (
            interaction.isButton() &&
            (
                interaction.customId === "scan_profil_start" ||
                interaction.customId === "scan_profil_launch" ||
                interaction.customId.startsWith("scan_profil_like:")
            )
        ) {
            return profileScanHandler.execute(interaction);
        }

        const data = loadData();

        if (!data[interaction.guild.id]) {
            data[interaction.guild.id] = {
                channel: null,
                title: null,
                description: null,
                answers: [],
                correct: null,
                answered: []
            };

            saveData(data);
        }

        const question = data[interaction.guild.id];

        if (interaction.isButton()) {
            if (interaction.customId === "question_channel") {
                return interaction.reply({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId("question_channel_select")
                                .setPlaceholder("Choisir un salon")
                        )
                    ],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (
                [
                    "question_title",
                    "question_description",
                    "question_answer_add",
                    "question_correct"
                ].includes(interaction.customId)
            ) {
                const modal = new ModalBuilder()
                    .setCustomId(
                        `${interaction.customId}_modal`
                    )
                    .setTitle("Configuration question");

                const input = new TextInputBuilder()
                    .setCustomId("value")
                    .setLabel(
                        interaction.customId === "question_title"
                            ? "Question"
                            : interaction.customId === "question_description"
                                ? "Description"
                                : interaction.customId === "question_answer_add"
                                    ? "Réponse"
                                    : "Bonne réponse"
                    )
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(
                        interaction.customId !==
                        "question_description"
                    );

                modal.addComponents(
                    new ActionRowBuilder().addComponents(input)
                );

                return interaction.showModal(modal);
            }

            if (interaction.customId === "question_publish") {
                if (
                    !question.channel ||
                    !question.title ||
                    !question.correct
                ) {
                    return interaction.reply({
                        content: "❌ Configuration incomplète.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                const channel =
                    interaction.guild.channels.cache.get(
                        question.channel
                    );

                if (!channel) {
                    return interaction.reply({
                        content: "❌ Salon introuvable.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
`# ❓ Question du jour

${question.title}

${question.description ?? ""}`
                            )
                    );

                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("question_answer")
                            .setLabel("Répondre")
                            .setStyle(ButtonStyle.Primary)
                    );

                await channel.send({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        container,
                        button
                    ]
                });

                question.answered = [];

                saveData(data);

                return interaction.reply({
                    content: "✅ Question publiée.",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId === "question_answer") {
                const modal = new ModalBuilder()
                    .setCustomId("question_answer_modal")
                    .setTitle("Réponse");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("answer")
                            .setLabel("Ta réponse")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

                return interaction.showModal(modal);
            }

            return;
        }

        if (interaction.isChannelSelectMenu()) {
            if (
                interaction.customId ===
                "question_channel_select"
            ) {
                question.channel = interaction.values[0];

                saveData(data);

                return interaction.update({
                    content: "✅ Salon enregistré.",
                    components: []
                });
            }

            return;
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "question_answer_modal") {
                if (
                    question.answered.includes(
                        interaction.user.id
                    )
                ) {
                    return interaction.reply({
                        content: "❌ Tu as déjà répondu.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                const answer =
                    interaction.fields.getTextInputValue(
                        "answer"
                    );

                question.answered.push(
                    interaction.user.id
                );

                saveData(data);

                return interaction.reply({
                    content:
                        answer.toLowerCase() ===
                        question.correct.toLowerCase()
                            ? "✅ Bonne réponse !"
                            : "❌ Mauvaise réponse.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const questionModalIds = [
                "question_title_modal",
                "question_description_modal",
                "question_answer_add_modal",
                "question_correct_modal"
            ];

            if (!questionModalIds.includes(interaction.customId)) {
                return;
            }

            const value =
                interaction.fields.getTextInputValue(
                    "value"
                );

            if (
                interaction.customId ===
                "question_title_modal"
            ) {
                question.title = value;
            }

            if (
                interaction.customId ===
                "question_description_modal"
            ) {
                question.description = value || null;
            }

            if (
                interaction.customId ===
                "question_answer_add_modal"
            ) {
                question.answers.push(value);
            }

            if (
                interaction.customId ===
                "question_correct_modal"
            ) {
                question.correct = value;
            }

            saveData(data);

            return interaction.reply({
                content: "✅ Enregistré.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
