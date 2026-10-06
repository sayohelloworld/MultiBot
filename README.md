# 🤖 **Découvrez MultiBot — Le bot Discord tout-en-un pour votre serveur !**

> MultiBot regroupe **tout ce dont votre serveur a besoin** dans un seul bot : modération, utilitaires, gestion, automatisation, divertissement et bien plus encore. Avec **plus de 300 commandes**, MultiBot propose une solution complète, gratuite et régulièrement mise à jour pour les serveurs Discord.

## 🐱 **MultiBot**

**100 % gratuit**

> ✅ **300+ commandes multifonctions**
> ✅ Modération, utilitaires, gestion, divertissement et bien plus
> ✅ **Mises à jour et maintenance régulières**
> ✅ **Support dédié**

## ⚡ **Fonctionnalités**

MultiBot propose de nombreux systèmes conçus pour simplifier la gestion de votre serveur et améliorer l'expérience de votre communauté.

* 🛡️ Modération & AutoMod
* ⚙️ Configuration du serveur
* 🎫 Système de tickets
* 🎉 Système de giveaways
* 🎂 Système d'anniversaires
* 🔊 Gestion des salons vocaux
* 💰 Système d'économie
* ⭐ Niveaux & points
* 🎵 Musique
* 🎮 Jeux & commandes fun
* 📊 Utilitaires & informations
* 🤖 Automatisation
* 🔐 Fonctionnalités de sécurité
* 🧰 Sauvegardes & gestion du serveur
* 👤 Outils d'avatars & profils
* Et bien plus encore

## 📦 **Installation**

### Prérequis

* [Node.js](https://nodejs.org/) **v18 ou plus récent**
* Une application Discord avec un bot
* Un serveur Discord sur lequel vous avez l'autorisation d'ajouter le bot

### Cloner le dépôt

```bash
git clone https://github.com/sayohelloworld/MultiBot.git
cd MultiBot
```

### Installer les dépendances

```bash
npm install
```

## ⚙️ **Configuration**

Avant de démarrer le bot, créez ou modifiez le fichier `config.js`.

Exemple :

```js
module.exports = {
  token: "VOTRE_TOKEN_DISCORD",
  prefix: "+",
  clientId: "ID_DU_BOT",
  embedColor: "#49ff02",
  ownerId: "VOTRE_ID_DISCORD",
  supportServerInvite: "https://discord.gg/votre-serveur"
};
```

Remplacez les valeurs par vos propres informations Discord.

> ⚠️ **Ne publiez jamais le token de votre bot ni aucune autre information privée sur GitHub.**
>
> Si vous utilisez un dépôt public, assurez-vous que `config.js` est présent dans votre `.gitignore` ou utilisez des variables d'environnement.

## 🚀 **Déploiement**

Après avoir configuré votre bot, déployez les commandes avec :

```bash
node deploy-commands.js
```

Puis démarrez MultiBot :

```bash
node index.js
```

Si votre installation utilise d'autres fichiers de démarrage ou de déploiement, adaptez les noms de fichiers à votre configuration.

### 🔄 **Utilisation avec PM2**

Pour maintenir le bot actif en permanence, vous pouvez utiliser PM2 :

```bash
npm install -g pm2
pm2 start index.js --name MultiBot
pm2 save
```

Pour redémarrer le bot :

```bash
pm2 restart MultiBot
```

Pour consulter les logs :

```bash
pm2 logs MultiBot
```

## 🤝 **Contribuer**

Les contributions, suggestions et améliorations sont les bienvenues.

Si vous trouvez un bug ou avez une idée pour une nouvelle fonctionnalité, vous pouvez ouvrir une **Issue** ou proposer une **Pull Request**.

## 📄 **Licence**

MultiBot est distribué sous **licence MIT**.

Vous êtes libre d'utiliser, modifier, distribuer et améliorer le projet conformément aux conditions de la licence MIT.

Consultez le fichier [`LICENSE`](LICENSE) pour obtenir le texte complet de la licence.

---

## ❤️ **Développé avec le cœur**

> MultiBot est développé avec **passion, détermination et beaucoup de cœur**.
>
> Créé pour apprendre, progresser, expérimenter et construire un bot Discord complet de A à Z.
>
> **Fait avec ❤️ pour les communautés Discord.**
