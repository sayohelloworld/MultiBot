const fs = require('fs');
const path = require('path');

const GUILDS_DIR = path.join(__dirname, '../../data/guilds');

function ensureDir() {
  if (!fs.existsSync(GUILDS_DIR)) {
    fs.mkdirSync(GUILDS_DIR, { recursive: true });
  }
}

function getDefault() {
  return {
    prefix: '+',

    welcomeChannelId: null,
    logChannelId: null,

    soutienRoleId: null,
    soutienStatut: null,

    captchaEnabled: false,
    antiraidEnabled: false,

    muteRoleId: null,
    warnRoles: [],

    backupLink: null,
    serverDescription: null,

    antiraidConfig: {
      spamLimit: 5,
      spamInterval: 2000,
      muteDuration: 5,
      joinLimit: 10,
      joinInterval: 10000,
      disableInvites: true
    },

    ticketConfig: {
      panelDescription: 'Cliquez sur le bouton ci-dessous pour créer un ticket. Notre équipe vous répondra dans les meilleurs délais.',
      panelColor: '#5865F2',
      logChannelId: null,
      ticketCount: 0,
      categories: []
    },

    giveawayConfig: {
      defaultColor: '#F1C40F',
      defaultChannelId: null,
      defaultWinners: 1,
      managerRoles: []
    },

    pointsConfig: {
      messagePoints: 1,
      commandPoints: 2,
      voicePoints: 1,
      crownRoleId: null,
      crownSchedule: null
    },

    birthdayConfig: {
      channelId: null,
      birthdays: {}
    },

    points: {},

    logChannels: {
      member: null,
      messages: null,
      voice: null,
      roles: null,
      boost: null,
      channels: null,
      emojis: null,
      webhooks: null,
      automod: null,
      raid: null,
      server: null
    },

    botOwners: []
  };
}

function getAll(guildId) {
  ensureDir();

  const filePath = path.join(GUILDS_DIR, `${guildId}.json`);

  if (!fs.existsSync(filePath)) {
    return getDefault();
  }

  try {
    const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const defaults = getDefault();

    return {
      ...defaults,
      ...saved,

      antiraidConfig: {
        ...defaults.antiraidConfig,
        ...(saved.antiraidConfig || {})
      },

      ticketConfig: {
        ...defaults.ticketConfig,
        ...(saved.ticketConfig || {}),
        categories: saved.ticketConfig?.categories || []
      },

      giveawayConfig: {
        ...defaults.giveawayConfig,
        ...(saved.giveawayConfig || {})
      },

      pointsConfig: {
        ...defaults.pointsConfig,
        ...(saved.pointsConfig || {})
      },

      birthdayConfig: {
        ...defaults.birthdayConfig,
        ...(saved.birthdayConfig || {}),
        birthdays: saved.birthdayConfig?.birthdays || {}
      },

      points: saved.points || {},

      logChannels: {
        ...defaults.logChannels,
        ...(saved.logChannels || {})
      },

      botOwners: saved.botOwners || []
    };
  } catch (error) {
    console.error(`[GUILD CONFIG] Erreur lecture ${guildId}:`, error);
    return getDefault();
  }
}

function save(guildId, config) {
  ensureDir();

  fs.writeFileSync(
    path.join(GUILDS_DIR, `${guildId}.json`),
    JSON.stringify(config, null, 2)
  );
}

function get(guildId, key) {
  return getAll(guildId)[key];
}

function set(guildId, key, value) {
  const config = getAll(guildId);

  config[key] = value;

  save(guildId, config);
}

function setMany(guildId, values) {
  const config = getAll(guildId);

  Object.assign(config, values);

  save(guildId, config);
}

function setNested(guildId, key, subKey, value) {
  const config = getAll(guildId);

  if (!config[key] || typeof config[key] !== 'object') {
    config[key] = {};
  }

  config[key][subKey] = value;

  save(guildId, config);
}

function getLogChannel(guildId, type) {
  return getAll(guildId).logChannels?.[type] || null;
}

function setLogChannel(guildId, type, channelId) {
  const config = getAll(guildId);

  if (!Object.prototype.hasOwnProperty.call(config.logChannels, type)) {
    return false;
  }

  config.logChannels[type] = channelId;

  save(guildId, config);

  return true;
}

function isBotOwner(guildId, userId) {
  return (getAll(guildId).botOwners || []).includes(userId);
}

module.exports = {
  get,
  set,
  setMany,
  setNested,
  getAll,
  save,
  getLogChannel,
  setLogChannel,
  isBotOwner
};
