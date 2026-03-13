const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")

module.exports = {
  name: "eval",
  description: "[🔐 DEVELOPER] Execute um código JavaScript",
  ownerOnly: true,
  run: async(client, interaction) => {
    
    if(interaction.user.id !== "659600287929073675") return interaction.reply({
      content: "somente meu dono pode usar esse comando.",
      ephemeral: true
    })

    const modal = new ModalBuilder()
    .setCustomId(`eval_${interaction.user.id}`)
    .setTitle('Executar código JS')

    const code = new TextInputBuilder()
    .setCustomId('evalCode')
    .setLabel("Qual código será executado?")
    .setPlaceholder("console.log('Hello Word!')")
    .setStyle(TextInputStyle.Paragraph)

    const rowModal = new ActionRowBuilder().addComponents(code)
    modal.addComponents(rowModal)

    interaction.showModal(modal)

  }
}