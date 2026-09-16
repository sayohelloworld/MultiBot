# 🤖 MultiBot

MultiBot est un bot Discord multifonctions développé avec Node.js et Discord.js v14.

Il regroupe plusieurs systèmes permettant de gérer, sécuriser et améliorer un serveur Discord.

## Fonctionnalités

### 🛡️ Modération
- Ban, kick, mute et warn
- Commandes de modération
- Permissions configurables
- Logs de modération
- Protection anti-raid
- Protection anti-spam
- Système de captcha

### 💰 Économie
- Système de balance
- Banque
- Récompenses quotidiennes
- Paiements entre utilisateurs
- Classements
- Casino et jeux virtuels
- Commandes économiques

### 🎵 Musique
- Lecture de musique
- Support YouTube et SoundCloud
- File d'attente
- Skip et stop
- Playlists
- Gestion des salons vocaux

### 🎫 Tickets
- Système de tickets configurable
- Plusieurs catégories
- Descriptions et emojis personnalisés
- Rôles staff dédiés
- Catégories Discord dédiées
- Logs des tickets
- Panneau personnalisable
- Interface Discord Components V2
- Bouton automatique avec une seule catégorie
- Menu de sélection avec plusieurs catégories

### 🔧 Utilitaires
- Informations sur le bot
- Informations sur le serveur
- Informations utilisateur
- Ping et latence
- Système d'aide
- Outils de gestion du serveur

## 📋 Prérequis

- Node.js 18 ou supérieur
- npm
- Une application Discord
- Un token Discord
- Les permissions et intents nécessaires

## 📥 Installation

```bash
git clone https://github.com/sayohelloworld/MultiBot.git
cd MultiBot
npm install
````

Configurez ensuite votre fichier `config.js`.

## ⚙️ Configuration

Exemple :

```js
module.exports = {
    token: "VOTRE_TOKEN_DISCORD",
    clientId: "VOTRE_CLIENT_ID",
    prefix: "+",
    embedColor: "#49ff02",
    ownerId: "VOTRE_ID_DISCORD",
    supportServerInvite: "https://discord.gg/votre-serveur"
};
```

| Option                | Description                      |
| --------------------- | -------------------------------- |
| `token`               | Token du bot Discord             |
| `clientId`            | ID de l'application Discord      |
| `prefix`              | Préfixe des commandes            |
| `embedColor`          | Couleur par défaut des embeds    |
| `ownerId`             | ID Discord du propriétaire       |
| `supportServerInvite` | Invitation du serveur de support |

> Ne partagez jamais votre token Discord publiquement.

## 🚀 Lancement

```bash
node index.js
```

Le bot se connectera ensuite à Discord.

## 🎫 Système de tickets

Commandes principales :

```text
+ticket panel [#salon]
+ticket addcat <nom> [emoji] [description]
+ticket removecat <nom>
+ticket setrole <catégorie> @Role
+ticket removerole <catégorie> @Role
+ticket setcategory <catégorie> <ID>
+ticket setdesc [catégorie] <texte>
+ticket setcolor <#hex>
+ticket setlog #salon
+ticket config
```

Une catégorie de ticket peut disposer de :

* Un nom
* Un emoji
* Une description
* Un ou plusieurs rôles staff
* Une catégorie Discord dédiée

Avec une seule catégorie, le panneau utilise automatiquement un bouton.

Avec plusieurs catégories, un menu de sélection est utilisé.

## 📁 Structure

```text
├── index.js
├── config.js
├── version.js
├── data/
└── src/
    ├── assets/
    ├── commands/
    ├── slashCommands/
    ├── events/
    ├── structure/
    └── utils/
```

### Dossiers principaux

* `commands/` — Commandes avec préfixe
* `slashCommands/` — Commandes slash
* `events/` — Événements Discord
* `structure/` — Structures et handlers principaux
* `utils/` — Modules utilitaires
* `assets/` — Ressources du bot
* `data/` — Données et configurations

## ⌨️ Commandes

Le préfixe par défaut est `+`.

Exemples :

```text
+help
+ping
+ticket
+ticket config
```

Les commandes peuvent évoluer selon les versions de MultiBot.

## 🌐 Déploiement

MultiBot peut fonctionner sur un VPS ou une plateforme compatible avec Node.js.

Exemples :

* Railway
* Render
* Replit
* OVHcloud
* Hetzner
* DigitalOcean

Pour un fonctionnement 24/7, un VPS ou un hébergement cloud est recommandé.

## 🔐 Sécurité

Ne publiez jamais :

* Votre token Discord
* Votre fichier `.env`
* Vos identifiants privés
* Vos clés ou informations sensibles

## 📜 Licence

MultiBot est distribué sous licence MIT.

Voir [`LICENSE`](LICENSE) pour plus d'informations.
