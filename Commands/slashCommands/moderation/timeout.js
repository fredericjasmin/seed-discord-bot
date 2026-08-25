const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'timeout',
    description: 'Aplica un aislamiento temporal (Timeout) a un miembro del servidor.',
    userPerms: 'ModerateMembers',
    botPerms: 'ModerateMembers',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'usuario',
            description: 'Usuario al que deseas aislar temporalmente',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'duracion',
            description: 'Duración del aislamiento (ej: 10m, 1h, 1d, máx 28d)',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'razon',
            description: 'Razón del aislamiento',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: '❌ No tienes permisos para aislar miembros (ModerateMembers).', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const durationStr = interaction.options.getString('duracion');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        const durationMs = ms(durationStr);
        if (!durationMs || isNaN(durationMs)) {
            return interaction.reply({ content: '❌ Formato de duración inválido. Ejemplos válidos: `60s`, `10m`, `2h`, `1d`, `7d`.', ephemeral: true });
        }

        // Discord permite máx 28 días
        const maxMs = 28 * 24 * 60 * 60 * 1000;
        if (durationMs > maxMs || durationMs < 5000) {
            return interaction.reply({ content: '❌ La duración debe estar entre 5 segundos y 28 días.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ No se pudo encontrar a este usuario en el servidor.', ephemeral: true });
        }

        if (targetMember.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes aislarte a ti mismo.', ephemeral: true });
        }

        if (!targetMember.moderatable) {
            return interaction.reply({ content: '❌ No puedo aislar a este usuario. Puede tener un rol superior al mío o permisos de administrador.', ephemeral: true });
        }

        try {
            await targetMember.timeout(durationMs, `${reason} - Moderador: ${interaction.user.tag}`);

            const readableDuration = ms(durationMs, { long: true });
            const embed = new EmbedBuilder()
                .setColor('#ff8800')
                .setTitle('⏳ Miembro Aislado (Timeout)')
                .setDescription(`**${targetUser.tag}** ha sido aislado temporalmente.`)
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
                    { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
                    { name: '⏱️ Duración', value: readableDuration, inline: true },
                    { name: '📝 Razón', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Intentar notificar por MD
            targetUser.send({
                content: `⚠️ Has recibido un aislamiento temporal (Timeout) de **${readableDuration}** en **${interaction.guild.name}**.\n**Razón:** ${reason}`
            }).catch(() => {});

        } catch (error) {
            console.error('[Timeout] Error applying timeout:', error);
            await interaction.reply({ content: '❌ Ocurrió un error al intentar aislar al usuario.', ephemeral: true });
        }
    },
};
