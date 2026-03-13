const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "slot",
  description: "[🎰 GAMBLING] Play the slot machine",
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      required: true,
      description: "Enter the amount of coins you want to bet",
      name: "bet",
    },
  ],
  run: async (client, interaction) => {
    const user = interaction.user;
    const betAmount = interaction.options.getInteger("bet");

    const userData = await User.findById(user.id);

    if (userData.coins < betAmount || betAmount <= 0) {
      const insufficientCoinsEmbed = new EmbedBuilder()
        .setColor("#FF5733")
        .setTitle("Invalid Bet")
        .setDescription("You don't have enough coins or the bet amount is invalid.");

      return interaction.reply({
        embeds: [insufficientCoinsEmbed],
      });
    }

    const symbols = ["🍇", "🍉", "🍊", "🍋", "🍎", "🍒", "🍓", "🍏"];

    const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

    const isWin = slot1 === slot2 && slot2 === slot3;

    userData.coins += isWin ? betAmount : -betAmount;
    await userData.save();

    const slotEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("Slot Machine")
      .setDescription(`[${slot1}] [${slot2}] [${slot3}]\n\n${isWin ? "Congratulations! You won!" : "Sorry, you lost."}\n\n${user.tag}, your new balance: ${userData.coins} coins.`);

    await interaction.reply({
      embeds: [slotEmbed],
    });
  },
};
