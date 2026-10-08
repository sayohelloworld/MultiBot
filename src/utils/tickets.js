const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load() {
    ensureDataDir();

    if (!fs.existsSync(TICKETS_FILE)) {
        return {};
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(TICKETS_FILE, 'utf8') || '{}'
        );

        return data && typeof data === 'object' ? data : {};
    } catch (error) {
        console.error('[TICKETS] Erreur lecture tickets.json :', error);
        return {};
    }
}

function save(data) {
    ensureDataDir();

    try {
        fs.writeFileSync(
            TICKETS_FILE,
            JSON.stringify(data, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('[TICKETS] Erreur sauvegarde tickets.json :', error);
    }
}

function normalizeTicket(ticket) {
    if (!ticket) return null;

    return {
        channelId: ticket.channelId ?? null,
        guildId: ticket.guildId ?? null,
        userId: ticket.userId ?? null,
        categoryId: ticket.categoryId ?? null,
        categoryName: ticket.categoryName ?? null,
        status: ticket.status ?? 'open',
        number: ticket.number ?? null,
        createdAt: ticket.createdAt ?? Date.now(),
        acceptedBy: ticket.acceptedBy ?? null,
        closedBy: ticket.closedBy ?? null,
        closeReason: ticket.closeReason ?? null,
        closedAt: ticket.closedAt ?? null,
        transcriptSent: Boolean(ticket.transcriptSent)
    };
}

function get(channelId) {
    const data = load();

    if (!data[channelId]) {
        return null;
    }

    return normalizeTicket(data[channelId]);
}

function create(channelId, ticketData) {
    const data = load();

    const ticket = normalizeTicket({
        ...ticketData,
        channelId
    });

    data[channelId] = ticket;

    save(data);

    return ticket;
}

function update(channelId, fields) {
    const data = load();

    if (!data[channelId]) {
        return null;
    }

    const current = normalizeTicket(data[channelId]);

    const updated = normalizeTicket({
        ...current,
        ...fields,
        channelId
    });

    data[channelId] = updated;

    save(data);

    return updated;
}

function remove(channelId) {
    const data = load();

    if (!data[channelId]) {
        return false;
    }

    delete data[channelId];

    save(data);

    return true;
}

function getAll() {
    const data = load();
    const result = {};

    for (const [channelId, ticket] of Object.entries(data)) {
        result[channelId] = normalizeTicket({
            ...ticket,
            channelId: ticket.channelId || channelId
        });
    }

    return result;
}

function count() {
    return Object.keys(load()).length;
}

function close() {
   
   
}

module.exports = {
    get,
    create,
    update,
    remove,
    getAll,
    count,
    close
};
