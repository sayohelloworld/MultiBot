const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'ps4',

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
        path.join(__dirname, '../../assets/images/ps4.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 410,
        h: 449
      });

      base.composite(avatar, 0, 75);

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("Image trop lourde.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'ps4.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur génération PS4.");
    }
  }
};