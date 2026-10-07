const { ActivityType } = require('discord.js');
const config = require('../../../config');

const TYPES = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing
};

const TYPE_LABELS = {
  playing: 'Joue à',
  streaming: 'Streame',
  listening: 'Écoute',
  watching: 'Regarde',
  competing: 'Participe à'
};

const DEFAULT_STREAM_URL = 'https://www.twitch.tv/yhlel';

module.exports = {
  name: 'activity',
  desc: 'Change le statut du bot dans son activité Discord',

  async execute(client, message, args) {
    if (message.author.id !== config.ownerId) {
      return message.reply('Vous n’êtes pas autorisé à utiliser cette commande.');
    }

    const usage =
      '**Utilisation :**\n' +
      '`+activity <type> <texte>`\n' +
      '`+activity reset`\n\n' +
      `**Types :** ${Object.keys(TYPES).map(t => `\`${t}\``).join(', ')}\n` +
      '**Exemple :** `+activity watching les membres`';

    if (!args.length) {
      return message.reply(usage);
    }

    const type = args[0].toLowerCase();

    if (type === 'reset') {
      client.customActivity = null;

      if (typeof client.updateStatus === 'function') {
        client.updateStatus(client);
      }

      return message.reply('Activité réinitialisée, la rotation automatique est de retour.');
    }

    if (!(type in TYPES)) {
        return message.reply(`Type invalide.\n\n${usage}`);
    }

    const text = args.slice(1).join(' ').trim();

    if (!text) {
      return message.reply(`Il manque le texte de l’activité.\n\n${usage}`);
    }

    if (text.length > 128) {
      return message.reply('Le texte ne peut pas dépasser 128 caractères.');
    }

    const activity = {
      name: text,
      type: TYPES[type]
    };

    if (type === 'streaming') {
      activity.url = DEFAULT_STREAM_URL;
    }

    try {
      client.customActivity = activity;

      client.user.setPresence({
        activities: [activity],
        status: client.presenceStatus || 'online'
    });

      return message.reply(`Activité mise à jour : **${TYPE_LABELS[type]}** ${text}`);
    } catch (error) {
      client.customActivity = null;
      console.error(`[ACTIVITY] Erreur : ${error.message}`);
      return message.reply(`Impossible de modifier l’activité : ${error.message}`);
    }
  }
};