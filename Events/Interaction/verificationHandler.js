const Guild = require('../../models/Guild');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.guild || !interaction.member) return;

        if (interaction.customId !== 'verify-server-member') return;

        try {
            const guildData = await Guild.findOne({ guildId: interaction.guild.id });
            const verificationConfig = guildData?.config?.verification;

            if (!verificationConfig || !verificationConfig.enabled || !verificationConfig.roleId) {
                return interaction.reply({
                    content: '❌ El sistema de verificación no está configurado correctamente en este servidor.',
                    ephemeral: true
                });
            }

            const role = interaction.guild.roles.cache.get(verificationConfig.roleId);
            if (!role) {
                return interaction.reply({
                    content: '❌ El rol de verificación configurado no existe o fue eliminado.',
                    ephemeral: true
                });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: '✅ Ya te encuentras verificado en este servidor.',
                    ephemeral: true
                });
            }

            await interaction.member.roles.add(role, 'Verificación completada exitosamente');

            await interaction.reply({
                content: `🎉 ¡Te has verificado correctamente! Se te ha asignado el rol **${role.name}**. ¡Bienvenido a la comunidad!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('[Verification] Error assigning verification role:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Ocurrió un error al intentar asignarte el rol de verificación. Verifica que el rol del bot esté por encima del rol asignado.',
                    ephemeral: true
                });
            }
        }
    }
};
