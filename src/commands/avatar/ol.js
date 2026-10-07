const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'ol',

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

      const avatar = await Jimp.read(avatarURL);
      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/ol.png')
      );

      const x = avatar.bitmap.width - base.bitmap.width;
      const y = avatar.bitmap.height - base.bitmap.height;

      avatar.composite(base, x, y);

      const buffer = await avatar.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'ol.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};