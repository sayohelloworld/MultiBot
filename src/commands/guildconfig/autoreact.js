const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/autoreact.json');

function loadData() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, '{}', 'utf8');
    }

    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), 'utf8');
}

function parseEmoji(emoji) {
    const customEmoji = emoji.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);

    if (customEmoji) {
        return {
            value: emoji,
            name: customEmoji[1],
            id: customEmoji[2]
        };
    }

    return {
        value: emoji,
        name: emoji,
        id: null
    };
}

module.exports = {
    name: 'autoreact',
    description: 'Gère les réactions automatiques du serveur',

    async execute(client, message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent('Vous devez avoir la permission **Gérer le serveur** pour utiliser cette commande.')
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        const data = loadData();
        const guildId = message.guild.id;

        if (!data[guildId]) {
            data[guildId] = {};
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent(
                            '`+autoreact add #salon 👍` — Ajouter une réaction\n' +
                            '`+autoreact remove #salon 👍` — Retirer une réaction\n' +
                            '`+autoreact list` — Voir les AutoReact configurés\n' +
                            '`+autoreact clear #salon` — Vider un salon\n' +
                            '`+autoreact clearall` — Tout supprimer'
                        )
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        if (subCommand === 'add') {
            const channel = message.mentions.channels.first();

            if (!channel) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent('Utilisation : `+autoreact add #salon 👍`')
                            )
                    ]
                });
            }

            const channelMention = `<#${channel.id}>`;
            const channelIndex = args.indexOf(channelMention);
            const emojis = args.slice(channelIndex + 1);

            if (emojis.length === 0) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent('Tu dois indiquer au moins une réaction.')
                            )
                    ]
                });
            }

            if (!data[guildId][channel.id]) {
                data[guildId][channel.id] = [];
            }

            const added = [];

            for (const emojiInput of emojis) {
                const emoji = parseEmoji(emojiInput);

                if (!data[guildId][channel.id].includes(emoji.value)) {
                    data[guildId][channel.id].push(emoji.value);
                    added.push(emoji.value);
                }
            }

            saveData(data);

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent(
                            added.length
                                ? `Les réactions ${added.join(' ')} seront maintenant ajoutées automatiquement dans ${channel}.`
                                : `Ces réactions sont déjà configurées dans ${channel}.`
                        )
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        if (subCommand === 'remove') {
            const channel = message.mentions.channels.first();

            if (!channel) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent('Utilisation : `+autoreact remove #salon 👍`')
                            )
                    ]
                });
            }

            const channelMention = `<#${channel.id}>`;
            const channelIndex = args.indexOf(channelMention);
            const emojis = args.slice(channelIndex + 1);

            if (!data[guildId][channel.id]) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent(`Aucune réaction automatique n'est configurée dans ${channel}.`)
                            )
                    ]
                });
            }

            const removed = [];

            for (const emoji of emojis) {
                const index = data[guildId][channel.id].indexOf(emoji);

                if (index !== -1) {
                    removed.push(data[guildId][channel.id][index]);
                    data[guildId][channel.id].splice(index, 1);
                }
            }

            if (data[guildId][channel.id].length === 0) {
                delete data[guildId][channel.id];
            }

            saveData(data);

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent(
                            removed.length
                                ? `Les réactions ${removed.join(' ')} ont été retirées de ${channel}.`
                                : `Aucune des réactions indiquées n'était configurée dans ${channel}.`
                        )
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        if (subCommand === 'list') {
            const entries = Object.entries(data[guildId]);

            if (entries.length === 0) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent('Aucun AutoReact n\'est configuré sur ce serveur.')
                            )
                    ]
                });
            }

            const list = entries
                .map(([channelId, emojis]) => {
                    return `<#${channelId}> → ${emojis.join(' ')}`;
                })
                .join('\n');

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent(list)
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        if (subCommand === 'clear') {
            const channel = message.mentions.channels.first();

            if (!channel) {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(3604294)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent('## AutoReact'),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder()
                                    .setContent('Utilisation : `+autoreact clear #salon`')
                            )
                    ]
                });
            }

            delete data[guildId][channel.id];
            saveData(data);

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent(`Tous les AutoReact de ${channel} ont été supprimés.`)
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        if (subCommand === 'clearall') {
            delete data[guildId];
            saveData(data);

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## AutoReact'),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder()
                        .setContent('Tous les AutoReact du serveur ont été supprimés.')
                );

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            });
        }

        const container = new ContainerBuilder()
            .setAccentColor(3604294)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## AutoReact'),
                new SeparatorBuilder(),
                new TextDisplayBuilder()
                    .setContent('Sous-commande inconnue. Utilise `+autoreact` pour voir les commandes disponibles.')
            );

        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    }
};
