const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'ping',
	description: "Check bot's ping.",
	type: ApplicationCommandType.ChatInput,
	cooldown: 3000,
	run: async (client, interaction) => {
		await interaction.reply(':ping_pong: Pong!')
        const msg = await interaction.fetchReply()

        // Introduce a small delay to allow client.ws.ping to stabilize
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms

        let apiPing = client.ws.ping;
        if (apiPing === -1 || apiPing === null) {
            apiPing = 'N/A (could not retrieve)'; // Fallback message
        }

        const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setColor('#0000FF')
        .setTimestamp()
        .setDescription(`**Time:** ${Math.floor(msg.createdTimestamp - interaction.createdTimestamp)} ms\n**API Ping:** ${client.ws.ping} ms`)
        interaction.editReply({ embeds: [embed], content: `<@${interaction.user.id}>` })
	}
};