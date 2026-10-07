const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'tattoo',

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/tattoo.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 300,
        h: 300
      });

      avatar.rotate(-10);

      base.composite(avatar, 84, 690);

      const buffer = await base.getBuffer('image/png');

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'tattoo.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};