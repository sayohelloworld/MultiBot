const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'lock',
  description: 'Verrouille le salon',

  async execute(client, message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Tu dois être administrateur pour utiliser cette commande.');
    }

    const channel = message.channel;

    const permissions = {
      SendMessages: false,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
      SendMessagesInThreads: false,
      UseApplicationCommands: false,
      UseExternalApps: false,
      AttachFiles: false,
      EmbedLinks: false,
      MentionEveryone: false,
      UseExternalStickers: false,
      Connect: false,
      Speak: false,
      Stream: false,
      UseSoundboard: false,
      UseExternalSounds: false,
      CreateInstantInvite: false,
      ManageMessages: false,
      ManageThreads: false,
      ReadMessageHistory: true,
      ViewChannel: true
    };

    const roles = message.guild.roles.cache.filter(role => !role.managed);

    for (const role of roles.values()) {
      if (role.permissions.has(PermissionFlagsBits.Administrator)) continue;
      if (role.id === message.guild.id) continue;

      await channel.permissionOverwrites.edit(role, permissions);
    }

    await channel.send('🔒 Salon verrouillé. Les membres peuvent uniquement voir ce salon.');
  }
};
