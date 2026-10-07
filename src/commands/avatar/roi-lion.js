const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'roi-lion',
  description: "Dessine l'avatar d'un utilisateur sur la scène du Roi Lion.",

  async execute(client, message, args) {
    try {
      const member =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.author;

      const avatarURL = member.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/roi-lion.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 130,
        h: 150
      });

      avatar.rotate(-24);

      base.composite(avatar, 115, 125);

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'roi-lion.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};