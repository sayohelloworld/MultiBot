const guildConfig = require('../utils/guildConfig');
const points = require('../utils/points');
const config = require('../../config');

function isExecutableBuffer(buffer) {
  if (!buffer || buffer.length < 2) {
    return false;
  }
  
  if (
    buffer[0] === 0x4d &&
    buffer[1] === 0x5a
  ) {
    return true;
  }

  if (
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return true;
  }

  if (
    (
      buffer[0] === 0xfe &&
      buffer[1] === 0xed &&
      buffer[2] === 0xfa &&
      buffer[3] === 0xce
    ) ||
    (
      buffer[0] === 0xce &&
      buffer[1] === 0xfa &&
      buffer[2] === 0xed &&
      buffer[3] === 0xfe
    )
  ) {
    return true;
  }

  if (
    (
      buffer[0] === 0xfe &&
      buffer[1] === 0xed &&
      buffer[2] === 0xfa &&
      buffer[3] === 0xcf
    ) ||
    (
      buffer[0] === 0xcf &&
      buffer[1] === 0xfa &&
      buffer[2] === 0xed &&
      buffer[3] === 0xfe
    )
  ) {
    return true;
  }

  if (
    (
      buffer[0] === 0xca &&
      buffer[1] === 0xfe &&
      buffer[2] === 0xba &&
      buffer[3] === 0xbe
    ) ||
    (
      buffer[0] === 0xbe &&
      buffer[1] === 0xba &&
      buffer[2] === 0xfe &&
      buffer[3] === 0xca
    )
  ) {
    return true;
  }

  if (
    buffer[0] === 0xca &&
    buffer[1] === 0xfe &&
    buffer[2] === 0xba &&
    buffer[3] === 0xbe
  ) {
    return true;
  }

  if (
    buffer[0] === 0x23 &&
    buffer[1] === 0x21
  ) {
    const header = buffer
      .subarray(0, Math.min(buffer.length, 512))
      .toString('utf8')
      .toLowerCase();

    if (
      header.includes('/bin/') ||
      header.includes('/usr/bin/') ||
      header.includes('/usr/bin/env')
    ) {
      return true;
    }
  }

  return false;
}

async function checkAttachment(attachment) {
  try {
    const response = await fetch(attachment.url);

    if (!response.ok) {
      return false;
    }
    const arrayBuffer = await response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return isExecutableBuffer(buffer);
  } catch (error) {
    console.error(
      `[ANTIEXE] Impossible d'analyser ${attachment.name}:`,
      error
    );

    return false;
  }
}

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (!message.guild) return;

    const honeypotChannelId = guildConfig.get(
      message.guild.id,
      'honeypotChannel'
    );

    if (
      honeypotChannelId &&
      message.channel.id === honeypotChannelId
    ) {

      if (message.author.id === client.user.id) {
        return;
      }

      console.log(
        `[HONEYPOT] Message détecté de ${message.author.tag} (${message.author.id})`
      );

      try {
        await message.delete().catch(() => {});

        await message.guild.members.ban(
          message.author.id,
          {
            deleteMessageSeconds: 86400,
            reason: 'Honeypot'
          }
        );

        console.log(
          `[HONEYPOT] ${message.author.tag} (${message.author.id}) a été banni.`
        );
      } catch (error) {
        console.error(
          `[HONEYPOT] Impossible de bannir ${message.author.tag} (${message.author.id}) :`,
          error
        );
      }

      return;
    }

    const antiexeEnabled = guildConfig.get(
      message.guild.id,
      'antiexe'
    );

    if (
      antiexeEnabled &&
      message.attachments.size > 0
    ) {
      for (const attachment of message.attachments.values()) {
        const executable = await checkAttachment(
          attachment
        );

        if (!executable) continue;

        console.log(
          `[ANTIEXE] Fichier exécutable détecté : ` +
          `${attachment.name} envoyé par ${message.author.tag} ` +
          `(${message.author.id})`
        );

        await message.delete().catch(() => {});

        await message.channel.send(
          `🚫 ${message.author}, les fichiers exécutables sont interdits dans ce serveur.`
        ).then((msg) => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 5000);
        }).catch(() => {});

        return;
      }
    }

    if (message.author.bot) return;

    const prefix =
      guildConfig.get(message.guild.id, 'prefix') ||
      client.prefix;

    if (!message.content.startsWith(prefix)) {
      const pointsConfig = guildConfig.get(
        message.guild.id,
        'pointsConfig'
      );

      const amount =
        Number(pointsConfig?.messagePoints) || 0;

      if (amount > 0) {
        points.addPoints(
          message.guild.id,
          message.author.id,
          amount
        );
      }

      return;
    }

    const args = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/);

    const commandName =
      args.shift()?.toLowerCase();

    if (!commandName) return;

    const command =
      client.commands.get(commandName);

    if (!command) return;
    
    const pointsConfig = guildConfig.get(
      message.guild.id,
      'pointsConfig'
    );

    const commandPoints =
      Number(pointsConfig?.commandPoints) || 0;

    if (commandPoints > 0) {
      points.addPoints(
        message.guild.id,
        message.author.id,
        commandPoints
      );
    }

    message.isBotOwner =
      message.author.id === config.ownerId;

    try {
      if (
        typeof command.execute === 'function'
      ) {
        command.execute(
          client,
          message,
          args
        );
      } else if (
        typeof command.run === 'function'
      ) {
        command.run(
          client,
          message,
          args
        );
      } else {
        throw new Error(
          `La commande ${commandName} n'a pas de méthode exécutable.`
        );
      }
    } catch (err) {
      console.error(err);

      message.reply(
        '❌ Erreur pendant l\'exécution de la commande.'
      ).catch(() => {});
    }
  }
};
