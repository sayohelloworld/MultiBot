const guildConfig = require('../utils/guildConfig');
const points = require('../utils/points');
const voiceManager = require('../utils/voiceManager');
const { ChannelType } = require('discord.js');

const voiceSessions = new Map();

function getSessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function isValidVoiceChannel(state) {
  return Boolean(
    state.channelId &&
    state.member &&
    !state.member.user.bot
  );
}

function startSession(oldState, newState) {
  if (!isValidVoiceChannel(newState)) return;

  const guildId = newState.guild.id;
  const userId = newState.member.id;
  const key = getSessionKey(guildId, userId);

  if (voiceSessions.has(key)) return;

  voiceSessions.set(key, {
    guildId,
    userId,
    channelId: newState.channelId,
    startedAt: Date.now()
  });
}

function endSession(oldState, newState) {
  if (!oldState.member || oldState.member.user.bot) return;

  const guildId = oldState.guild.id;
  const userId = oldState.member.id;
  const key = getSessionKey(guildId, userId);

  const session = voiceSessions.get(key);

  if (!session) return;

  voiceSessions.delete(key);

  const elapsedMs =
    Date.now() - session.startedAt;

  const elapsedMinutes =
    Math.floor(elapsedMs / 60000);

  if (elapsedMinutes <= 0) return;

  const pointsConfig = guildConfig.get(
    guildId,
    'pointsConfig'
  );

  const pointsPerMinute =
    Number(pointsConfig?.voicePoints) || 0;

  if (pointsPerMinute <= 0) return;

  const amount =
    elapsedMinutes * pointsPerMinute;

  points.addPoints(
    guildId,
    userId,
    amount
  );
}

async function createTemporaryChannel(newState) {
  if (!newState.guild || !newState.member) return;
  if (newState.member.user.bot) return;

  const guildId = newState.guild.id;
  const triggerId = guildConfig.get(
    guildId,
    'voiceManagerTrigger'
  );

  const categoryId = guildConfig.get(
    guildId,
    'voiceManagerCategory'
  );

  if (!triggerId || !categoryId) return;

  if (newState.channelId !== triggerId) return;

  const category = newState.guild.channels.cache.get(categoryId);

  if (!category || category.type !== ChannelType.GuildCategory) {
    return;
  }

  const member = newState.member;

  const channel = await newState.guild.channels.create({
    name: `🔊・${member.user.username}`,
    type: ChannelType.GuildVoice,
    parent: category.id
  });

  voiceManager.addChannel(
    guildId,
    channel.id,
    member.id
  );

  await member.voice.setChannel(channel);
}

async function deleteTemporaryChannel(oldState) {
  if (!oldState.channelId) return;

  const guildId = oldState.guild.id;
  const channelId = oldState.channelId;

  const temporaryChannel =
    voiceManager.getChannel(
      guildId,
      channelId
    );

  if (!temporaryChannel) return;

  const channel =
    oldState.guild.channels.cache.get(channelId);

  voiceManager.removeChannel(
    guildId,
    channelId
  );

  if (!channel) return;

  if (channel.members.size === 0) {
    await channel.delete().catch(() => {});
  }
}

module.exports = {
  name: 'voiceStateUpdate',
  once: false,

  async execute(oldState, newState) {
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (!oldChannelId && newChannelId) {
      startSession(oldState, newState);
    }

    if (oldChannelId && !newChannelId) {
      endSession(oldState, newState);
    }

    if (
      oldChannelId &&
      newChannelId &&
      oldChannelId !== newChannelId
    ) {
      const guildId = newState.guild.id;
      const userId = newState.member.id;
      const key = getSessionKey(guildId, userId);

      const session = voiceSessions.get(key);

      if (session) {
        session.channelId = newChannelId;
      }
    }

    if (oldChannelId && oldChannelId !== newChannelId) {
      await deleteTemporaryChannel(oldState);
    }

    if (newChannelId && oldChannelId !== newChannelId) {
      await createTemporaryChannel(newState);
    }
  }
};
