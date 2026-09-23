const { getSecurity } = require('../utils/securityConfig');

module.exports = {
    name: 'messageCreate',

    async execute(message) {
        if (message.guild) return;
        if (message.author?.bot) return;

        const security = getSecurity(message.client.user.id).antidm;

        if (!security?.enabled || !security.blockBotDMs) return;

        try {
            await message.delete();
        } catch {}
    }
};
