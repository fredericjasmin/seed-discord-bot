const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild'); // Adjust path as needed

module.exports = {
    name: 'warn',
    description: 'Advierte a un usuario del servidor.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a advertir.',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón de la advertencia.',
            required: false,
        },
    ],
    userPerms: ['KickMembers'], // Requires KickMembers permission to warn

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        // Ensure the command executor has permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'No tienes permiso para advertir usuarios.', ephemeral: true });
        }

        // Prevent warning oneself
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'No puedes advertirte a ti mismo.', ephemeral: true });
        }

        // Prevent warning bots
        if (targetUser.bot) {
            return interaction.reply({ content: 'No puedes advertir a un bot.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        // Prevent warning higher roles or bot itself
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes advertir a un usuario con un rol igual o superior al tuyo.', ephemeral: true });
        }
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedes advertir al bot.', ephemeral: true });
        }

        try {
            let guildData = await Guild.findOne({ guildId: interaction.guild.id });
            if (!guildData) {
                guildData = new Guild({ guildId: interaction.guild.id });
            }

            guildData.warnings.push({
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason,
                timestamp: new Date(),
            });
            await guildData.save();

            // Send a DM to the warned user
            await targetUser.send(`Has sido advertido en **${interaction.guild.name}** por la razón: 

**${reason}**.`);

            const embed = new EmbedBuilder()
                .setColor('#FFA500') // Orange color for warning
                .setTitle('Usuario Advertido')
                .setDescription(`**${targetUser.tag}** ha sido advertido.`)
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Check warn limit
            const userWarnings = guildData.warnings.filter(w => w.userId === targetUser.id);
            if (userWarnings.length >= guildData.config.moderation.warnLimit) {
                // Implement automatic action here, e.g., kick or ban
                // For now, just send a message to the log channel if configured
                const logChannelId = guildData.config.moderation.logChannelId;
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const limitEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Límite de Advertencias Alcanzado')
                            .setDescription(`**${targetUser.tag}** ha alcanzado el límite de advertencias (${guildData.config.moderation.warnLimit}).`)
                            .addFields(
                                { name: 'Usuario', value: targetUser.tag },
                                { name: 'Advertencias', value: userWarnings.length.toString() }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [limitEmbed] });
                    }
                }
            }

            // Send to log channel if configured (MODERATION LOG)
            const logChannelId = guildData.config.moderation.logChannelId;
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('Advertencia Registrada')
                        .setDescription(`**${targetUser.tag}** ha sido advertido por **${interaction.user.tag}**.`)
                        .addFields(
                            { name: 'Usuario', value: targetUser.tag },
                            { name: 'Moderador', value: interaction.user.tag },
                            { name: 'Razón', value: reason }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            // LOG WARN EVENT (SERVER LOGS)
            if (guildData.config && guildData.config.logging && guildData.config.logging.enabled && guildData.config.logging.logWarnEvents && guildData.config.logging.channelId) {
                const logChannel = interaction.guild.channels.cache.get(guildData.config.logging.channelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('Warn Log')
                        .addFields(
                            { name: 'Usuario', value: `${targetUser.tag} (${targetUser.id})` },
                            { name: 'Moderador', value: `${interaction.user.tag} (${interaction.user.id})` },
                            { name: 'Razón', value: reason },
                            { name: 'Fecha', value: `<t:${Math.floor(Date.now()/1000)}:F>` }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Error al advertir al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar advertir al usuario.', ephemeral: true });
        }
    }
};