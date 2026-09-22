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
} = require('discord.js')

module.exports = {
  name: 'support',
  description: 'Invite du serveur support du bot',

  async execute(client, message, args) {
    await message.channel.sendTyping();
    const inviteURL = `https://discord.gg/`;

    const container = new ContainerBuilder();
    container.addSectionComponents(
      new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Serveur Support\n Clique sur le bouton ci-dessous`
          )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ size: 128 }))
                )
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Serveur Support')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteURL)
        );

        message.reply({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
    },
};
