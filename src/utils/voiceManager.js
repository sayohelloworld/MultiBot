const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/voicemanager.json');

function loadData() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, '{}', 'utf8');
    }

    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataPath,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

function getGuild(guildId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            tempChannels: {}
        };

        saveData(data);
    }

    return data[guildId];
}

function addChannel(guildId, channelId, ownerId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            tempChannels: {}
        };
    }

    data[guildId].tempChannels[channelId] = {
        ownerId
    };

    saveData(data);
}

function removeChannel(guildId, channelId) {
    const data = loadData();

    if (!data[guildId]) return;

    delete data[guildId].tempChannels[channelId];

    saveData(data);
}

function getChannel(guildId, channelId) {
    const data = loadData();

    if (!data[guildId]) return null;

    return data[guildId].tempChannels[channelId] || null;
}

function getAllChannels(guildId) {
    const data = loadData();

    if (!data[guildId]) return {};

    return data[guildId].tempChannels || {};
}

module.exports = {
    getGuild,
    addChannel,
    removeChannel,
    getChannel,
    getAllChannels
};