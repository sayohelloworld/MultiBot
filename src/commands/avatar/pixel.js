const { Jimp } = require('jimp');

module.exports = {
  name: 'pixel',

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

      const width = avatar.bitmap.width;
      const height = avatar.bitmap.height;
      const size = 16;

      avatar.resize({
        w: size,
        h: size
      });

      avatar.resize({
        w: width,
        h: height,
        mode: Jimp.RESIZE_NEAREST_NEIGHBOR
      });

      const buffer = await avatar.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'pixel.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};