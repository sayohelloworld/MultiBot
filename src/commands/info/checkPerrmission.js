const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'checkpermission',
  description: 'Vérifie les permissions d’un membre.',

  async execute(client, message, args) {
    const member = message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    const permissions = member.permissions;
    const allowed = permissions.toArray();

    const names = allowed.map(permission =>
      permission
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(
        `**🔐** **▸ Permissions (${member.user.username})**\n\n` +
        `> *Membre:* ${member}\n` +
        `> *Administrateur:* \`${permissions.has(PermissionsBitField.Flags.Administrator) ? 'Oui' : 'Non'}\`\n` +
        `> *Permissions:* \`${allowed.length}\`\n\n` +
        (names.length ? names.map(name => `> [0m${name}`).join('\n') : '> Aucune permission.')
      );

    await message.reply({ embeds: [embed] });
  }
};
