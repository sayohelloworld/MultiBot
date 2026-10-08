const guildConfig = require('./guildConfig');

const STAFF_ROLE_ID = '1543650420583301251';

function getPointsData(guildId) {
    return guildConfig.get(guildId, 'points') || {};
}

function getUserPoints(guildId, userId) {
    const points = getPointsData(guildId);

    if (!points[userId]) {
        points[userId] = {
            current: 0,
            total: 0
        };

        savePoints(guildId, points);
    }

    return points[userId];
}

function savePoints(guildId, points) {
    guildConfig.set(guildId, 'points', points);
}

async function addPoints(guildOrId, userId, amount) {
    if (!guildOrId) return null;

    const guildId =
        typeof guildOrId === 'string'
            ? guildOrId
            : guildOrId.id;

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return getUserPoints(guildId, userId);
    }

    const points = getPointsData(guildId);

    if (!points[userId]) {
        points[userId] = {
            current: 0,
            total: 0
        };
    }

    points[userId].current += amount;
    points[userId].total += amount;

    savePoints(guildId, points);

    return points[userId];
}

async function removePoints(guildOrId, userId, amount) {
    if (!guildOrId) return null;

    const guildId =
        typeof guildOrId === 'string'
            ? guildOrId
            : guildOrId.id;

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return getUserPoints(guildId, userId);
    }

    const points = getPointsData(guildId);

    if (!points[userId]) {
        points[userId] = {
            current: 0,
            total: 0
        };
    }

    points[userId].current = Math.max(
        0,
        points[userId].current - amount
    );

    savePoints(guildId, points);

    return points[userId];
}

function resetCurrentPoints(guildId) {
    const points = getPointsData(guildId);

    for (const userId of Object.keys(points)) {
        points[userId].current = 0;
    }

    savePoints(guildId, points);
}

async function getLeaderboard(guild) {
    if (!guild) return [];

    const points = getPointsData(guild.id);

    await guild.members.fetch().catch(() => {});

    return Object.entries(points)
        .filter(([userId]) => {
            const member = guild.members.cache.get(userId);

            return (
                member &&
                member.roles.cache.has(STAFF_ROLE_ID)
            );
        })
        .map(([userId, data]) => ({
            userId,
            current: Number(data.current) || 0,
            total: Number(data.total) || 0
        }))
        .sort((a, b) => b.current - a.current)
        .map((entry, index) => ({
            ...entry,
            position: index + 1
        }));
}

async function getPosition(guild, userId) {
    const leaderboard = await getLeaderboard(guild);

    const index = leaderboard.findIndex(
        entry => entry.userId === userId
    );

    if (index === -1) return null;

    return index + 1;
}

module.exports = {
    getPointsData,
    getUserPoints,
    addPoints,
    removePoints,
    resetCurrentPoints,
    getLeaderboard,
    getPosition
};