const guildConfig = require('../utils/guildConfig');

let intervalStarted = false;

function getToday() {
    const now = new Date();

    return {
        day: now.getDate(),
        month: now.getMonth() + 1,
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    };
}

async function checkBirthdays(client) {
    const today = getToday();

    for (const guild of client.guilds.cache.values()) {
        const config = guildConfig.getAll(guild.id);
        const birthdayConfig = config.birthdayConfig;

        if (!birthdayConfig) continue;

        const channelId = birthdayConfig.channelId;
        const birthdays = birthdayConfig.birthdays || {};

        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);

        if (!channel || !channel.isTextBased()) continue;

        let changed = false;

        for (const [userId, birthday] of Object.entries(birthdays)) {
            if (birthday.day !== today.day || birthday.month !== today.month) {
                continue;
            }

            if (birthday.lastAnnounced === today.date) {
                continue;
            }

            const member = await guild.members.fetch(userId).catch(() => null);

            if (!member) continue;

            const embed = {
                title: '🎂 Joyeux anniversaire !',
                description: `Aujourd’hui, c’est l’anniversaire de ${member} !`,
                color: 0x5865F2,
                timestamp: new Date()
            };

            await channel.send({
                embeds: [embed]
            }).catch(() => null);

            birthday.lastAnnounced = today.date;
            changed = true;
        }

        if (changed) {
            guildConfig.save(guild.id, config);
        }
    }
}

function startBirthdayChecker(client) {
    if (intervalStarted) return;

    intervalStarted = true;

    checkBirthdays(client).catch(console.error);

    setInterval(() => {
        checkBirthdays(client).catch(console.error);
    }, 60 * 1000);
}

module.exports = {
    startBirthdayChecker,
    checkBirthdays
};
