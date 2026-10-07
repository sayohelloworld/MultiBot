const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'challenger',
  aliases: ['challenge'],

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const silhouetted = args.includes('true');

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/challenger.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 256,
        h: 256
      });

      if (silhouetted) {
        avatar.scan((x, y, idx) => {
          avatar.bitmap.data[idx] = 0;
          avatar.bitmap.data[idx + 1] = 0;
          avatar.bitmap.data[idx + 2] = 0;
        });
      }

      base.composite(avatar, 484, 98);

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'challenger.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};