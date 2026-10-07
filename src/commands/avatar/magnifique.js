const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'magnifique',

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
        path.join(__dirname, '../../assets/images/magnifique.png')
      );

      const avatar = await Jimp.read(avatarURL);

      const background = new Jimp({
        width: base.bitmap.width,
        height: base.bitmap.height,
        color: 0xffffffff
      });

      avatar.resize({
        w: 105,
        h: 105
      });

      background.composite(avatar, 249, 24);
      background.composite(avatar.clone(), 249, 223);

      background.composite(base, 0, 0);

      const buffer = await background.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'magnifique.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};