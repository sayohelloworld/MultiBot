const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'support',
    description: 'Envoie l\'invite du serveur support',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const inviteURL = `https://discord.gg/`;

        const container = new ContainerBuilder();

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# Serveur Support\nClique sur le bouton ci-dessous`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(
                        client.user.displayAvatarURL({ size: 128 })
                    )
                )
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Serveur Support')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteURL)
        );

        message.reply({
            components: [container, row],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
