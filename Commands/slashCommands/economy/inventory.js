const { EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
  name: "inventory",
  description: "[💸 ECONOMY] View your purchased products",
  run: async (client, interaction) => {
    const user = interaction.user;

    // Fetch user data from the database using Mongoose
    const userData = await User.findById(user.id);

    // Check if the user has an inventory
    const userInventory = userData?.inventory || [];

    // If the inventory is empty
    if (userInventory.length === 0) {
      const emptyInventoryEmbed = new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("Your Inventory is Empty")
        .setDescription("You haven't purchased any products yet.");

      return interaction.reply({
        embeds: [emptyInventoryEmbed],
      });
    }

    // Create a formatted list of purchased products
    const inventoryList = userInventory.map((product, index) => `**${index + 1}.** ${product}`).join("\n");

    const inventoryEmbed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle(`${user.tag}'s Inventory`)
      .setDescription(`Here are the products you've purchased:\n${inventoryList}`);

    await interaction.reply({
      embeds: [inventoryEmbed],
    });
  },
};
