const { EmbedBuilder } = require("discord.js");
const User = require("../../../models/Economy");
const ms = require("ms");

module.exports = {
  name: "daily",
  description: "[💸 ECONOMY] Collect your daily coins!",
  cooldown: "24h",
  run: async (client, interaction) => {
    const userId = interaction.user.id;

    let userData = await User.findById(userId);
    if (!userData) {
      userData = new User({ _id: userId });
    }

    const lastDaily = userData.cooldowns.daily;
    const cooldownTime = ms(module.exports.cooldown);

    if (lastDaily && cooldownTime - (Date.now() - lastDaily) > 0) {
      const timeLeft = ms(cooldownTime - (Date.now() - lastDaily), { long: true });
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`You have already collected your daily coins. Come back in **${timeLeft}**.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const collectedCoins = Math.floor(Math.random() * 500) + 100; // Example: 100-599 coins
    userData.coins += collectedCoins;
    userData.cooldowns.daily = Date.now();
    await userData.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`${interaction.user}, congratulations! You have collected **${collectedCoins.toLocaleString("en-US")}** coins today.\nCome back in **${ms(cooldownTime, { long: true })}** to collect again.`);
    
    return interaction.reply({ embeds: [embed] });
  },
};