const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  MessageFlags
} = require('discord.js');

const guildConfig = require('../utils/guildConfig');
const setwelcome = require('../commands/guildconfig/setwelcome');

function replaceVariables(message, member, config) {
  const pingRole = config.welcomePingRoleId
    ? `<@&${config.welcomePingRoleId}>`
    : '';

  const statut =
    config.welcomeStatusEnabled && config.soutienStatut
        ? `\`${config.soutienStatut}\``
        : '';

  return message
    .replaceAll('{member}', member.toString())
    .replaceAll('{member.tag}', member.user.tag)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{count}', String(member.guild.memberCount))
    .replaceAll('{ping}', pingRole)
    .replaceAll('{statut}', statut);
}

module.exports = {
  async execute(interaction) {
    if (!interaction.guild) return;

    const config = guildConfig.getAll(interaction.guild.id);

    if (interaction.isButton()) {
      if (interaction.customId === 'welcome_channel') {
        return interaction.reply({
          components: [
            new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId('welcome_channel_select')
                .setPlaceholder('Choisir le salon de bienvenue')
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'welcome_message') {
        const modal = new ModalBuilder()
          .setCustomId('welcome_message_modal')
          .setTitle('Message de bienvenue');

        const input = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Message')
          .setPlaceholder(
            'Bienvenue {member} sur {server} ! Nous sommes {count} membres !'
          )
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setValue(
            config.welcomeMessage ||
            'Bienvenue {member} sur {server} !'
          );

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'welcome_ping_role') {
        return interaction.reply({
          components: [
            new ActionRowBuilder().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId('welcome_ping_role_select')
                .setPlaceholder('Choisir le rôle à mentionner')
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'welcome_ping_toggle') {
        guildConfig.set(
          interaction.guild.id,
          'welcomePingEnabled',
          !config.welcomePingEnabled
        );

        const updated = guildConfig.getAll(interaction.guild.id);

        return interaction.update({
          components: [
            setwelcome.buildPanel(
              interaction.guild,
              updated
            )
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }

      if (interaction.customId === 'welcome_status_toggle') {
        guildConfig.set(
          interaction.guild.id,
          'welcomeStatusEnabled',
          !config.welcomeStatusEnabled
        );

        const updated = guildConfig.getAll(interaction.guild.id);

        return interaction.update({
          components: [
            setwelcome.buildPanel(
              interaction.guild,
              updated
            )
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }

      if (interaction.customId === 'welcome_preview') {
        const welcomeMessage =
          config.welcomeMessage ||
          'Bienvenue {member} sur {server} !';

        const preview = replaceVariables(
          welcomeMessage,
          interaction.member,
          config
        );

        let content = preview;

        if (
          config.welcomePingEnabled &&
          config.welcomePingRoleId &&
          !welcomeMessage.includes('{ping}')
        ) {
          content =
            `<@&${config.welcomePingRoleId}>\n\n${preview}`;
        }

        return interaction.reply({
          content,
          allowedMentions: {
            users: [interaction.user.id],
            roles: config.welcomePingEnabled &&
              config.welcomePingRoleId
              ? [config.welcomePingRoleId]
              : []
          },
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'welcome_reset') {
        guildConfig.setMany(
          interaction.guild.id,
          {
            welcomeChannelId: null,
            welcomeMessage: 'Bienvenue {member} sur {server} !',
            welcomePingRoleId: null,
            welcomePingEnabled: false,
            welcomeStatusEnabled: false
          }
        );

        const updated = guildConfig.getAll(
          interaction.guild.id
        );

        return interaction.update({
          components: [
            setwelcome.buildPanel(
              interaction.guild,
              updated
            )
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }

      return;
    }

    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId !== 'welcome_channel_select') {
        return;
      }

      guildConfig.set(
        interaction.guild.id,
        'welcomeChannelId',
        interaction.values[0]
      );

      return interaction.update({
        content: '✅ Salon de bienvenue enregistré.',
        components: []
      });
    }

    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId !== 'welcome_ping_role_select') {
        return;
      }

      guildConfig.set(
        interaction.guild.id,
        'welcomePingRoleId',
        interaction.values[0]
      );

      return interaction.update({
        content: '✅ Rôle de ping enregistré.',
        components: []
      });
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId !== 'welcome_message_modal') {
        return;
      }

      const value =
        interaction.fields.getTextInputValue('message');

      guildConfig.set(
        interaction.guild.id,
        'welcomeMessage',
        value || 'Bienvenue {member} sur {server} !'
      );

      return interaction.reply({
        content: '✅ Message de bienvenue enregistré.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
