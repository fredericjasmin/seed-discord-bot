const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Level = require('../../../models/Level');

const getRequiredXp = (level) => Math.floor(100 * Math.pow(level, 1.5));

module.exports = {
    name: 'setxp',
    description: 'Ajusta la experiencia o el nivel de un usuario en el servidor.',
    userPerms: 'Administrator',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'usuario',
            description: 'Usuario al que deseas modificar la experiencia',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'tipo',
            description: 'Tipo de ajuste',
            required: true,
            choices: [
                { name: 'Establecer Nivel', value: 'set_level' },
                { name: 'Establecer XP', value: 'set_xp' },
                { name: 'Añadir XP', value: 'add_xp' },
            ]
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'cantidad',
            description: 'Cantidad de nivel o XP a aplicar',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Administrador para usar este comando.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const tipo = interaction.options.getString('tipo');
        const cantidad = interaction.options.getInteger('cantidad');

        if (cantidad < 0) {
            return interaction.reply({ content: '❌ La cantidad debe ser un número positivo.', ephemeral: true });
        }

        let userLevel = await Level.findOne({ guildId: interaction.guild.id, userId: targetUser.id });
        if (!userLevel) {
            userLevel = new Level({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                xp: 0,
                level: 1,
                totalMessages: 0
            });
        }

        if (tipo === 'set_level') {
            userLevel.level = Math.max(1, cantidad);
            userLevel.xp = getRequiredXp(userLevel.level - 1);
        } else if (tipo === 'set_xp') {
            userLevel.xp = cantidad;
            // Recalcular nivel
            let lvl = 1;
            while (userLevel.xp >= getRequiredXp(lvl)) {
                lvl++;
            }
            userLevel.level = lvl;
        } else if (tipo === 'add_xp') {
            userLevel.xp += cantidad;
            // Recalcular nivel
            let lvl = userLevel.level;
            while (userLevel.xp >= getRequiredXp(lvl)) {
                lvl++;
            }
            userLevel.level = lvl;
        }

        await userLevel.save();

        const embed = new EmbedBuilder()
            .setColor('#00C851')
            .setTitle('⚙️ Nivel Actualizado')
            .setDescription(`Se ha actualizado el progreso de ${targetUser}:`)
            .addFields(
                { name: '⭐ Nuevo Nivel', value: `${userLevel.level}`, inline: true },
                { name: '🔮 XP Total', value: `${userLevel.xp.toLocaleString()} XP`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
