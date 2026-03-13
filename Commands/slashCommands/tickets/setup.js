const { PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Guild = require("../../../models/Guild"); // Use the new Guild model

module.exports = {
    name: "ticket-setup",
    description: "Configura el sistema de tickets para el servidor.",
    // Define permissions required for the command
    userPerms: [PermissionFlagsBits.Administrator],
    // Define options using the raw format
    options: [
        {
            name: "support-role",
            description: "El rol que podrá ver y gestionar los tickets.",
            type: 8, // 8 = ROLE
            required: true,
        },
        {
            name: "category",
            description: "La categoría donde se crearán los canales de los tickets.",
            type: 7, // 7 = CHANNEL
            channel_types: [ChannelType.GuildCategory],
            required: true,
        },
        {
            name: "panel-channel",
            description: "El canal donde se enviará el panel para crear tickets.",
            type: 7, // 7 = CHANNEL
            channel_types: [ChannelType.GuildText],
            required: true,
        },
    ],

    async execute(interaction) {
        const { guild, options } = interaction;

        // Use getRole and getChannel for this structure
        const supportRole = options.getRole("support-role");
        const category = options.getChannel("category");
        const panelChannel = options.getChannel("panel-channel");

        await interaction.deferReply({ ephemeral: true });

        try {
            let guildData = await Guild.findOne({ guildId: guild.id });
            if (!guildData) {
                guildData = new Guild({ guildId: guild.id });
            }

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("Panel de Tickets")
                .setDescription("Haz clic en el botón de abajo para crear un ticket y recibir soporte.");

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("create-ticket")
                    .setLabel("Crear Ticket")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("📩")
            );

            const panelMessage = await panelChannel.send({
                embeds: [embed],
                components: [button],
            });

            // Set ticket config as subdocument
            guildData.config = guildData.config || {};
            guildData.config.tickets = {
                supportRoleId: supportRole.id,
                categoryId: category.id,
                panelChannelId: panelChannel.id,
                ticketMessageId: panelMessage.id,
            };
            await guildData.save();

            await interaction.editReply({
                content: `El sistema de tickets ha sido configurado correctamente. El panel fue enviado a ${panelChannel}.`,
                ephemeral: true,
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: "Hubo un error al configurar el sistema de tickets. Por favor, inténtalo de nuevo.",
                ephemeral: true,
            });
        }
    },
};
