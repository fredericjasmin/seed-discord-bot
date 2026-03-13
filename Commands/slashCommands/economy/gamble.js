const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "gamble",
  description: "[🎲 GAMBLING] Gamble and test your luck",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      required: true,
      description: "Enter the amount of coins you want to gamble",
      name: "bet",
    },
  ],
  run: async (client, interaction) => {
    const user = interaction.user;
    const betAmount = interaction.options.getInteger("bet");

    // Fetch user data from the database using Mongoose
    const userData = await User.findById(user.id);

    // Check if the user has enough coins for the bet
    if (userData.coins < betAmount || betAmount <= 0) {
      const insufficientCoinsEmbed = new EmbedBuilder()
        .setColor("#FF5733")
        .setTitle("Invalid Bet")
        .setDescription("You don't have enough coins or the bet amount is invalid.");

      return interaction.reply({
        embeds: [insufficientCoinsEmbed],
      });
    }

    // Define the win probability (e.g., 50% chance to win)
    const winProbability = 0.5;

    // Determine if the user wins based on the probability
    const isWin = Math.random() < winProbability;

    // Calculate the outcome based on the win or loss
    const outcome = isWin ? "Congratulations! You won!" : "Sorry, you lost.";

    // Calculate the new coin balance
    const newCoins = isWin ? userData.coins + betAmount : userData.coins - betAmount;

    // Update the user data in the database
    await User.findByIdAndUpdate(user.id, { coins: newCoins });

    // Create and send the result message
    const gambleEmbed = new EmbedBuilder()
      .setColor(isWin ? "#4caf50" : "#FF5733")
      .setTitle("Gamble")
      .setDescription(`${outcome}\n\n${user.tag}, your new balance: ${newCoins} coins.`);

    await interaction.reply({
      embeds: [gambleEmbed],
    });
  },
};
