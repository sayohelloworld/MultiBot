const { Jimp } = require('jimp');

module.exports = {
  name: 'inverse',

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

      avatar.scan((x, y, idx) => {
        avatar.bitmap.data[idx] = 255 - avatar.bitmap.data[idx];
        avatar.bitmap.data[idx + 1] = 255 - avatar.bitmap.data[idx + 1];
        avatar.bitmap.data[idx + 2] = 255 - avatar.bitmap.data[idx + 2];
      });

      const buffer = await avatar.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'inverse.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};