const activeReminders = new Map();

function parseDuration(input) {
  if (!input) return null;

  const match = input.match(
    /^(\d+(?:\.\d+)?)(s|m|h|d|w)$/i
  );

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  const duration = amount * multipliers[unit];

  if (!Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  return duration;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}j`;
  }

  const weeks = Math.floor(days / 7);

  return `${weeks}sem`;
}

module.exports = {
  name: 'remind',
  description: 'Programme un rappel personnel.',

  async execute(client, message, args) {
    if (!args[0]) {
      return message.reply(
        '❌ Utilisation : `+remind <durée> <rappel>`\n' +
        'Exemple : `+remind 2h faire mes devoirs`'
      );
    }

    const duration = parseDuration(args[0]);

    if (!duration) {
      return message.reply(
        '❌ Durée invalide. Utilise par exemple `30s`, `10m`, `2h`, `1d` ou `1w`.'
      );
    }

    const reminder = args.slice(1).join(' ').trim();

    if (!reminder) {
      return message.reply(
        '❌ Tu dois indiquer le contenu du rappel.'
      );
    }

    const maximumDuration = 7 * 24 * 60 * 60 * 1000;

    if (duration > maximumDuration) {
      return message.reply(
        '❌ La durée maximale est de 7 jours.'
      );
    }

    const userId = message.author.id;

    const existingTimer = activeReminders.get(userId);

    if (existingTimer) {
      clearTimeout(existingTimer);
      activeReminders.delete(userId);
    }

    const reminderId = `${userId}:${Date.now()}`;

    const timer = setTimeout(async () => {
      activeReminders.delete(userId);

      try {
        await message.channel.send(
          `${message.author}, ton rappel : **${reminder}**`
        );
      } catch (error) {
        console.error(
          '[REMIND] Impossible d\'envoyer le rappel :',
          error
        );
      }
    }, duration);

    activeReminders.set(userId, timer);

    await message.reply(
      `✅ Rappel programmé dans **${formatDuration(duration)}** : **${reminder}**`
    );
  }
};
