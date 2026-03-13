const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "clear",
    description: "[🗑️ MODERATION] Clear a number of messages from the channel.",
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            required: true,
            description: "Number of messages to delete.",
            name: "amount"
        }
    ],
    run: async (client, interaction) => {
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0 || amount > 100) {
            return interaction.reply({
                content: "You need to specify a number between 1 and 100.",
                ephemeral: true
            });
        }

        try {
            // Delete the messages
            await interaction.channel.bulkDelete(amount, true);

            // Send confirmation message
            const successEmbed = new EmbedBuilder()
                .setColor("#4caf50")
                .setTitle("Messages Cleared")
                .setDescription(`Successfully deleted ${amount} message(s).`);

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: true
            });

        } catch (error) {
            console.error("Error clearing messages:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("Error")
                .setDescription("An error occurred while clearing messages. Please try again later.")
                .setFooter({ text: "This message is ephemeral." });

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
};
