const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Banea a un usuario del servidor.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a banear.',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón del baneo.',
            required: false,
        },
    ],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        // Check if the user has permission to ban
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'No tienes permiso para banear usuarios.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        // Check if the bot can ban the user
        if (!targetMember.bannable) {
            return interaction.reply({ content: 'No puedo banear a este usuario. Puede que tenga un rol más alto que el mío.', ephemeral: true });
        }

        try {
            await targetMember.ban({ reason: reason });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Usuario Baneado')
                .setDescription(`**${targetUser.tag}** ha sido baneado del servidor.`)
                .addFields({ name: 'Razón', value: reason })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // LOG BAN EVENT
            const Guild = require('../../../models/Guild');
            let guildData = await Guild.findOne({ guildId: interaction.guild.id });
            if (guildData && guildData.config && guildData.config.logging && guildData.config.logging.enabled && guildData.config.logging.logBanEvents && guildData.config.logging.channelId) {
                const logChannel = interaction.guild.channels.cache.get(guildData.config.logging.channelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Ban Log')
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
            console.error('Error al banear al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar banear al usuario.', ephemeral: true });
        }
    }
};