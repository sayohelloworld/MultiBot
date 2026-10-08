const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const JSON_FILE = path.join(DATA_DIR, 'warnings.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load() {
    ensureDataDir();

    if (!fs.existsSync(JSON_FILE)) {
        return {};
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(JSON_FILE, 'utf8') || '{}'
        );

        return data && typeof data === 'object' ? data : {};
    } catch (error) {
        console.error(
            '[WARNINGS DATABASE] Impossible de lire warnings.json :',
            error
        );

        return {};
    }
}

function save(data) {
    ensureDataDir();

    try {
        fs.writeFileSync(
            JSON_FILE,
            JSON.stringify(data, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error(
            '[WARNINGS DATABASE] Impossible de sauvegarder warnings.json :',
            error
        );
    }
}

function ensureGuild(data, guildId) {
    if (!data[guildId] || typeof data[guildId] !== 'object') {
        data[guildId] = {
            warnings: {},
            permissions: []
        };
    }

    if (!data[guildId].warnings || typeof data[guildId].warnings !== 'object') {
        data[guildId].warnings = {};
    }

    if (!Array.isArray(data[guildId].permissions)) {
        data[guildId].permissions = [];
    }

    return data[guildId];
}

function getNextId(data) {
    let maxId = 0;

    for (const guild of Object.values(data)) {
        if (!guild || typeof guild !== 'object') continue;

        const warnings = guild.warnings || {};

        for (const userWarnings of Object.values(warnings)) {
            if (!Array.isArray(userWarnings)) continue;

            for (const warning of userWarnings) {
                const id = Number(warning?.id);

                if (Number.isFinite(id) && id > maxId) {
                    maxId = id;
                }
            }
        }
    }

    return maxId + 1;
}

function normalizeWarning(warning) {
    if (!warning) return null;

    return {
        id: Number(warning.id),
        guildId: warning.guildId ?? null,
        userId: warning.userId ?? null,
        moderatorId:
            warning.moderatorId ??
            warning.moderator ??
            'Inconnu',
        reason: warning.reason ?? null,
        createdAt:
            Number.isFinite(Number(warning.createdAt))
                ? Number(warning.createdAt)
                : Number(warning.timestamp) || Date.now()
    };
}

function get(id) {
    const data = load();
    const targetId = Number(id);

    for (const guild of Object.values(data)) {
        if (!guild || typeof guild !== 'object') continue;

        const warnings = guild.warnings || {};

        for (const userWarnings of Object.values(warnings)) {
            if (!Array.isArray(userWarnings)) continue;

            const warning = userWarnings.find(
                item => Number(item?.id) === targetId
            );

            if (warning) {
                return normalizeWarning(warning);
            }
        }
    }

    return null;
}

function create(guildId, userId, moderatorId, reason) {
    const data = load();
    const guild = ensureGuild(data, guildId);

    if (!guild.warnings[userId]) {
        guild.warnings[userId] = [];
    }

    const warning = {
        id: getNextId(data),
        guildId,
        userId,
        moderatorId: moderatorId || 'Inconnu',
        reason: reason?.trim() || null,
        createdAt: Date.now()
    };

    guild.warnings[userId].push(warning);

    save(data);

    return normalizeWarning(warning);
}

function getUserWarnings(guildId, userId) {
    const data = load();
    const guild = data[guildId];

    if (!guild?.warnings?.[userId]) {
        return [];
    }

    return guild.warnings[userId]
        .map(normalizeWarning)
        .filter(Boolean)
        .sort((a, b) => a.id - b.id);
}

function remove(id, guildId) {
    const data = load();
    const guild = data[guildId];

    if (!guild?.warnings) {
        return {
            changes: 0
        };
    }

    const targetId = Number(id);

    for (const [userId, warnings] of Object.entries(guild.warnings)) {
        if (!Array.isArray(warnings)) continue;

        const index = warnings.findIndex(
            warning => Number(warning?.id) === targetId
        );

        if (index === -1) continue;

        warnings.splice(index, 1);

        if (warnings.length === 0) {
            delete guild.warnings[userId];
        }

        save(data);

        return {
            changes: 1
        };
    }

    return {
        changes: 0
    };
}

function clearUser(guildId, userId) {
    const data = load();
    const guild = data[guildId];

    if (!guild?.warnings?.[userId]) {
        return {
            changes: 0
        };
    }

    const count = guild.warnings[userId].length;

    delete guild.warnings[userId];

    save(data);

    return {
        changes: count
    };
}

function countUserWarnings(guildId, userId) {
    const data = load();

    return Array.isArray(data[guildId]?.warnings?.[userId])
        ? data[guildId].warnings[userId].length
        : 0;
}

function hasPermission(guildId, roleId) {
    const data = load();
    const guild = data[guildId];

    return Boolean(
        guild?.permissions?.includes(roleId)
    );
}

function getPermissions(guildId) {
    const data = load();
    const guild = data[guildId];

    return Array.isArray(guild?.permissions)
        ? [...guild.permissions]
        : [];
}

function addPermission(guildId, roleId) {
    const data = load();
    const guild = ensureGuild(data, guildId);

    if (!guild.permissions.includes(roleId)) {
        guild.permissions.push(roleId);
        save(data);

        return {
            changes: 1
        };
    }

    return {
        changes: 0
    };
}

function removePermission(guildId, roleId) {
    const data = load();
    const guild = data[guildId];

    if (!guild?.permissions) {
        return {
            changes: 0
        };
    }

    const index = guild.permissions.indexOf(roleId);

    if (index === -1) {
        return {
            changes: 0
        };
    }

    guild.permissions.splice(index, 1);

    save(data);

    return {
        changes: 1
    };
}

function togglePermission(guildId, roleId) {
    if (hasPermission(guildId, roleId)) {
        removePermission(guildId, roleId);
        return false;
    }

    addPermission(guildId, roleId);
    return true;
}

function close() {
   
   
}

module.exports = {
    get,
    create,
    getUserWarnings,
    remove,
    clearUser,
    countUserWarnings,
    hasPermission,
    getPermissions,
    addPermission,
    removePermission,
    togglePermission,
    close
};