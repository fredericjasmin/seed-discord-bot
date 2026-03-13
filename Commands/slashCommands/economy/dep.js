const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "dep",
  description: "[💸 ECONOMY] Deposit coins into your bank.",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      required: true,
      description: "Amount of coins to deposit.",
      name: "amount"
    }
  ],
  run: async (client, interaction) => {
    const depositAmount = interaction.options.getInteger("amount");

    if (isNaN(depositAmount) || depositAmount <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Invalid Amount")
        .setDescription("Please provide a valid positive number of coins to deposit.");
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Fetch user data from the database
    const userData = await User.findById(interaction.user.id);
    const userCoins = userData?.coins ?? 0;

    if (userCoins < depositAmount) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Insufficient Funds")
        .setDescription("You don't have enough coins in your wallet to deposit that amount.");
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Perform the deposit
    await User.findByIdAndUpdate(interaction.user.id, {
      $inc: { coins: -depositAmount, bank: depositAmount }
    });

    const successEmbed = new EmbedBuilder()
      .setColor("#33FF66")
      .setTitle("Deposit Successful")
      .setDescription(`You have successfully deposited **${depositAmount.toLocaleString("en-US")}** coins into your bank.`);
    
    interaction.reply({ embeds: [successEmbed] });
  }
};
