const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'gameboy',

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
        path.join(__dirname, '../../assets/images/gameboy.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 814,
        h: 764
      });

      base.composite(avatar, 340, 270);

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'gameboy.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};