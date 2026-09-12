const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "src");
const FOLDERS = ["commands", "slashcommands"];
const OUTPUT = path.join(__dirname, "commandes.txt");

const results = [];

function getCommandName(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];

        const command = require(filePath);

        if (typeof command === "string") {
            return command;
        }

        if (command?.name) {
            return command.name;
        }

        if (command?.data?.name) {
            return command.data.name;
        }

        if (command?.default?.name) {
            return command.default.name;
        }

        if (command?.default?.data?.name) {
            return command.default.data.name;
        }
    } catch {}

    try {
        const content = fs.readFileSync(filePath, "utf8");

        const patterns = [
            /name\s*:\s*["'`]([^"'`]+)["'`]/,
            /\.setName\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/,
            /data\s*:\s*\{[\s\S]*?name\s*:\s*["'`]([^"'`]+)["'`]/,
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);

            if (match) {
                return match[1];
            }
        }
    } catch {}

    return null;
}

function scanDirectory(directory, type) {
    if (!fs.existsSync(directory)) {
        return;
    }

    const entries = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            scanDirectory(fullPath, type);
            continue;
        }

        if (!/\.(js|cjs|mjs)$/.test(entry.name)) {
            continue;
        }

        const name = getCommandName(fullPath);

        results.push({
            type,
            name: name || entry.name.replace(/\.(js|cjs|mjs)$/, ""),
            file: path.relative(__dirname, fullPath),
        });
    }
}

for (const folder of FOLDERS) {
    scanDirectory(path.join(ROOT, folder), folder);
}

results.sort((a, b) => {
    if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
    }

    return a.name.localeCompare(b.name);
});

const commands = results.filter(
    command => command.type === "commands"
);

const slashCommands = results.filter(
    command => command.type === "slashcommands"
);

let output = "";

output += "========================================\n";
output += "           COMMANDES DU BOT\n";
output += "========================================\n\n";

output += `COMMANDES PREFIX (${commands.length})\n`;
output += "----------------------------------------\n";

for (const command of commands) {
    output += `!${command.name}\n`;
}

output += `\nSLASH COMMANDS (${slashCommands.length})\n`;
output += "----------------------------------------\n";

for (const command of slashCommands) {
    output += `/${command.name}\n`;
}

output += "\n========================================\n";
output += `TOTAL : ${results.length} commandes\n`;
output += "========================================\n\n";

output += "DETAIL DES FICHIERS\n";
output += "----------------------------------------\n";

for (const command of results) {
    output += `[${command.type}] ${command.name} -> ${command.file}\n`;
}

fs.writeFileSync(OUTPUT, output, "utf8");

console.log(`Liste générée : ${OUTPUT}`);
