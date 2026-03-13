const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType } = require("discord.js");
const { unabbreviate } = require("util-stunks"); // Used to transform "20k" into 20000, for example.
const User = require('../../../models/Economy');

module.exports = {
  name: "pay",
  description: "[💸 ECONOMY] Send Coins to your friend!",
  options: [
    {
      name: "user",
      description: "Who is the payment for?",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "quantity",
      description: "How many coins do you want to send? (you can use 10k, 1m, etc!)",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const userToPay = interaction.options.getUser("user");
    const quantity = unabbreviate(interaction.options.getString("quantity"));
    const userData = await User.findById(interaction.user.id); // Obtén los datos del usuario desde la base de datos
    const coins = userData?.coins ?? 0; // Monedas del autor del comando

    if (userToPay.id === interaction.user.id) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription(`${interaction.user}, you cannot send coins to yourself! Silly.`);

      return interaction.reply({ embeds: [errorEmbed] });
    }

    if (isNaN(quantity) || quantity < 10 || !quantity) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription(`${interaction.user}, please specify how many coins you want to send, and it should be more than **10**.`);

      return interaction.reply({ embeds: [errorEmbed] });
    }

    if (coins < quantity) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription(`${interaction.user}, unfortunately, you don't have **${quantity.toLocaleString()}** coins.`);

      return interaction.reply({ embeds: [errorEmbed] });
    }

    const confirmButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId("confirm")
        .setLabel("Confirm")
    );

    const paymentEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Payment Confirmation")
      .setDescription(`💸 ${interaction.user} wants to send **${quantity.toLocaleString()}** coins to **${userToPay.tag}**. Do you confirm?`);

    let msg = await interaction.reply({
      content: interaction.user.toString(),
      components: [confirmButton],
      embeds: [paymentEmbed],
      fetchReply: true,
    });

    let collector = msg?.createMessageComponentCollector({
      filter: (int) => int.user.id === interaction.user.id,
      time: 60000,
      max: 1,
    });

    collector.on("collect", async (int) => {
      await int.deferUpdate().catch(() => {});
      if (int.user.id !== interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Error")
          .setDescription("You cannot click here.")
          .setFooter("This message is ephemeral.");

        return int.followUp({ embeds: [errorEmbed], ephemeral: true });
      }

      const userCheck = await User.findById(interaction.user.id);
      const coinsCheck = userCheck?.coins ?? 0;

      if (coinsCheck < quantity) {
        const errorEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Error")
          .setDescription(`Oops ${interaction.user}, you no longer have **${quantity.toLocaleString()}** coins!\nCommand canceled.`);

        return msg.edit({ embeds: [errorEmbed], components: [] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Payment Successful")
        .setDescription(`${interaction.user} payment of **${quantity.toLocaleString()}** coins to **${userToPay.tag}** confirmed.`);

      msg.edit({ embeds: [successEmbed], components: [] });

      int.followUp({
        content: `${userToPay}, ${interaction.user} has just sent you **${quantity.toLocaleString()}** coins!`,
      });

      // Actualiza las monedas de ambos usuarios en la base de datos
      await User.findByIdAndUpdate(interaction.user.id, { $inc: { coins: -quantity } });
      await User.findByIdAndUpdate(userToPay.id, { $inc: { coins: quantity } });
    });

    collector.on("end", async () => {
      if (msg?.components) return msg?.edit({ components: [] });
    });
  },
};
