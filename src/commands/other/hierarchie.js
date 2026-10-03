const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'hierarchie',
    aliases: ['hierarchy', 'staffhierarchie'],
    usage: 'hierarchie',
    description: 'Affiche et configure la hiérarchie du Staff.',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            if (!config.hierarchieText) {
                return message.reply('La hiérarchie du Staff n\'a pas encore été configurée sur ce serveur.');
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(config.hierarchieText)
                );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (subcommand === 'set') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier la hiérarchie.');
            }

            const modal = new ModalBuilder()
                .setCustomId(`hierarchie_set_${message.guild.id}`)
                .setTitle('Configurer la hiérarchie');

            const input = new TextInputBuilder()
                .setCustomId('hierarchie_text')
                .setLabel('Texte de la hiérarchie')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Écrivez ici toute votre hiérarchie...')
                .setRequired(true)
                .setMaxLength(4000)
                .setValue(config.hierarchieText || '');

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            return message.channel.send({
                content: 'Utilisez le bouton ci-dessous pour configurer la hiérarchie.'
            }).then(async sentMessage => {
                const button = require('discord.js').ButtonBuilder;

                const configButton = new button()
                    .setCustomId(`hierarchie_open_${message.guild.id}`)
                    .setLabel('Configurer la hiérarchie')
                    .setStyle(require('discord.js').ButtonStyle.Primary);

                const actionRow = new ActionRowBuilder().addComponents(configButton);

                await sentMessage.edit({
                    content: 'Utilisez le bouton ci-dessous pour configurer la hiérarchie.',
                    components: [actionRow]
                });

                const collector = sentMessage.createMessageComponentCollector({
                    time: 60000,
                    filter: interaction =>
                        interaction.user.id === message.author.id &&
                        interaction.customId === `hierarchie_open_${message.guild.id}`
                });

                collector.on('collect', async interaction => {
                    await interaction.showModal(modal);
                });
            });
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier la hiérarchie.');
            }

            guildConfig.set(message.guild.id, 'hierarchieText', null);

            return message.reply('La hiérarchie du Staff a été supprimée.');
        }

        return message.reply('Utilisation : `+hierarchie`, `+hierarchie set` ou `+hierarchie reset`');
    }
};