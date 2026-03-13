const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulsa a un usuario del servidor.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a expulsar.',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón de la expulsión.',
            required: false,
        },
    ],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        // Check if the user has permission to kick
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'No tienes permiso para expulsar usuarios.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        // Check if the bot can kick the user
        if (!targetMember.kickable) {
            return interaction.reply({ content: 'No puedo expulsar a este usuario. Puede que tenga un rol más alto que el mío.', ephemeral: true });
        }

        try {
            await targetMember.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Usuario Expulsado')
                .setDescription(`**${targetUser.tag}** ha sido expulsado del servidor.`)
                .addFields({ name: 'Razón', value: reason })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // LOG KICK EVENT
            const Guild = require('../../../models/Guild');
            let guildData = await Guild.findOne({ guildId: interaction.guild.id });
            if (guildData && guildData.config && guildData.config.logging && guildData.config.logging.enabled && guildData.config.logging.logKickEvents && guildData.config.logging.channelId) {
                const logChannel = interaction.guild.channels.cache.get(guildData.config.logging.channelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Kick Log')
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
            console.error('Error al expulsar al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar expulsar al usuario.', ephemeral: true });
        }
    }
};