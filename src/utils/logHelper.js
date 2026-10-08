const guildConfig = require('./guildConfig');
const { MessageFlags } = require('discord.js');

const LOG_TYPES = {
  member: {
    label: '📥 Membres',
    desc: 'Arrivées, départs, bans, kicks, timeouts et changements membres'
  },

  messages: {
    label: '💬 Messages',
    desc: 'Suppressions, modifications et purges de messages'
  },

  voice: {
    label: '🎤 Vocal',
    desc: 'Connexions, départs, déplacements, mutes et deafen'
  },

  roles: {
    label: '🎖️ Rôles',
    desc: 'Création, suppression, modification, attribution et retrait'
  },

  boost: {
    label: '🚀 Boosts',
    desc: 'Début et fin de boost du serveur'
  },

  channels: {
    label: '📋 Salons',
    desc: 'Création, suppression et modification des salons'
  },

  emojis: {
    label: '😀 Emojis',
    desc: 'Création, suppression et modification des emojis et stickers'
  },

  webhooks: {
    label: '🔗 Webhooks',
    desc: 'Création, suppression et modification des webhooks'
  },

  automod: {
    label: '🤖 AutoMod',
    desc: 'Déclenchements et actions du système AutoMod'
  },

  raid: {
    label: '🚨 Raid',
    desc: 'Spam, ban/kick spam, nuke et comportements suspects'
  },

  server: {
    label: '🌐 Serveur',
    desc: 'Modifications générales de la configuration du serveur'
  }
};

async function sendLog(guild, type, container) {
  try {
    if (!guild || !container) return false;

    if (!LOG_TYPES[type]) {
      console.warn(`[LOG] Type inconnu : ${type}`);
      return false;
    }

    const channelId = guildConfig.getLogChannel(guild.id, type);

    if (!channelId) return false;

    let channel = guild.channels.cache.get(channelId);

    if (!channel) {
      channel = await guild.channels.fetch(channelId).catch(() => null);
    }

    if (!channel) {
      console.warn(
        `[LOG] Salon introuvable pour ${type} dans ${guild.name} (${channelId})`
      );
      return false;
    }

    if (!channel.isTextBased()) {
      console.warn(
        `[LOG] Le salon configuré pour ${type} n'est pas textuel dans ${guild.name}`
      );
      return false;
    }

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    return true;
  } catch (error) {
    console.error(
      `[LOG] Erreur ${type} dans ${guild?.name || 'serveur inconnu'}:`,
      error
    );

    return false;
  }
}

module.exports = {
  sendLog,
  LOG_TYPES
};
