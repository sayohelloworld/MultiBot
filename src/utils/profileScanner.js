const BADGE_RARITY = {
  Staff: 10,
  Partner: 9.5,
  Hypesquad: 7,
  BugHunterLevel2: 10,
  BugHunterLevel1: 8,
  HypeSquadOnlineHouse1: 6,
  HypeSquadOnlineHouse2: 6,
  HypeSquadOnlineHouse3: 6,
  PremiumEarlySupporter: 9,
  VerifiedDeveloper: 7,
  CertifiedModerator: 9,
  VerifiedBot: 7
};

const BADGE_NAMES = {
  Staff: 'Discord Staff',
  Partner: 'Discord Partner',
  Hypesquad: 'HypeSquad Events',
  BugHunterLevel2: 'Bug Hunter Level 2',
  BugHunterLevel1: 'Bug Hunter Level 1',
  HypeSquadOnlineHouse1: 'HypeSquad Bravery',
  HypeSquadOnlineHouse2: 'HypeSquad Brilliance',
  HypeSquadOnlineHouse3: 'HypeSquad Balance',
  PremiumEarlySupporter: 'Early Supporter',
  VerifiedDeveloper: 'Early Verified Bot Developer',
  CertifiedModerator: 'Certified Moderator',
  VerifiedBot: 'Verified Bot'
};

const FLAG_VALUES = {
  Staff: 1,
  Partner: 2,
  Hypesquad: 4,
  BugHunterLevel1: 8,
  BugHunterLevel2: 16384,
  HypeSquadOnlineHouse1: 64,
  HypeSquadOnlineHouse2: 128,
  HypeSquadOnlineHouse3: 256,
  PremiumEarlySupporter: 512,
  VerifiedDeveloper: 131072,
  VerifiedBot: 65536,
  CertifiedModerator: 262144
};

function round(value) {
  return Math.round(value * 10) / 10;
}

function hasFlag(flags, key) {
  if (!flags) return false;

  try {
    if (typeof flags.has === 'function') {
      return flags.has(key);
    }
  } catch {}

  const value = FLAG_VALUES[key];

  if (!value) return false;

  const bitfield =
    typeof flags.bitfield === 'bigint'
      ? flags.bitfield
      : BigInt(flags.bitfield || 0);

  return (bitfield & BigInt(value)) === BigInt(value);
}

function getUsernameScore(user) {
  const username = user.username || '';

  if (!username) return 0;

  let score = 5;
  const length = username.length;

  if (length >= 3 && length <= 5) score += 2;
  else if (length >= 6 && length <= 8) score += 1.5;
  else if (length >= 9 && length <= 12) score += 1;
  else if (length >= 13 && length <= 16) score += 0.5;
  else if (length > 25) score -= 1;

  if (/^[a-zA-Z]+$/.test(username)) score += 1;
  if (/^[a-zA-Z0-9]+$/.test(username)) score += 0.5;
  if (/[0-9]/.test(username)) score -= 0.5;
  if (/[_\-.]/.test(username)) score -= 0.3;
  if (/[^\w\-.]/.test(username)) score -= 0.5;
  if (/(.)\1{2,}/i.test(username)) score -= 1;

  return round(Math.max(0, Math.min(10, score)));
}

function getBadges(user) {
  const badges = [];
  const flags = user.flags;

  for (const [key, rarity] of Object.entries(BADGE_RARITY)) {
    if (!hasFlag(flags, key)) continue;

    badges.push({
      key,
      name: BADGE_NAMES[key] || key,
      rarity
    });
  }

  const premiumType = Number(
    user.premiumType ?? user.premium_type ?? 0
  );

  if (premiumType > 0) {
    badges.push({
      key: 'Nitro',
      name: 'Discord Nitro',
      rarity: 5
    });
  }

  return badges;
}

function getBadgeScore(badges) {
  if (!badges.length) return 0;

  const total = badges.reduce(
    (sum, badge) => sum + badge.rarity,
    0
  );

  const average = total / badges.length;
  const quantityBonus = Math.min(badges.length * 0.35, 2);
  const score = average * 0.75 + quantityBonus;

  return round(Math.max(0, Math.min(10, score)));
}

function getRarestBadge(badges) {
  if (!badges.length) return null;

  return [...badges].sort(
    (a, b) => b.rarity - a.rarity
  )[0];
}

function getAccountAgeScore(user) {
  const createdAt = user.createdAt;

  if (!createdAt) return 0;

  const ageMs = Date.now() - createdAt.getTime();
  const days = ageMs / 86400000;
  const years = days / 365.25;

  let score;

  if (years < 0.25) score = 1;
  else if (years < 0.5) score = 2;
  else if (years < 1) score = 3;
  else if (years < 2) score = 5;
  else if (years < 3) score = 6.5;
  else if (years < 4) score = 7.5;
  else if (years < 5) score = 8.5;
  else if (years < 6) score = 9;
  else score = 10;

  return round(score);
}

function formatAccountAge(user) {
  if (!user.createdAt) return 'Inconnue';

  const now = new Date();
  const created = new Date(user.createdAt);

  let years = now.getFullYear() - created.getFullYear();
  let months = now.getMonth() - created.getMonth();

  if (
    months < 0 ||
    (months === 0 && now.getDate() < created.getDate())
  ) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  const totalMonths = Math.max(
    0,
    Math.floor(
      (Date.now() - created.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )
  );

  if (totalMonths > 0) {
    return `${totalMonths} mois`;
  }

  const days = Math.max(
    0,
    Math.floor(
      (Date.now() - created.getTime()) / 86400000
    )
  );

  return `${days} jour${days > 1 ? 's' : ''}`;
}

function getFinalScore(
  usernameScore,
  badgesScore,
  accountAgeScore
) {
  return round(
    (
      usernameScore +
      badgesScore +
      accountAgeScore
    ) / 3
  );
}

async function scan(user) {
  if (!user) {
    throw new Error('Utilisateur invalide.');
  }

  let fetchedUser = user;

  try {
    fetchedUser = await user.fetch(true);
  } catch {}

  let flags = fetchedUser.flags;

  if (!flags) {
    try {
      flags = await fetchedUser.fetchFlags(true);
    } catch {}
  }

  if (flags && !fetchedUser.flags) {
    fetchedUser.flags = flags;
  }

  const badges = getBadges(fetchedUser);

  const usernameScore =
    getUsernameScore(fetchedUser);

  const badgesScore =
    getBadgeScore(badges);

  const accountAgeScore =
    getAccountAgeScore(fetchedUser);

  const finalScore =
    getFinalScore(
      usernameScore,
      badgesScore,
      accountAgeScore
    );

  const rarestBadge =
    getRarestBadge(badges);

  return {
    userId: fetchedUser.id,
    username: fetchedUser.username,
    globalName: fetchedUser.globalName || null,
    avatarURL: fetchedUser.displayAvatarURL({
      extension: 'png',
      size: 1024
    }),
    bannerURL:
      fetchedUser.bannerURL({
        extension: 'png',
        size: 1024
      }) || null,
    createdAt:
      fetchedUser.createdAt
        ? fetchedUser.createdAt.getTime()
        : null,
    accountAge:
      formatAccountAge(fetchedUser),
    badges,
    rarestBadge: rarestBadge
      ? {
          key: rarestBadge.key,
          name: rarestBadge.name,
          rarity: rarestBadge.rarity
        }
      : null,
    usernameScore,
    badgesScore,
    accountAgeScore,
    finalScore,
    scannedAt: Date.now()
  };
}

module.exports = {
  scan,
  getUsernameScore,
  getBadges,
  getBadgeScore,
  getAccountAgeScore,
  getFinalScore,
  getRarestBadge
};