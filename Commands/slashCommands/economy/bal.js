const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy'); // Adjust the path according to your file structure

module.exports = {
  name: "bal",
  description: "[💸 ECONOMY] Check how many coins you have!",
  options: [
    {
      type: ApplicationCommandOptionType.User,
      required: false,
      description: "Want to see the coins of another user?",
      name: "user",
    },
  ],
  run: async (client, interaction) => {
    let targetUser = interaction.options.getUser("user") || interaction.user;

    let targetUserData = await User.findById(targetUser.id).exec();
    if (!targetUserData) {
      targetUserData = new User({ _id: targetUser.id });
      await targetUserData.save();
    }

    const walletCoins = targetUserData.coins;
    const bankCoins = targetUserData.bank;
    const totalCoins = walletCoins + bankCoins;

    const allUserData = await User.find().exec();
    const sortedUsers = allUserData.sort((a, b) => (b.coins + b.bank) - (a.coins + a.bank));
    const position = sortedUsers.findIndex(x => x._id === targetUser.id) + 1;

    const rankMessage = `#${position} in the rank!`;

    const embed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle(`${targetUser.tag}'s Wealth`)
      .setDescription(
        `${targetUser} has:\n- **${walletCoins.toLocaleString("en-US")}** Coins in the Wallet\n- **${bankCoins.toLocaleString("en-US")}** Coins in the Bank\n- **${totalCoins.toLocaleString("en-US")}** Total Coins${
          position >= 1 ? `\n${targetUser} is in ${rankMessage}` : ""
        }`
      );

    await interaction.reply({
      embeds: [embed],
    });
  },
};
