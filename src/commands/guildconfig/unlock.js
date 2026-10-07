const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unlock',
  description: 'Déverrouille le salon',

  async execute(client, message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Tu dois être administrateur pour utiliser cette commande.');
    }

    const channel = message.channel;

    const roles = message.guild.roles.cache.filter(role => !role.managed);

    for (const role of roles.values()) {
      if (role.permissions.has(PermissionFlagsBits.Administrator)) continue;
      if (role.id === message.guild.id) continue;

      await channel.permissionOverwrites.edit(role, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
        SendMessagesInThreads: null,
        UseApplicationCommands: null,
        UseExternalApps: null,
        AttachFiles: null,
        EmbedLinks: null,
        MentionEveryone: null,
        UseExternalStickers: null,
        Connect: null,
        Speak: null,
        Stream: null,
        UseSoundboard: null,
        UseExternalSounds: null,
        CreateInstantInvite: null,
        ManageMessages: null,
        ManageThreads: null,
        ReadMessageHistory: null,
        ViewChannel: null
      });
    }

    await channel.send('🔓 Salon déverrouillé.');
  }
};
