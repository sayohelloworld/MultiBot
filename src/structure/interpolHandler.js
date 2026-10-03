const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');

const crypto = require('crypto');

const games = new Map();

function createGame(data) {
    games.set(data.id, {
        ...data,
        ended: false
    });
}

async function execute(interaction) {
    if (!interaction.isButton()) return;

    if (!interaction.customId.startsWith('interpol_')) return;

    const separatorIndex = interaction.customId.indexOf(':');

    if (separatorIndex === -1) {
        return interaction.reply({
            content: '❌ Interaction invalide.',
            ephemeral: true
        });
    }

    const action = interaction.customId.substring(0, separatorIndex);
    const gameId = interaction.customId.substring(separatorIndex + 1);

    const game = games.get(gameId);

    if (!game) {
        return interaction.reply({
            content: '❌ Cette partie n’existe plus.',
            ephemeral: true
        });
    }

    if (interaction.user.id !== game.createdBy) {
        return interaction.reply({
            content: '❌ Seule la personne ayant lancé la commande peut répondre.',
            ephemeral: true
        });
    }

    if (game.ended) {
        return interaction.reply({
            content: '❌ Le verdict a déjà été donné.',
            ephemeral: true
        });
    }

    if (
        action !== 'interpol_linkedin' &&
        action !== 'interpol_interpol'
    ) {
        return interaction.reply({
            content: '❌ Choix invalide.',
            ephemeral: true
        });
    }

    game.ended = true;

    const verdict = crypto.randomInt(0, 2);
    const isInterpol = verdict === 1;

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                isInterpol
                    ? `# 🚨 PROFIL RECHERCHÉ

## ${game.targetUsername}

**Verdict : INTERPOL**

Cette personne vient officiellement d'attirer l'attention d'INTERPOL.`
                    : `# 💼 PROFIL LINKEDIN

## ${game.targetUsername}

**Verdict : LINKEDIN**

Cette personne peut tranquillement retourner sur LinkedIn.`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder()
                .addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(game.avatar)
                        .setDescription(`Photo de profil de ${game.targetUsername}`)
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '⚠️ Verdict fictif réalisé uniquement dans le cadre du jeu.'
            )
        );

    await interaction.update({
        components: [
            container
        ]
    });

    games.delete(gameId);
}

module.exports = {
    createGame,
    execute
};
