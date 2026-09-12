const {
  PermissionFlagsBits
} = require('discord.js');

function parseRole(message, input) {
  if (!input) return null;

  const mentionMatch = input.match(/^<@&(\d+)>$/);

  if (mentionMatch) {
    return message.guild.roles.cache.get(
      mentionMatch[1]
    ) || null;
  }

  return (
    message.guild.roles.cache.get(input) ||
    message.guild.roles.cache.find(
      (role) =>
        role.name.toLowerCase() === input.toLowerCase()
    ) ||
    null
  );
}

function normalizeColor(input) {
  if (!input) return null;

  let color = input.trim();

  if (color.startsWith('#')) {
    color = color.slice(1);
  }

  if (!/^[0-9a-fA-F]{6}$/.test(color)) {
    return null;
  }

  return `#${color.toUpperCase()}`;
}

module.exports = {
  name: 'rolecolor',
  description: 'Modifie la couleur d\'un rôle.',

  async execute(client, message, args) {
    if (
      !message.member.permissions.has(
        PermissionFlagsBits.ManageRoles
      )
    ) {
      return message.reply(
        '❌ Tu n\'as pas la permission de gérer les rôles.'
      );
    }

    if (!args[0] || !args[1]) {
      return message.reply(
        '❌ Utilisation : `+rolecolor <rôle> <couleur>`\n' +
        'Exemple : `+rolecolor @Membre #5865F2`'
      );
    }

    const role = parseRole(
      message,
      args[0]
    );

    if (!role) {
      return message.reply(
        '❌ Rôle introuvable.'
      );
    }

    if (role.managed) {
      return message.reply(
        '❌ Ce rôle est géré par Discord ou une intégration et ne peut pas être modifié.'
      );
    }

    const color = normalizeColor(args[1]);

    if (!color) {
      return message.reply(
        '❌ Couleur invalide. Utilise un code HEX à 6 caractères, par exemple `#5865F2`.'
      );
    }

    const botMember =
      message.guild.members.me;

    if (!botMember) {
      return message.reply(
        '❌ Impossible de vérifier les permissions du bot.'
      );
    }

    if (
      role.position >= botMember.roles.highest.position
    ) {
      return message.reply(
        '❌ Je ne peux pas modifier ce rôle car il est placé au-dessus ou au même niveau que mon rôle le plus élevé.'
      );
    }

    try {
      await role.setColor(
        color,
        `Commande +rolecolor utilisée par ${message.author.tag}`
      );

      await message.reply(
        `✅ La couleur du rôle ${role} a été modifiée en **${color}**.`
      );
    } catch (error) {
      console.error(
        `[ROLECOLOR] Erreur pour ${role.id}:`,
        error
      );

      await message.reply(
        '❌ Impossible de modifier la couleur de ce rôle.'
      );
    }
  }
};
