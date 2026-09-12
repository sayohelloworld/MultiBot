const {
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'restoreroles',
  description: 'Donne un rôle à un nombre aléatoire de membres.',

  async execute(client, message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply(
        '❌ Vous devez avoir la permission de gérer les rôles pour utiliser cette commande.'
      );
    }

    await message.guild.roles.fetch();

    const botMember = message.guild.members.me;

    if (!botMember) {
      return message.reply('❌ Impossible de récupérer le bot sur ce serveur.');
    }

    const roles = message.guild.roles.cache
      .filter(role =>
        role.id !== message.guild.id &&
        !role.managed
      )
      .sort((a, b) => b.position - a.position);

    if (roles.size === 0) {
      return message.reply('❌ Aucun rôle n’a été trouvé.');
    }

    const roleArray = [...roles.values()];
    const pages = [];

    for (let i = 0; i < roleArray.length; i += 25) {
      pages.push(roleArray.slice(i, i + 25));
    }

    let currentPage = 0;

    const createMenu = (page) => {
      const options = pages[page].map(role =>
        new StringSelectMenuOptionBuilder()
          .setLabel(role.name.slice(0, 100))
          .setValue(role.id)
          .setDescription(
            `${role.members.size} membre(s) possèdent actuellement ce rôle`
          )
      );

      return new StringSelectMenuBuilder()
        .setCustomId('restore_role')
        .setPlaceholder('Sélectionne le rôle à restaurer')
        .addOptions(options);
    };

    const createComponents = (page) => {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '# Restauration des rôles\n' +
            'Sélectionne le rôle que tu souhaites restaurer.'
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            createMenu(page)
          )
        );

      if (pages.length > 1) {
        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('restore_prev')
              .setLabel('◀')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),

            new ButtonBuilder()
              .setCustomId('restore_page')
              .setLabel(`${page + 1} / ${pages.length}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),

            new ButtonBuilder()
              .setCustomId('restore_next')
              .setLabel('▶')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === pages.length - 1)
          )
        );
      }

      return [container];
    };

    const replyMessage = await message.reply({
      components: createComponents(currentPage),
      flags: MessageFlags.IsComponentsV2
    });

    const collector = replyMessage.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async interaction => {
      // Seul l'auteur de la commande peut utiliser le menu
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ Ce menu ne t’est pas destiné.',
          ephemeral: true
        });
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === 'restore_role'
      ) {
        const selectedRole = message.guild.roles.cache.get(
          interaction.values[0]
        );

        if (!selectedRole) {
          return interaction.reply({
            content: '❌ Ce rôle n’existe plus.',
            ephemeral: true
          });
        }

        if (
          selectedRole.managed ||
          selectedRole.position >= botMember.roles.highest.position
        ) {
          return interaction.reply({
            content:
              '❌ Je ne peux pas attribuer ce rôle car il est supérieur ou égal à mon rôle le plus élevé.',
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`restore_amount_${interaction.id}`)
          .setTitle('Restauration du rôle');

        const amountInput = new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('Nombre de membres')
          .setPlaceholder('Exemple : 400')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(5);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            amountInput
          )
        );

        await interaction.showModal(modal);

        try {
          const modalInteraction = await interaction.awaitModalSubmit({
            time: 120000,
            filter: i =>
              i.user.id === message.author.id &&
              i.customId === `restore_amount_${interaction.id}`
          });

          const amount = Number(
            modalInteraction.fields.getTextInputValue('amount')
          );

          if (!Number.isInteger(amount) || amount <= 0) {
            return modalInteraction.reply({
              content: '❌ Le nombre doit être un entier supérieur à 0.',
              ephemeral: true
            });
          }

          const eligibleMembers = [...message.guild.members.cache.values()]
            .filter(member =>
              !member.user.bot &&
              !member.roles.cache.has(selectedRole.id)
            );

          if (eligibleMembers.length === 0) {
            return modalInteraction.reply({
              content: '❌ Aucun membre éligible.',
              ephemeral: true
            });
          }

          if (amount > eligibleMembers.length) {
            return modalInteraction.reply({
              content:
                `❌ Tu demandes **${amount}** membres, mais seulement ` +
                `**${eligibleMembers.length}** membres sont éligibles.`,
              ephemeral: true
            });
          }

          await modalInteraction.deferUpdate();

          for (let i = eligibleMembers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [eligibleMembers[i], eligibleMembers[j]] = [
              eligibleMembers[j],
              eligibleMembers[i]
            ];
          }

          const selectedMembers = eligibleMembers.slice(0, amount);

          await replyMessage.edit({
            components: [
              new ContainerBuilder()
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(
                    `# Restauration en cours\n\n` +
                    `Attribution de <@&${selectedRole.id}> à ` +
                    `**${amount} membres aléatoires**...\n\n` +
                    `⏳ Veuillez patienter.`
                  )
                )
            ],
            flags: MessageFlags.IsComponentsV2
          });

          let success = 0;
          let errors = 0;

          for (const member of selectedMembers) {
            try {
              await member.roles.add(
                selectedRole,
                `Restauration du rôle par ${message.author.tag}`
              );

              success++;
            } catch (error) {
              errors++;

              console.error(
                `Impossible d'ajouter le rôle à ${member.user.tag}:`,
                error
              );
            }
          }

          await replyMessage.edit({
            components: [
              new ContainerBuilder()
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(
                    `# Restauration terminée\n\n` +
                    `**Rôle :** <@&${selectedRole.id}>\n` +
                    `**Nombre demandé :** ${amount}\n` +
                    `**Membres ajoutés :** ${success}\n` +
                    `**Erreurs :** ${errors}`
                  )
                )
            ],
            flags: MessageFlags.IsComponentsV2
          });

        } catch (error) {
          if (
            error.code !== 'InteractionCollectorError' &&
            error.name !== 'InteractionCollectorError'
          ) {
            console.error(
              'Erreur modal restore :',
              error
            );
          }
        }

        return;
      }

      if (
        interaction.isButton() &&
        interaction.customId === 'restore_prev'
      ) {
        if (currentPage > 0) {
          currentPage--;
        }

        return interaction.update({
          components: createComponents(currentPage)
        });
      }
      if (
        interaction.isButton() &&
        interaction.customId === 'restore_next'
      ) {
        if (currentPage < pages.length - 1) {
          currentPage++;
        }

        return interaction.update({
          components: createComponents(currentPage)
        });
      }
    });

    collector.on('end', async () => {
    });
  }
};
