const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "withdraw",
  description: "[💸 ECONOMY] Withdraw money from the bank.",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      required: true,
      description: "Amount of money to withdraw.",
      name: "amount",
    },
  ],
  run: async (client, interaction) => {
    const amountToWithdraw = interaction.options.getInteger("amount");

    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      return interaction.reply({
        content: "Please enter a valid amount to withdraw.",
        ephemeral: true,
      });
    }

    const userData = await User.findById(interaction.user.id);

    if (userData.bank < amountToWithdraw) {
      return interaction.reply({
        content: "You don't have enough money in the bank.",
        ephemeral: true,
      });
    }

    userData.bank -= amountToWithdraw;
    userData.coins += amountToWithdraw;

    await userData.save();

    const embed = new EmbedBuilder()
      .setColor("#2ecc71")
      .setTitle("Withdraw Money")
      .setDescription(`You have successfully withdrawn **${amountToWithdraw.toLocaleString("en-US")}** coins from the bank.`);

    interaction.reply({
      embeds: [embed],
    });
  },
};
