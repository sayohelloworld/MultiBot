const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: '3ds',

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
        path.join(__dirname, '../../assets/images/3ds.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 512,
        h: 512
      });

      base.composite(avatar, 0, 0);

      const buffer = await base.getBuffer('image/png');

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: '3ds.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};