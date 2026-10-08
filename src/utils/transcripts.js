const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const TRANSCRIPTS_FILE = path.join(DATA_DIR, 'transcripts.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load() {
    ensureDataDir();

    if (!fs.existsSync(TRANSCRIPTS_FILE)) {
        return [];
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(TRANSCRIPTS_FILE, 'utf8') || '[]'
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[TRANSCRIPTS] Erreur lecture transcripts.json :', error);
        return [];
    }
}

function save(data) {
    ensureDataDir();

    try {
        fs.writeFileSync(
            TRANSCRIPTS_FILE,
            JSON.stringify(data, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('[TRANSCRIPTS] Erreur sauvegarde transcripts.json :', error);
    }
}

function normalizeTranscript(data, id) {
    return {
        id,

        ticketNumber: data.ticketNumber ?? null,
        channelId: data.channelId ?? null,
        guildId: data.guildId ?? null,
        userId: data.userId ?? null,

        categoryId: data.categoryId ?? null,
        categoryName: data.categoryName ?? null,

        closedBy: data.closedBy ?? null,
        reason: data.reason ?? null,

        createdAt: data.createdAt ?? Date.now(),
        closedAt: data.closedAt ?? Date.now(),

        messagesCount: data.messagesCount ?? 0,

        filename: data.filename ?? null,
        filepath: data.filepath ?? null,

        sent: Boolean(data.sent),

        discordMessageId: data.discordMessageId ?? null,
        discordAttachmentUrl: data.discordAttachmentUrl ?? null
    };
}

function create(data) {
    const transcripts = load();

    const nextId = transcripts.length > 0
        ? Math.max(
            ...transcripts.map(transcript =>
                Number(transcript.id) || 0
            )
        ) + 1
        : 1;

    const transcript = normalizeTranscript(data, nextId);

    transcripts.push(transcript);

    save(transcripts);

    return transcript;
}

function get(id) {
    const transcripts = load();

    const transcript = transcripts.find(
        item => Number(item.id) === Number(id)
    );

    if (!transcript) {
        return null;
    }

    return normalizeTranscript(transcript, transcript.id);
}

function getByChannel(channelId) {
    const transcripts = load();

    return transcripts
        .filter(transcript => transcript.channelId === channelId)
        .sort((a, b) => Number(b.id) - Number(a.id))
        .map(transcript =>
            normalizeTranscript(transcript, transcript.id)
        );
}

function getAll() {
    return load()
        .sort((a, b) => Number(b.id) - Number(a.id))
        .map(transcript =>
            normalizeTranscript(transcript, transcript.id)
        );
}

function markSent(id, discordMessageId, discordAttachmentUrl) {
    const transcripts = load();

    const index = transcripts.findIndex(
        transcript => Number(transcript.id) === Number(id)
    );

    if (index === -1) {
        return null;
    }

    transcripts[index].sent = true;
    transcripts[index].discordMessageId =
        discordMessageId ?? null;
    transcripts[index].discordAttachmentUrl =
        discordAttachmentUrl ?? null;

    save(transcripts);

    return normalizeTranscript(
        transcripts[index],
        transcripts[index].id
    );
}

function remove(id) {
    const transcripts = load();

    const index = transcripts.findIndex(
        transcript => Number(transcript.id) === Number(id)
    );

    if (index === -1) {
        return {
            changes: 0
        };
    }

    transcripts.splice(index, 1);

    save(transcripts);

    return {
        changes: 1
    };
}

function close() {
   
   
}

module.exports = {
    create,
    get,
    getByChannel,
    getAll,
    markSent,
    remove,
    close
};