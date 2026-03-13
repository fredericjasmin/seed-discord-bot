const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'role',
    description: 'Añade o remueve un rol a un usuario.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario al que quieres modificar el rol.',
            required: true,
        },
        {
            name: 'rol',
            type: 8, // ROLE
            description: 'El rol a añadir o remover.',
            required: true,
        },
        {
            name: 'accion',
            type: 3, // STRING
            description: 'Acción a realizar (add/remove).',
            required: true,
            choices: [
                { name: 'Añadir', value: 'add' },
                { name: 'Remover', value: 'remove' },
            ],
        },
    ],
    userPerms: ['ManageRoles'],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const targetRole = interaction.options.getRole('rol');
        const action = interaction.options.getString('accion');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: 'No tienes permiso para gestionar roles.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        if (targetRole.managed) {
            return interaction.reply({ content: 'No puedes gestionar este rol (es un rol gestionado por una integración).', ephemeral: true });
        }

        if (targetRole.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes gestionar un rol igual o superior al tuyo.', ephemeral: true });
        }

        if (targetRole.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: 'No puedo gestionar este rol. Mi rol es más bajo que el rol objetivo.', ephemeral: true });
        }

        try {
            let embed;
            if (action === 'add') {
                if (targetMember.roles.cache.has(targetRole.id)) {
                    return interaction.reply({ content: `**${targetUser.tag}** ya tiene el rol **${targetRole.name}**.`, ephemeral: true });
                }
                await targetMember.roles.add(targetRole);
                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`Se ha añadido el rol **${targetRole.name}** a **${targetUser.tag}**.`);
            } else if (action === 'remove') {
                if (!targetMember.roles.cache.has(targetRole.id)) {
                    return interaction.reply({ content: `**${targetUser.tag}** no tiene el rol **${targetRole.name}**.`, ephemeral: true });
                }
                await targetMember.roles.remove(targetRole);
                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`Se ha removido el rol **${targetRole.name}** de **${targetUser.tag}**.`);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al gestionar el rol:', error);
            await interaction.reply({ content: 'Hubo un error al intentar gestionar el rol.', ephemeral: true });
        }
    }
};
