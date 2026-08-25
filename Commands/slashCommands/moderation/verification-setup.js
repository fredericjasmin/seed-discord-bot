const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'verification-setup',
    description: '[🛡️ MODERATION] Configura y envía el panel interactivo de verificación en un canal.',
    userPerms: 'Administrator',
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            name: 'canal',
            description: 'Canal donde se publicará el panel de verificación',
            channelTypes: [ChannelType.GuildText],
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Role,
            name: 'rol',
            description: 'Rol que se otorgará al verificarse',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'titulo',
            description: 'Título del embed de verificación',
            required: false,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'descripcion',
            description: 'Instrucciones del panel de verificación',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Administrador para usar este comando.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('canal');
        const role = interaction.options.getRole('rol');
        const title = interaction.options.getString('titulo') || '🛡️ Verificación de Seguridad';
        const description = interaction.options.getString('descripcion') || 'Bienvenido/a al servidor. Para obtener acceso completo y ver todos los canales, haz clic en el botón de abajo.';

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) guildData = new Guild({ guildId: interaction.guild.id });

        if (!guildData.config.verification) guildData.config.verification = {};
        guildData.config.verification.enabled = true;
        guildData.config.verification.channelId = channel.id;
        guildData.config.verification.roleId = role.id;
        guildData.config.verification.title = title;
        guildData.config.verification.description = description;

        await guildData.save();

        const embed = new EmbedBuilder()
            .setColor('#00C851')
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: `${interaction.guild.name} • Sistema de Seguridad` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify-server-member')
                .setLabel('Verificarme')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        try {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Panel de verificación enviado exitosamente a ${channel} con el rol asignado ${role}!`, ephemeral: true });
        } catch (error) {
            console.error('[VerificationSetup] Error sending verification panel:', error);
            await interaction.reply({ content: '❌ Error al enviar el panel de verificación. Verifica los permisos del bot.', ephemeral: true });
        }
    },
};
