const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const User = require('../../../models/Economy');
const ShopItem = require('../../../models/ShopItem'); // Import the ShopItem model

module.exports = {
  name: "shop",
  description: "[💸 ECONOMY] Browse and buy products from the shop",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      required: false,
      description: "Enter the ID of the product you want to buy",
      name: "product_id",
    },
  ],
  run: async (client, interaction) => {
    const products = await ShopItem.find(); // Fetch products from the database

    const user = interaction.user;
    const selectedProductId = interaction.options.getString("product_id");
    const selectedProduct = products.find(p => p.id === selectedProductId);

    if (!selectedProduct && selectedProductId) {
        return interaction.reply({ content: "Invalid product ID.", ephemeral: true });
    }

    if (!selectedProductId) {
      const shopEmbed = new EmbedBuilder()
        .setColor("#4caf50")
        .setTitle("Welcome to the Shop")
        .setDescription("Browse and buy products! Use `/shop <product_id>` to purchase.")
        .addFields(
          products.map((product, index) => ({
            name: `${product.name} (ID: ${product.id})`,
            value: `**Price:** ${product.price} Coins\n**Description:** ${product.description}`,
            inline: false,
          }))
        );

      return interaction.reply({ embeds: [shopEmbed] });
    }

    const userData = await User.findById(user.id);

    if (!userData) {
        return interaction.reply({ content: "You don't have an economy profile yet. Use an economy command first!", ephemeral: true });
    }

    if (userData.coins < selectedProduct.price) {
      const insufficientCoins = new EmbedBuilder()
        .setColor("#FF5733")
        .setTitle("Insufficient Coins")
        .setDescription("You do not have enough coins in your wallet to purchase this product.");
      return interaction.reply({ embeds: [insufficientCoins], ephemeral: true });
    }

    userData.coins -= selectedProduct.price;
    userData.inventory.push(selectedProduct.name);

    await userData.save();

    const purchaseEmbed = new EmbedBuilder()
      .setColor("#4caf50")
      .setTitle("Purchase Successful")
      .setDescription(`You have successfully purchased **${selectedProduct.name}** for **${selectedProduct.price}** coins.`);

    await interaction.reply({ embeds: [purchaseEmbed] });
  },
};