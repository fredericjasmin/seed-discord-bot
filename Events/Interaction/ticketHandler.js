const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Guild = require("../../models/Guild"); // Use the new Guild model
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        

        // We only want to handle button interactions with this handler
        if (!interaction.isButton()) {
            
            return;
        }

        // Ensure the interaction is in a guild
        if (!interaction.guild || !interaction.member) {
            
            return;
        }

        const { guild, member, customId, channel } = interaction;

        // If the button is not a ticket button, ignore it.
        if (!["create-ticket", "close-ticket"].includes(customId)) {
            
            return;
        }

        

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.tickets) {
            
            return interaction.reply({ content: "Ticket configuration was not found for this server.", ephemeral: true });
        }
        const ticketConfig = guildData.config.tickets;

        switch (customId) {
            case "create-ticket":
                {
                    
                    const { supportRoleId, categoryId, sendTicketCreationMessage } = ticketConfig;

                    if (!supportRoleId || !categoryId) {
                        
                        return interaction.reply({ content: "Ticket configuration is incomplete. Please set up the support role and ticket category in the dashboard.", ephemeral: true });
                    }

                    // Check if user already has a ticket by channel name

                    // Contar cuántos tickets abiertos tiene el usuario en la categoría
                    const userTickets = guild.channels.cache.filter(c => c.topic === member.id && c.parentId === categoryId);
                    const maxTickets = ticketConfig.maxTicketsPerUser || 1;
                    if (userTickets.size >= maxTickets) {
                        return interaction.reply({ content: `Ya tienes el máximo permitido de tickets abiertos (${maxTickets}).`, ephemeral: true });
                    }

                    
                    await interaction.deferReply({ ephemeral: true });

                    try {
                        const ticketChannel = await guild.channels.create({
                            name: `ticket-${interaction.user.username}`,
                            topic: member.id, // Store user ID in channel topic for easy lookup
                            type: ChannelType.GuildText,
                            parent: categoryId,
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                },
                                {
                                    id: member.id,
                                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles],
                                },
                                {
                                    id: supportRoleId,
                                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages],
                                },
                            ],
                        });


                        if (sendTicketCreationMessage) {
                            // Construir mención de roles
                            let mentionRoles = '';
                            if (Array.isArray(ticketConfig.mentionRoleIds) && ticketConfig.mentionRoleIds.length > 0) {
                                mentionRoles = ticketConfig.mentionRoleIds.map(id => `<@&${id}>`).join(' ');
                            }


                            const embed = new EmbedBuilder()
                                .setTitle(ticketConfig.welcomeTitle || 'Ticket Creado')
                                .setColor(ticketConfig.welcomeEmbedColor || '#00ff00')
                                .setDescription(ticketConfig.ticketWelcomeMessage.replace("{user.mention}", `${member}`));


                            const closeButton = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                .setCustomId("close-ticket")
                                .setLabel(ticketConfig.closeButtonLabel || "Cerrar Ticket")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji(ticketConfig.closeButtonEmoji || "🔒")
                            );

                            await ticketChannel.send({ content: mentionRoles.length > 0 ? mentionRoles : undefined, embeds: [embed], components: [closeButton] });
                        }
                        
                        await interaction.editReply({ content: `Tu ticket ha sido creado en ${ticketChannel}.`, ephemeral: true });

                    } catch (error) {
                        console.error("Error creating ticket:", error);
                        
                        await interaction.editReply({ content: "Hubo un error al crear tu ticket.", ephemeral: true });
                    }
                }
                break;

            case "close-ticket":
                {
                    const supportRole = guild.roles.cache.get(ticketConfig.supportRoleId);
                    const hasPermission = member.roles.cache.has(supportRole.id) || member.permissions.has(PermissionsBitField.Flags.Administrator);
                    if (!hasPermission) {
                        return interaction.reply({ content: "No tienes permisos para cerrar este ticket.", ephemeral: true });
                    }
                    await interaction.reply({ content: "Closing the ticket and generating the transcript..." });
                    try {
                        const attachment = await discordTranscripts.createTranscript(channel, {
                            filename: `transcript-${channel.name}.html`,
                            saveImages: true,
                            poweredBy: false,
                        });
                        await channel.send({ content: `Ticket transcript for ${member.user.tag}:` });
                        await channel.send({ files: [attachment] });
                        // Enviar botón personalizado de cerrar ticket si se desea mostrar de nuevo
                        const closeButton = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId("close-ticket")
                                .setLabel(ticketConfig.closeButtonLabel || "Cerrar Ticket")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji(ticketConfig.closeButtonEmoji || "🔒")
                        );
                        // await channel.send({ components: [closeButton] }); // Descomenta si quieres mostrar el botón de nuevo tras cerrar
                        await channel.send({ content: "The ticket will be deleted in 10 seconds." });
                        setTimeout(() => {
                            channel.delete().catch(err => console.error("Error deleting ticket channel:", err));
                        }, 10000);
                    } catch (error) {
                        console.error("Error closing ticket:", error);
                        await interaction.followUp({ content: "Hubo un error al cerrar el ticket." });
                    }
                }
                break;
        }
    },
};
