const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'permstaff',
    description: 'Affiche et configure les permissions du Staff',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            if (!config.permstaffText) {
                return message.reply('Les permissions du Staff n\'ont pas encore été configurées sur ce serveur.');
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(config.permstaffText)
                );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (subcommand === 'set') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier les permissions du Staff.');
            }

            const modal = new ModalBuilder()
                .setCustomId(`permstaff_set_${message.guild.id}`)
                .setTitle('Configurer les permissions');

            const input = new TextInputBuilder()
                .setCustomId('permstaff_text')
                .setLabel('Texte des permissions')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Écrivez ici les permissions de votre Staff...')
                .setRequired(true)
                .setMaxLength(4000)
                .setValue(config.permstaffText || '');

            const row = new ActionRowBuilder().addComponents(input);

            modal.addComponents(row);

            const button = new ButtonBuilder()
                .setCustomId(`permstaff_open_${message.guild.id}`)
                .setLabel('Configurer les permissions')
                .setStyle(ButtonStyle.Primary);

            const actionRow = new ActionRowBuilder().addComponents(button);

            const sentMessage = await message.channel.send({
                content: 'Utilisez le bouton ci-dessous pour configurer les permissions du Staff.',
                components: [actionRow]
            });

            const collector = sentMessage.createMessageComponentCollector({
                time: 60000,
                filter: interaction =>
                    interaction.user.id === message.author.id &&
                    interaction.customId === `permstaff_open_${message.guild.id}`
            });

            collector.on('collect', async interaction => {
                await interaction.showModal(modal);
            });

            return;
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier les permissions du Staff.');
            }

            guildConfig.set(message.guild.id, 'permstaffText', null);

            return message.reply('Les permissions du Staff ont été supprimées.');
        }

        return message.reply('Utilisation : `+permstaff`, `+permstaff set` ou `+permstaff reset`');
    }
};