const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const User = require('../../../models/Economy');

module.exports = {
    name: "sell",
    description: "[💸 ECONOMY] Sell an item from your inventory.",
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            required: false,
            description: "Enter the number of the item you want to sell (leave empty to specify by name).",
            name: "item_number"
        },
        {
            type: ApplicationCommandOptionType.String,
            required: false,
            description: "Enter the name of the item you want to sell (leave empty to specify by number).",
            name: "item_name"
        }
    ],
    run: async (client, interaction) => {
        const itemNumber = interaction.options.getInteger("item_number");
        const itemName = interaction.options.getString("item_name");
        const userId = interaction.user.id;

        try {
            // Fetch user data from the database
            const user = await User.findById(userId);

            if (!user) {
                return interaction.reply({
                    content: "User not found in the database.",
                    ephemeral: true
                });
            }

            // Determine which item to sell
            let itemToSell;
            if (itemNumber !== null) {
                // Sell by number
                if (itemNumber < 1 || itemNumber > user.inventory.length) {
                    return interaction.reply({
                        content: "Invalid item number.",
                        ephemeral: true
                    });
                }
                itemToSell = user.inventory[itemNumber - 1];
            } else if (itemName) {
                // Sell by name
                if (!user.inventory.includes(itemName)) {
                    return interaction.reply({
                        content: `You do not have ${itemName} in your inventory.`,
                        ephemeral: true
                    });
                }
                itemToSell = itemName;
            } else {
                return interaction.reply({
                    content: "Please specify an item to sell either by number or by name.",
                    ephemeral: true
                });
            }

            // Remove the item from the inventory
            const itemIndex = user.inventory.indexOf(itemToSell);
            if (itemIndex !== -1) {
                user.inventory.splice(itemIndex, 1);
            }

            // Determine the sale amount (random between 100 and 1000)
            const saleAmount = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;

            // Add the sale amount to the user's coins
            user.coins += saleAmount;

            // Save the updated user data
            await user.save();

            // Create and send the response embed
            const successEmbed = new EmbedBuilder()
                .setColor("#33FF66")
                .setTitle("Item Sold")
                .setDescription(`You sold **${itemToSell}** for **${saleAmount.toLocaleString("en-US")}** coins!\nYour new balance: **${user.coins.toLocaleString("en-US")}** coins.`);

            interaction.reply({
                embeds: [successEmbed]
            });
        } catch (error) {
            console.error("Error processing sell command:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("Error")
                .setDescription("An error occurred while processing the sell command. Please try again later.")
                .setFooter({ text: "This message is ephemeral." });

            interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
};
