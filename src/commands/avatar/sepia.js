const { Jimp } = require('jimp');

module.exports = {
  name: 'sepia',

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

      const image = await Jimp.read(avatarURL);

      image.scan((x, y, idx) => {
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];

        image.bitmap.data[idx] = Math.min(
          255,
          (r * 0.393) + (g * 0.769) + (b * 0.189)
        );

        image.bitmap.data[idx + 1] = Math.min(
          255,
          (r * 0.349) + (g * 0.686) + (b * 0.168)
        );

        image.bitmap.data[idx + 2] = Math.min(
          255,
          (r * 0.272) + (g * 0.534) + (b * 0.131)
        );
      });

      const buffer = await image.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'sepia.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};