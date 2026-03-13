const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Cambia el apodo de un usuario en el servidor.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario cuyo apodo quieres cambiar.',
            required: true,
        },
        {
            name: 'apodo',
            type: 3, // STRING
            description: 'El nuevo apodo del usuario (dejar vacío para restablecer).',
            required: false,
        },
    ],
    userPerms: ['ManageNicknames'],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const newNickname = interaction.options.getString('apodo');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return interaction.reply({ content: 'No tienes permiso para cambiar apodos.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes cambiar el apodo de un usuario con un rol igual o superior al tuyo.', ephemeral: true });
        }
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedes cambiar el apodo del bot.', ephemeral: true });
        }

        try {
            const oldNickname = targetMember.nickname || targetUser.username;
            await targetMember.setNickname(newNickname);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Apodo Cambiado')
                .setDescription(`El apodo de **${targetUser.tag}** ha sido cambiado de **${oldNickname}** a **${newNickname || targetUser.username}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al cambiar el apodo:', error);
            await interaction.reply({ content: 'Hubo un error al intentar cambiar el apodo. Asegúrate de que el bot tiene permisos para cambiar apodos y que el apodo no es demasiado largo.', ephemeral: true });
        }
    }
};
