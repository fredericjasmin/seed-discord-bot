const discordTranscripts = require("discord-html-transcripts");

async function closeTicket(interaction, channel, reason = "No reason specified") {
    try {
        const attachment = await discordTranscripts.createTranscript(channel, {
            filename: `transcript-${channel.name}.html`,
            saveImages: true,
            poweredBy: false,
        });

        // TODO: Send transcript to log channel and user DM

        await channel.send({ content: `Ticket transcript for <@${channel.topic}>:` });
        await channel.send({ files: [attachment] });

        await interaction.followUp({ content: "The ticket will be deleted in 10 seconds." });

        setTimeout(() => {
            channel.delete().catch(err => console.error("Error deleting ticket channel:", err));
        }, 10000);

    } catch (error) {
        console.error("Error closing ticket:", error);
        await interaction.followUp({ content: "There was an error closing the ticket." });
    }
}

module.exports = { closeTicket };