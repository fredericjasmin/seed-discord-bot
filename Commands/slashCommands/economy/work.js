const { EmbedBuilder } = require("discord.js");
const ms = require("ms");
const User = require('../../../models/Economy');

module.exports = {
  name: "work",
  description: "[💼 ECONOMY] Work to earn some coins!",
  cooldown: "5h", // 5-hour cooldown for working
  run: async (client, interaction) => {
    const userId = interaction.user.id;

    let userData = await User.findById(userId);
    if (!userData) {
      userData = new User({ _id: userId });
    }

    const lastWork = userData.cooldowns.work;
    const cooldownTime = ms(module.exports.cooldown);

    if (lastWork && cooldownTime - (Date.now() - lastWork) > 0) {
      const timeLeft = ms(cooldownTime - (Date.now() - lastWork), { long: true });
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`You have already worked. Come back in **${timeLeft}**.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const earnedCoins = Math.floor(Math.random() * 200) + 50; // Example: 50-249 coins
    userData.coins += earnedCoins;
    userData.cooldowns.work = Date.now();
    await userData.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`${interaction.user}, you worked hard and earned **${earnedCoins.toLocaleString("en-US")}** coins!`);
    
    return interaction.reply({ embeds: [embed] });
  },
};