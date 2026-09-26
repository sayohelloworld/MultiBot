const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const ROOT = path.join(__dirname, "..");

const POSSIBLE_COMMAND_DIRS = [
    path.join(ROOT, "commands"),
    path.join(ROOT, "src", "commands"),
];

const COMMANDS_DIR = POSSIBLE_COMMAND_DIRS.find(dir => fs.existsSync(dir));
const OUTPUT_DIR = path.join(ROOT, "command-analysis");

if (!COMMANDS_DIR) {
    console.error("Aucun dossier commands trouvé.");
    process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function getFiles(dir) {
    const files = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...getFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

function clean(value) {
    if (value === undefined || value === null || value === "") {
        return "Non détecté";
    }

    return String(value)
        .replace(/\r/g, "")
        .replace(/\n+/g, "\n")
        .trim();
}

function getNodeName(node) {
    if (!node) return null;

    if (node.type === "Identifier") {
        return node.name;
    }

    if (
        node.type === "StringLiteral" ||
        node.type === "NumericLiteral" ||
        node.type === "BooleanLiteral"
    ) {
        return String(node.value);
    }

    if (
        node.type === "MemberExpression" ||
        node.type === "OptionalMemberExpression"
    ) {
        const object = getNodeName(node.object);
        const property = getNodeName(node.property);

        if (object && property) {
            return `${object}.${property}`;
        }

        return object || property;
    }

    return null;
}

function getLiteralValue(node) {
    if (!node) return null;

    if (
        node.type === "StringLiteral" ||
        node.type === "NumericLiteral" ||
        node.type === "BooleanLiteral"
    ) {
        return String(node.value);
    }

    if (node.type === "TemplateLiteral") {
        return node.quasis
            .map(part => part.value.raw)
            .join("${...}");
    }

    return null;
}

function getProperty(object, name) {
    if (!object || object.type !== "ObjectExpression") {
        return null;
    }

    for (const property of object.properties || []) {
        if (
            property.type === "ObjectProperty" ||
            property.type === "ObjectMethod"
        ) {
            const key = getNodeName(property.key);

            if (key === name) {
                return property.value || property;
            }
        }
    }

    return null;
}

function getExportObject(ast) {
    let result = null;

    function visit(node) {
        if (!node || result) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
                if (result) return;
            }

            return;
        }

        if (typeof node !== "object") return;

        if (
            node.type === "AssignmentExpression" &&
            node.left?.type === "MemberExpression" &&
            getNodeName(node.left.object) === "module" &&
            getNodeName(node.left.property) === "exports"
        ) {
            result = node.right;
            return;
        }

        for (const key of Object.keys(node)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(node[key]);

            if (result) return;
        }
    }

    visit(ast);

    return result;
}

function findExecute(ast) {
    let result = null;

    function visit(node) {
        if (!node || result) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
                if (result) return;
            }

            return;
        }

        if (typeof node !== "object") return;

        if (
            node.type === "ObjectMethod" &&
            getNodeName(node.key) === "execute"
        ) {
            result = node;
            return;
        }

        if (
            node.type === "ObjectProperty" &&
            getNodeName(node.key) === "execute"
        ) {
            result = node.value;
            return;
        }

        for (const key of Object.keys(node)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(node[key]);

            if (result) return;
        }
    }

    visit(ast);

    return result;
}

function collectRequires(ast) {
    const requires = [];

    function visit(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
            }

            return;
        }

        if (typeof node !== "object") return;

        if (
            node.type === "CallExpression" &&
            node.callee?.type === "Identifier" &&
            node.callee.name === "require"
        ) {
            const value = getLiteralValue(node.arguments?.[0]);

            if (value) {
                requires.push(value);
            }
        }

        for (const key of Object.keys(node)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(node[key]);
        }
    }

    visit(ast);

    return [...new Set(requires)];
}

function collectIdentifiers(node) {
    if (!node) return [];

    const identifiers = new Set();

    function visit(current) {
        if (!current) return;

        if (Array.isArray(current)) {
            for (const child of current) {
                visit(child);
            }

            return;
        }

        if (typeof current !== "object") return;

        if (current.type === "Identifier") {
            identifiers.add(current.name);
        }

        for (const key of Object.keys(current)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(current[key]);
        }
    }

    visit(node);

    return [...identifiers].sort();
}

function collectMemberExpressions(node) {
    if (!node) return [];

    const expressions = new Set();

    function visit(current) {
        if (!current) return;

        if (Array.isArray(current)) {
            for (const child of current) {
                visit(child);
            }

            return;
        }

        if (typeof current !== "object") return;

        if (
            current.type === "MemberExpression" ||
            current.type === "OptionalMemberExpression"
        ) {
            const name = getNodeName(current);

            if (name) {
                expressions.add(name);
            }
        }

        for (const key of Object.keys(current)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(current[key]);
        }
    }

    visit(node);

    return [...expressions].sort();
}

function collectCalls(node) {
    if (!node) return [];

    const calls = new Set();

    function visit(current) {
        if (!current) return;

        if (Array.isArray(current)) {
            for (const child of current) {
                visit(child);
            }

            return;
        }

        if (typeof current !== "object") return;

        if (current.type === "CallExpression") {
            const name = getNodeName(current.callee);

            if (name) {
                calls.add(name);
            }
        }

        for (const key of Object.keys(current)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(current[key]);
        }
    }

    visit(node);

    return [...calls].sort();
}

function collectVariables(node) {
    if (!node) return [];

    const variables = new Set();

    function visit(current) {
        if (!current) return;

        if (Array.isArray(current)) {
            for (const child of current) {
                visit(child);
            }

            return;
        }

        if (typeof current !== "object") return;

        if (
            current.type === "VariableDeclarator" &&
            current.id
        ) {
            const name = getNodeName(current.id);

            if (name) {
                variables.add(name);
            }
        }

        for (const key of Object.keys(current)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(current[key]);
        }
    }

    visit(node);

    return [...variables];
}

function collectArguments(execute) {
    if (!execute || !execute.params) {
        return [];
    }

    return execute.params.map(param => {
        if (param.type === "Identifier") {
            return param.name;
        }

        if (param.type === "AssignmentPattern") {
            return getNodeName(param.left);
        }

        if (param.type === "RestElement") {
            return `...${getNodeName(param.argument)}`;
        }

        return param.type;
    });
}

function collectPrefixArguments(execute) {
    if (!execute?.body) {
        return [];
    }

    const results = new Set();

    function visit(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
            }

            return;
        }

        if (typeof node !== "object") return;

        if (
            node.type === "MemberExpression" &&
            getNodeName(node.object) === "args"
        ) {
            const property = getNodeName(node.property);

            if (property) {
                if (node.computed) {
                    results.add(`args[${property}]`);
                } else {
                    results.add(`args.${property}`);
                }
            }
        }

        for (const key of Object.keys(node)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(node[key]);
        }
    }

    visit(execute.body);

    return [...results].sort();
}

function collectMessageUsage(execute) {
    if (!execute?.body) {
        return [];
    }

    return collectMemberExpressions(execute.body).filter(value =>
        value === "message" ||
        value.startsWith("message.")
    );
}

function collectClientUsage(execute) {
    if (!execute?.body) {
        return [];
    }

    return collectMemberExpressions(execute.body).filter(value =>
        value === "client" ||
        value.startsWith("client.")
    );
}

function collectDiscordFeatures(execute) {
    if (!execute?.body) {
        return [];
    }

    const expressions = collectMemberExpressions(execute.body);
    const calls = collectCalls(execute.body);

    const all = [
        ...expressions,
        ...calls,
    ];

    const features = new Set();

    const checks = [
        ["EmbedBuilder", "EmbedBuilder"],
        ["ContainerBuilder", "ContainerBuilder"],
        ["TextDisplayBuilder", "TextDisplayBuilder"],
        ["SeparatorBuilder", "SeparatorBuilder"],
        ["ActionRowBuilder", "ActionRowBuilder"],
        ["ButtonBuilder", "ButtonBuilder"],
        ["StringSelectMenuBuilder", "StringSelectMenuBuilder"],
        ["UserSelectMenuBuilder", "UserSelectMenuBuilder"],
        ["RoleSelectMenuBuilder", "RoleSelectMenuBuilder"],
        ["ChannelSelectMenuBuilder", "ChannelSelectMenuBuilder"],
        ["ModalBuilder", "ModalBuilder"],
        ["TextInputBuilder", "TextInputBuilder"],
        ["MessageFlags", "MessageFlags"],
        ["createMessageComponentCollector", "Component Collector"],
        ["createMessageCollector", "Message Collector"],
        ["awaitMessages", "Message Collector"],
        ["permissions.has", "Permission Check"],
        ["roles.cache", "Role Cache"],
        ["members.cache", "Member Cache"],
        ["channels.cache", "Channel Cache"],
        ["messages.fetch", "Message Fetch"],
        ["send", "Message Send"],
        ["reply", "Message Reply"],
        ["edit", "Message Edit"],
        ["delete", "Message Delete"],
    ];

    for (const [needle, label] of checks) {
        if (all.some(value => value.includes(needle))) {
            features.add(label);
        }
    }

    return [...features];
}

function collectConditions(execute) {
    if (!execute?.body) {
        return [];
    }

    const conditions = new Set();

    function visit(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
            }

            return;
        }

        if (typeof node !== "object") return;

        if (node.type === "IfStatement") {
            conditions.add("if");
        }

        if (node.type === "SwitchStatement") {
            conditions.add("switch");
        }

        if (node.type === "TryStatement") {
            conditions.add("try/catch");
        }

        if (node.type === "ForStatement") {
            conditions.add("for");
        }

        if (node.type === "ForOfStatement") {
            conditions.add("for...of");
        }

        if (node.type === "ForInStatement") {
            conditions.add("for...in");
        }

        if (node.type === "WhileStatement") {
            conditions.add("while");
        }

        if (node.type === "DoWhileStatement") {
            conditions.add("do...while");
        }

        for (const key of Object.keys(node)) {
            if (
                key === "loc" ||
                key === "start" ||
                key === "end" ||
                key === "tokens" ||
                key === "comments"
            ) {
                continue;
            }

            visit(node[key]);
        }
    }

    visit(execute.body);

    return [...conditions];
}

function getFunctionSource(source, execute) {
    if (!execute?.start || !execute?.end) {
        return "Execute introuvable.";
    }

    return source.slice(execute.start, execute.end);
}

function detectExportType(exportObject) {
    if (!exportObject) {
        return "Non détecté";
    }

    if (exportObject.type === "ObjectExpression") {
        return "module.exports = { ... }";
    }

    if (exportObject.type === "Identifier") {
        return `module.exports = ${exportObject.name}`;
    }

    return exportObject.type;
}

function createReport(file, source, ast) {
    const exportObject = getExportObject(ast);
    const execute = findExecute(ast);

    let name = null;
    let description = null;
    let category = null;

    if (exportObject?.type === "ObjectExpression") {
        name = getLiteralValue(
            getProperty(exportObject, "name")
        );

        description = getLiteralValue(
            getProperty(exportObject, "description")
        );

        category = getLiteralValue(
            getProperty(exportObject, "category")
        );
    }

    const requires = collectRequires(ast);

    const discordImports = requires.filter(
        value => value === "discord.js"
    );

    const localDependencies = requires.filter(
        value =>
            value.startsWith(".") ||
            value.startsWith("/")
    );

    const externalDependencies = requires.filter(
        value =>
            value !== "discord.js" &&
            !value.startsWith(".") &&
            !value.startsWith("/")
    );

    const parameters = collectArguments(execute);
    const prefixArguments = collectPrefixArguments(execute);
    const messageUsage = collectMessageUsage(execute);
    const clientUsage = collectClientUsage(execute);
    const variables = collectVariables(execute);
    const calls = collectCalls(execute?.body);
    const discordFeatures = collectDiscordFeatures(execute);
    const conditions = collectConditions(execute);
    const identifiers = collectIdentifiers(execute?.body);
    const executeSource = getFunctionSource(source, execute);

    const lines = [];

    lines.push("============================================================");
    lines.push(
        `COMMANDE : ${name || path.basename(file, ".js")}`
    );
    lines.push(
        `FICHIER : ${path.relative(ROOT, file).replace(/\\/g, "/")}`
    );
    lines.push("============================================================");
    lines.push("");

    lines.push("IDENTITÉ");
    lines.push("--------");
    lines.push(`name              : ${clean(name)}`);
    lines.push(`description       : ${clean(description)}`);
    lines.push(`category          : ${clean(category)}`);
    lines.push("");

    lines.push("EXPORT");
    lines.push("------");
    lines.push(
        `type              : ${detectExportType(exportObject)}`
    );
    lines.push("");

    lines.push("STRUCTURE EXECUTE");
    lines.push("-----------------");
    lines.push(
        `execute détecté   : ${execute ? "oui" : "non"}`
    );
    lines.push(
        `paramètres        : ${
            parameters.length
                ? parameters.join(", ")
                : "aucun"
        }`
    );
    lines.push("");

    lines.push("IMPORT DISCORD.JS");
    lines.push("-----------------");

    if (discordImports.length) {
        lines.push("- discord.js");
    } else {
        lines.push("- Aucun require direct de discord.js");
    }

    lines.push("");

    lines.push("DÉPENDANCES LOCALES");
    lines.push("--------------------");

    if (localDependencies.length) {
        for (const value of localDependencies) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune");
    }

    lines.push("");

    lines.push("DÉPENDANCES EXTERNES");
    lines.push("---------------------");

    if (externalDependencies.length) {
        for (const value of externalDependencies) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune");
    }

    lines.push("");

    lines.push("ARGUMENTS PREFIX");
    lines.push("----------------");

    if (prefixArguments.length) {
        for (const value of prefixArguments) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucun accès à args détecté");
    }

    lines.push("");

    lines.push("API MESSAGE");
    lines.push("-----------");

    if (messageUsage.length) {
        for (const value of messageUsage) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune");
    }

    lines.push("");

    lines.push("API CLIENT");
    lines.push("----------");

    if (clientUsage.length) {
        for (const value of clientUsage) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune");
    }

    lines.push("");

    lines.push("APPELS DE FONCTIONS");
    lines.push("-------------------");

    if (calls.length) {
        for (const value of calls) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucun");
    }

    lines.push("");

    lines.push("FONCTIONNALITÉS DISCORD");
    lines.push("-----------------------");

    if (discordFeatures.length) {
        for (const value of discordFeatures) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune fonctionnalité particulière détectée");
    }

    lines.push("");

    lines.push("CONTRÔLE DU FLUX");
    lines.push("----------------");

    if (conditions.length) {
        for (const value of conditions) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucun");
    }

    lines.push("");

    lines.push("VARIABLES LOCALES");
    lines.push("-----------------");

    if (variables.length) {
        for (const value of variables) {
            lines.push(`- ${value}`);
        }
    } else {
        lines.push("- Aucune");
    }

    lines.push("");

    lines.push("IDENTIFIANTS UTILISÉS");
    lines.push("---------------------");

    if (identifiers.length) {
        lines.push(identifiers.join(", "));
    } else {
        lines.push("Aucun");
    }

    lines.push("");

    lines.push("ANALYSE POUR CONVERSION SLASH");
    lines.push("------------------------------");

    const conversion = [];

    if (!execute) {
        conversion.push(
            "ATTENTION : aucune fonction execute détectée automatiquement."
        );
    }

    if (prefixArguments.length) {
        conversion.push(
            "Arguments prefix détectés : ils devront être transformés en options slash."
        );
    }

    if (
        messageUsage.some(
            value =>
                value.includes("mentions") ||
                value.includes("author")
        )
    ) {
        conversion.push(
            "La commande dépend d'informations du message ou de mentions."
        );
    }

    if (
        messageUsage.some(
            value => value.includes("reply")
        )
    ) {
        conversion.push(
            "message.reply() doit être adapté à interaction.reply()/followUp()."
        );
    }

    if (
        messageUsage.some(
            value => value.includes("channel.send")
        )
    ) {
        conversion.push(
            "message.channel.send() doit être adapté au système de réponse Interaction."
        );
    }

    if (
        discordFeatures.includes("Component Collector") ||
        discordFeatures.includes("Message Collector")
    ) {
        conversion.push(
            "Un collector est utilisé : son fonctionnement devra être vérifié après conversion."
        );
    }

    if (
        discordFeatures.includes("ContainerBuilder")
    ) {
        conversion.push(
            "Components V2 détecté : conserver ContainerBuilder et les composants associés."
        );
    }

    if (
        discordFeatures.includes("Permission Check")
    ) {
        conversion.push(
            "Des vérifications de permissions sont présentes."
        );
    }

    if (!conversion.length) {
        conversion.push(
            "Aucun problème particulier détecté automatiquement."
        );
    }

    for (const value of conversion) {
        lines.push(`- ${value}`);
    }

    lines.push("");

    lines.push("CODE DE EXECUTE");
    lines.push("---------------");
    lines.push(executeSource);

    lines.push("");

    lines.push("============================================================");
    lines.push("FIN DE L'ANALYSE");
    lines.push("============================================================");

    return lines.join("\n");
}

function analyzeFile(file) {
    const source = fs.readFileSync(file, "utf8");

    let ast;

    try {
        ast = parser.parse(source, {
            sourceType: "unambiguous",
            plugins: [
                "jsx",
                "classProperties",
                "objectRestSpread",
                "optionalChaining",
                "nullishCoalescingOperator",
                "dynamicImport",
                "topLevelAwait",
            ],
        });
    } catch (error) {
        const relative = path.relative(
            COMMANDS_DIR,
            file
        );

        console.log(`[ERREUR PARSER] ${relative}`);
        console.log(`                 ${error.message}`);

        const outputFile = path.join(
            OUTPUT_DIR,
            `${path
                .relative(COMMANDS_DIR, file)
                .replace(/\\/g, "__")
                .replace(/\//g, "__")
                .replace(/\.js$/i, ".txt")}`
        );

        fs.writeFileSync(
            outputFile,
            [
                "============================================================",
                `ERREUR D'ANALYSE : ${path.basename(file)}`,
                "============================================================",
                "",
                error.message,
                "",
                "Le parser JavaScript n'a pas pu analyser ce fichier.",
            ].join("\n"),
            "utf8"
        );

        return false;
    }

    try {
        const report = createReport(
            file,
            source,
            ast
        );

        const relative = path
            .relative(COMMANDS_DIR, file)
            .replace(/\\/g, "__")
            .replace(/\//g, "__")
            .replace(/\.js$/i, ".txt");

        const outputFile = path.join(
            OUTPUT_DIR,
            relative
        );

        fs.writeFileSync(
            outputFile,
            report,
            "utf8"
        );

        console.log(
            `[OK] ${path.relative(COMMANDS_DIR, file).replace(/\\/g, "/")}`
        );

        return true;
    } catch (error) {
        const relative = path.relative(
            COMMANDS_DIR,
            file
        );

        console.log(`[ERREUR ANALYSE] ${relative}`);
        console.log(`                  ${error.stack || error.message}`);

        return false;
    }
}

function main() {
    console.log("");
    console.log("============================================================");
    console.log("                 ANALYSEUR COMMANDES");
    console.log("============================================================");
    console.log("");

    console.log(
        `Dossier commandes : ${path.relative(ROOT, COMMANDS_DIR)}`
    );

    console.log(
        `Dossier rapports  : ${path.relative(ROOT, OUTPUT_DIR)}`
    );

    console.log("");

    const files = getFiles(COMMANDS_DIR);

    if (!files.length) {
        console.log("Aucune commande .js trouvée.");
        return;
    }

    let success = 0;
    let failed = 0;

    for (const file of files) {
        if (analyzeFile(file)) {
            success++;
        } else {
            failed++;
        }
    }

    console.log("");
    console.log("============================================================");
    console.log(`Commandes trouvées : ${files.length}`);
    console.log(`Analyses réussies  : ${success}`);
    console.log(`Analyses en erreur : ${failed}`);
    console.log("============================================================");
    console.log("");
}

main();
