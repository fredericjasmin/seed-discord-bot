const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'autorole',
    description: 'Configura el rol automático para nuevos miembros.',
    userPerms: ['ManageGuild'],
    options: [
        {
            name: 'toggle',
            description: 'Activa o desactiva el rol automático.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'estado', description: 'Elige si activar o desactivar.', required: true, type: 3, choices: [{ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }] },
            ],
        },
        {
            name: 'set',
            description: 'Establece el rol a asignar automáticamente.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'rol', description: 'El rol a asignar.', required: true, type: 8 },
            ],
        },
    ],

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: 'No tienes permiso para configurar el rol automático.', ephemeral: true });
        }

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: interaction.guild.id });
        }

        if (!guildData.config.autoRole) {
            guildData.config.autoRole = {};
        }

        const subcommand = interaction.options.getSubcommand();
        let replyContent = '';

        switch (subcommand) {
            case 'toggle':
                const isEnabled = interaction.options.getString('estado') === 'on';
                guildData.config.autoRole.enabled = isEnabled;
                replyContent = `El rol automático ha sido ${isEnabled ? 'habilitado' : 'deshabilitado'}.`;
                break;
            case 'set':
                const role = interaction.options.getRole('rol');
                guildData.config.autoRole.roleId = role.id;
                replyContent = `El rol automático ha sido establecido en ${role.name}.`;
                break;
        }

        await guildData.save();
        if (replyContent) {
            await interaction.reply({ content: replyContent, ephemeral: true });
        }
    }
};