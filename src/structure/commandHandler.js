const fs = require('fs');
const path = require('path');

function getCommandFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(getCommandFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

module.exports = (client) => {
  const commandsDir = path.join(__dirname, '../commands');
  const commandFiles = getCommandFiles(commandsDir);

  for (const filePath of commandFiles) {
      const command = require(filePath);
      if (command.name && (typeof command.execute === 'function' || typeof command.run === 'function')) {
        if (typeof command.execute !== 'function' && typeof command.run === 'function') {
          command.execute = command.run;
        }

       
        const relativePath = path.relative(commandsDir, filePath);
        const category = path.dirname(relativePath).split(path.sep)[0] || 'other';
        command.category = category;
        client.commands.set(command.name, command);
        console.log(`Commande chargée : ${command.name}`);
      } else {
        console.log(`❌ Erreur dans le fichier commande : ${path.basename(filePath)}`);
      }
    }
};
