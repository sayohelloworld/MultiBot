const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");
const jsonFile = path.join(dataDir, "stats.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function loadData() {
    if (!fs.existsSync(jsonFile)) {
        return {};
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(jsonFile, "utf8") || "{}"
        );

        if (!data || typeof data !== "object") {
            return {};
        }

        return data;
    } catch (err) {
        console.error("[STATS] Erreur lecture stats.json :", err);
        return {};
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(
            jsonFile,
            JSON.stringify(data, null, 2)
        );
    } catch (err) {
        console.error("[STATS] Erreur sauvegarde stats.json :", err);
    }
}

function getGuildData(data, guildId) {
    if (!data[guildId]) {
        data[guildId] = {
            messages: [],
            voice: []
        };
    }

    if (!Array.isArray(data[guildId].messages)) {
        data[guildId].messages = [];
    }

    if (!Array.isArray(data[guildId].voice)) {
        data[guildId].voice = [];
    }

    return data[guildId];
}

function cleanup(guildId) {
    const data = loadData();
    const guild = data[guildId];

    if (!guild) {
        return;
    }

    const limit = Date.now() - (
        14 * 24 * 60 * 60 * 1000
    );

    guild.messages = guild.messages.filter(
        message => Number(message.timestamp) >= limit
    );

    guild.voice = guild.voice.filter(
        voice => Number(voice.endedAt) >= limit
    );

    if (
        guild.messages.length === 0 &&
        guild.voice.length === 0
    ) {
        delete data[guildId];
    }

    saveData(data);
}

function addMessage(message) {
    if (!message.guild || !message.author || message.author.bot) {
        return;
    }

    const data = loadData();
    const guild = getGuildData(data, message.guild.id);

    guild.messages.push({
        userId: message.author.id,
        channelId: message.channel.id,
        timestamp: Date.now()
    });

    const limit = Date.now() - (
        14 * 24 * 60 * 60 * 1000
    );

    guild.messages = guild.messages.filter(
        msg => Number(msg.timestamp) >= limit
    );

    saveData(data);
}

function addVoiceSession({
    guildId,
    userId,
    channelId,
    startedAt,
    endedAt
}) {
    if (
        !guildId ||
        !userId ||
        !channelId ||
        !startedAt ||
        !endedAt
    ) {
        return;
    }

    const duration = endedAt - startedAt;

    if (duration <= 0) {
        return;
    }

    const data = loadData();
    const guild = getGuildData(data, guildId);

    guild.voice.push({
        userId,
        channelId,
        startedAt,
        endedAt,
        duration
    });

    const limit = Date.now() - (
        14 * 24 * 60 * 60 * 1000
    );

    guild.voice = guild.voice.filter(
        voice => Number(voice.endedAt) >= limit
    );

    saveData(data);
}

function getStats(guildId, days) {
    cleanup(guildId);

    const data = loadData();
    const guild = data[guildId];

    if (!guild) {
        return {
            messages: [],
            voice: []
        };
    }

    const since = Date.now() - (
        days * 24 * 60 * 60 * 1000
    );

    return {
        messages: guild.messages
            .filter(
                message =>
                    Number(message.timestamp) >= since
            )
            .map(message => ({
                userId: message.userId,
                channelId: message.channelId,
                timestamp: message.timestamp
            })),

        voice: guild.voice
            .filter(
                voice =>
                    Number(voice.endedAt) >= since
            )
            .map(voice => ({
                userId: voice.userId,
                channelId: voice.channelId,
                startedAt: voice.startedAt,
                endedAt: voice.endedAt,
                duration: voice.duration
            }))
    };
}

module.exports = {
    addMessage,
    addVoiceSession,
    getStats,
    cleanup
};