const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Invite le bot sur votre serveur',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        const inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&integration_type=0&scope=bot`;

        const container = new ContainerBuilder();
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## 🔗 Inviter ${client.user.username}\nClique sur le bouton ci-dessous pour m\'inviter sur ton serveur !`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ size: 128 }))
                )
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Inviter le bot')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteURL)
        );

        message.reply({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
    },
};
