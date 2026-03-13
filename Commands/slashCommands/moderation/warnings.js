const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild'); // Adjust path as needed

module.exports = {
    name: 'warnings',
    description: 'Muestra las advertencias de un usuario.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario del que quieres ver las advertencias.',
            required: true,
        },
    ],
    userPerms: ['KickMembers'], // Requires KickMembers permission to view warnings

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'No tienes permiso para ver las advertencias de usuarios.', ephemeral: true });
        }

        try {
            const guildData = await Guild.findOne({ guildId: interaction.guild.id });

            if (!guildData || !guildData.warnings || guildData.warnings.length === 0) {
                return interaction.reply({ content: 'No hay advertencias registradas en este servidor.', ephemeral: true });
            }

            const userWarnings = guildData.warnings.filter(w => w.userId === targetUser.id);

            if (userWarnings.length === 0) {
                return interaction.reply({ content: `**${targetUser.tag}** no tiene advertencias en este servidor.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Advertencias de ${targetUser.tag}`)
                .setDescription(`Total de advertencias: ${userWarnings.length}`)
                .setTimestamp();

            userWarnings.forEach((warning, index) => {
                embed.addFields(
                    { name: `Advertencia #${index + 1}`, value: `**Razón:** ${warning.reason}\n**Moderador:** <@${warning.moderatorId}>\n**Fecha:** ${new Date(warning.timestamp).toLocaleDateString()}` }
                );
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener las advertencias del usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar obtener las advertencias del usuario.', ephemeral: true });
        }
    }
};
