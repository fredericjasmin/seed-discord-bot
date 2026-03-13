const { EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "rank",
  description: "[💸 ECONOMY] View the richest users by total coins!",
  run: async (client, interaction) => {
    try {
      // Fetch all user data from the database and sort by total coins in descending order
      const allUserData = await User.find().sort({ coins: -1, bank: -1 }).limit(10);

      // Map and format the data for the embed
      const rankedUsersInfo = await Promise.all(allUserData.map(async (userData, index) => {
        const user = await client.users.fetch(userData._id);
        const totalCoins = (userData.coins || 0) + (userData.bank || 0);

        return `\`${index + 1}\` - **${user?.tag}** has **${totalCoins.toLocaleString("en-US")}** total Coins`;
      }));

      // Create and send the embed
      const embed = new EmbedBuilder()
        .setTitle("Top Coin Holders (Total Coins)")
        .setColor("#3498db")
        .setThumbnail("https://i.imgur.com/2M0MmZI.png") // Replace with your own image URL
        .setFooter({ text: "Economy System", iconURL: "https://i.imgur.com/2M0MmZI.png" }); // Replace with your own image URL

      if (rankedUsersInfo.length > 0) {
        embed.setDescription(rankedUsersInfo.join("\n\n"));
      } else {
        embed.setDescription("No users found with valid economy data.");
      }

      interaction.reply({
        content: interaction.user.toString(),
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error fetching and processing rank data:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("Error")
        .setDescription("An error occurred while fetching rank data. Please try again later.")
        .setFooter({ text: "Economy System", iconURL: "https://i.imgur.com/2M0MmZI.png" }); // Replace with your own image URL

      interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
};
