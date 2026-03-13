const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "rob",
  description: "[🚨 CRIME] Attempt to rob another user",
  options: [
    {
      type: ApplicationCommandOptionType.User,
      required: true,
      description: "Select the user you want to rob",
      name: "target",
    },
  ],
  run: async (client, interaction) => {
    const user = interaction.user;
    const targetUser = interaction.options.getUser("target");

    // Fetch user data from the database
    const userData = await User.findById(user.id);
    const targetUserData = await User.findById(targetUser.id);

    // Check if the target user exists
    if (!targetUserData) {
      const targetNotFoundEmbed = new EmbedBuilder()
        .setColor("#FF5733")
        .setTitle("Target Not Found")
        .setDescription("The specified target user does not exist.");

      return interaction.reply({
        embeds: [targetNotFoundEmbed],
      });
    }

    // Define the success rate for the robbery (e.g., 30% chance to succeed)
    const successRate = 0.3;

    // Determine if the robbery is successful based on the rate
    const isSuccessful = Math.random() < successRate;

    // Calculate the amount to steal (percentage of the target's coins)
    const stolenAmount = isSuccessful ? Math.floor(targetUserData.coins * 0.2) : 0;

    // Update user data in the database
    userData.coins += stolenAmount;
    targetUserData.coins -= stolenAmount;

    await userData.save();
    await targetUserData.save();

    // Create and send the result message
    const robEmbed = new EmbedBuilder()
      .setColor(isSuccessful ? "#4caf50" : "#FF5733")
      .setTitle("Robbery Attempt")
      .setDescription(`${isSuccessful ? "You successfully robbed the user!" : "Your attempt to rob failed."}\n\n${user.tag} stole ${stolenAmount} coins from ${targetUser.tag}.`);

    await interaction.reply({
      embeds: [robEmbed],
    });
  },
};
