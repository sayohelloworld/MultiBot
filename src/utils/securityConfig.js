const guildConfig = require('./guildConfig');

const DEFAULTS = {
    antialt: {
        enabled: false,
        minAccountAge: 7 * 24 * 60 * 60 * 1000,
        action: 'kick',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    antibadword: {
        enabled: false,
        action: 'delete',
        words: [],
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    antiban: {
        enabled: false,
        threshold: 1,
        action: 'ban',
        whitelistUsers: [],
        managerRoles: []
    },
    antibot: {
        enabled: false,
        action: 'kick',
        whitelistUsers: [],
        managerRoles: []
    },
    antichannel: {
        enabled: false,
        action: 'delete',
        whitelistUsers: [],
        managerRoles: []
    },
    antidm: {
        enabled: false,
        blockBotDMs: false,
        managerRoles: []
    },
    antijoin: {
        enabled: false,
        action: 'kick',
        maxJoins: 5,
        interval: 10000,
        whitelistUsers: [],
        managerRoles: []
    },
    antikick: {
        enabled: false,
        threshold: 1,
        action: 'ban',
        whitelistUsers: [],
        managerRoles: []
    },
    antilink: {
        enabled: false,
        action: 'delete',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    antimassmention: {
        enabled: false,
        maxUsers: 5,
        maxRoles: 3,
        maxTotal: 5,
        action: 'delete',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    timeout: {
        enabled: false,
        duration: 10 * 60 * 1000,
        action: 'timeout',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    webhook: {
        enabled: false,
        action: 'delete',
        whitelistUsers: [],
        managerRoles: []
    },
    update: {
        enabled: false,
        action: 'delete',
        whitelistUsers: [],
        managerRoles: []
    },
    role: {
        enabled: false,
        action: 'delete',
        whitelistUsers: [],
        managerRoles: []
    },
    whitelist: {
        enabled: true,
        users: [],
        roles: [],
        channels: [],
        managerRoles: []
    },
    blacklist: {
        enabled: true,
        users: [],
        roles: [],
        managerRoles: []
    },
    serverlink: {
        enabled: false,
        action: 'delete',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    },
    spam: {
        enabled: false,
        maxMessages: 5,
        interval: 5000,
        duplicateLimit: 3,
        action: 'delete',
        whitelistRoles: [],
        whitelistChannels: [],
        whitelistUsers: [],
        managerRoles: []
    }
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getSecurity(guildId) {
    const saved = guildConfig.getAll(guildId).security || {};
    const result = {};

    for (const [name, defaults] of Object.entries(DEFAULTS)) {
        const current = saved[name] || {};
        result[name] = {
            ...clone(defaults),
            ...current
        };

        for (const field of [
            'whitelistRoles',
            'whitelistChannels',
            'whitelistUsers',
            'managerRoles',
            'words',
            'users',
            'roles',
            'channels'
        ]) {
            if (field in defaults || field in current) {
                result[name][field] = Array.isArray(current[field])
                    ? current[field]
                    : [];
            }
        }
    }

    return result;
}

function getModule(guildId, name) {
    return getSecurity(guildId)[name] || null;
}

function saveModule(guildId, name, data) {
    const security = getSecurity(guildId);
    security[name] = data;
    guildConfig.set(guildId, 'security', security);
}

function setField(guildId, name, field, value) {
    const module = getModule(guildId, name);
    if (!module) return false;
    module[field] = value;
    saveModule(guildId, name, module);
    return true;
}

function isWhitelisted(message, module) {
    if (!module) return false;

    const userId = message?.author?.id || message?.user?.id || message?.member?.id;
    const channelId = message?.channel?.id;

    if (userId && module.whitelistUsers?.includes(userId)) return true;
    if (channelId && module.whitelistChannels?.includes(channelId)) return true;

    if (message?.member && module.whitelistRoles?.some(id =>
        message.member.roles.cache.has(id)
    )) {
        return true;
    }

    return false;
}

function isAdministrator(member) {
    return Boolean(member?.permissions?.has('Administrator'));
}

function isManager(member, module) {
    if (!member || isAdministrator(member)) return true;

    return Boolean(
        module?.managerRoles?.some(roleId =>
            member.roles.cache.has(roleId)
        )
    );
}

module.exports = {
    DEFAULTS,
    getSecurity,
    getModule,
    saveModule,
    setField,
    isWhitelisted,
    isAdministrator,
    isManager
};
