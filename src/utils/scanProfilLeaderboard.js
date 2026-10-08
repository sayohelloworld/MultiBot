const guildConfig = require('./guildConfig');

function getScans(guildId) {
  const config = guildConfig.getAll(guildId);

  return config.scanProfilConfig?.scans || {};
}

function getLeaderboard(guildId) {
  const scans = getScans(guildId);

  const entries = Object.entries(scans)
    .map(([userId, data]) => ({
      userId,
      ...data
    }))
    .filter(entry => {
      return (
        typeof entry.usernameScore === 'number' &&
        typeof entry.badgesScore === 'number' &&
        typeof entry.finalScore === 'number'
      );
    });

  const username = [...entries]
    .sort((a, b) => b.usernameScore - a.usernameScore);

  const badges = [...entries]
    .sort((a, b) => b.badgesScore - a.badgesScore);

  const final = [...entries]
    .sort((a, b) => b.finalScore - a.finalScore);

  const likes = [...entries]
    .sort((a, b) => {
      return (b.likes || 0) - (a.likes || 0);
    });

  return {
    username,
    badges,
    final,
    likes
  };
}

function saveScan(guildId, scan) {
  const config = guildConfig.getAll(guildId);

  if (!config.scanProfilConfig) {
    config.scanProfilConfig = {
      enabled: false,
      infoChannelId: null,
      infoMessageId: null,
      resultChannelId: null,
      leaderboardChannelId: null,
      leaderboardMessageId: null,
      scans: {}
    };
  }

  if (!config.scanProfilConfig.scans) {
    config.scanProfilConfig.scans = {};
  }

  const existing =
    config.scanProfilConfig.scans[scan.userId] || {};

  config.scanProfilConfig.scans[scan.userId] = {
    ...existing,
    userId: scan.userId,
    username: scan.username,
    globalName: scan.globalName || null,
    avatarURL: scan.avatarURL || null,
    bannerURL: scan.bannerURL || null,
    createdAt: scan.createdAt || null,
    accountAge: scan.accountAge || null,
    badges: scan.badges || [],
    rarestBadge: scan.rarestBadge || null,
    usernameScore: scan.usernameScore,
    badgesScore: scan.badgesScore,
    accountAgeScore: scan.accountAgeScore,
    finalScore: scan.finalScore,
    scannedAt: scan.scannedAt || Date.now(),
    likes: existing.likes || 0,
    likedBy: Array.isArray(existing.likedBy)
      ? existing.likedBy
      : []
  };

  guildConfig.save(guildId, config);

  return config.scanProfilConfig.scans[scan.userId];
}

function getScan(guildId, userId) {
  const scans = getScans(guildId);

  return scans[userId] || null;
}

function hasLiked(guildId, profileUserId, likerUserId) {
  const scan = getScan(guildId, profileUserId);

  if (!scan) {
    return false;
  }

  return Array.isArray(scan.likedBy) &&
    scan.likedBy.includes(likerUserId);
}

function addLike(guildId, profileUserId, likerUserId) {
  const config = guildConfig.getAll(guildId);

  if (!config.scanProfilConfig?.scans?.[profileUserId]) {
    return {
      success: false,
      reason: 'PROFILE_NOT_FOUND'
    };
  }

  const profile =
    config.scanProfilConfig.scans[profileUserId];

  if (!Array.isArray(profile.likedBy)) {
    profile.likedBy = [];
  }

  if (profile.likedBy.includes(likerUserId)) {
    return {
      success: false,
      reason: 'ALREADY_LIKED',
      likes: profile.likes || 0
    };
  }

  profile.likedBy.push(likerUserId);
  profile.likes = profile.likedBy.length;

  guildConfig.save(guildId, config);

  return {
    success: true,
    likes: profile.likes
  };
}

function removeLike(guildId, profileUserId, likerUserId) {
  const config = guildConfig.getAll(guildId);

  if (!config.scanProfilConfig?.scans?.[profileUserId]) {
    return {
      success: false,
      reason: 'PROFILE_NOT_FOUND'
    };
  }

  const profile =
    config.scanProfilConfig.scans[profileUserId];

  if (!Array.isArray(profile.likedBy)) {
    profile.likedBy = [];
  }

  const index = profile.likedBy.indexOf(likerUserId);

  if (index === -1) {
    return {
      success: false,
      reason: 'NOT_LIKED'
    };
  }

  profile.likedBy.splice(index, 1);
  profile.likes = profile.likedBy.length;

  guildConfig.save(guildId, config);

  return {
    success: true,
    likes: profile.likes
  };
}

function getUserRank(guildId, userId, type = 'final') {
  const leaderboard = getLeaderboard(guildId);
  const list = leaderboard[type];

  if (!list) {
    return null;
  }

  const index = list.findIndex(
    entry => entry.userId === userId
  );

  if (index === -1) {
    return null;
  }

  return index + 1;
}

function createLeaderboardData(guildId, limit = 10) {
  const leaderboard = getLeaderboard(guildId);

  return {
    username: leaderboard.username.slice(0, limit),
    badges: leaderboard.badges.slice(0, limit),
    final: leaderboard.final.slice(0, limit),
    likes: leaderboard.likes.slice(0, limit)
  };
}

module.exports = {
  getScans,
  getScan,
  getLeaderboard,
  saveScan,
  hasLiked,
  addLike,
  removeLike,
  getUserRank,
  createLeaderboardData
};