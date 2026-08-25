const { ApplicationCommandOptionType, PermissionsBitField, ChannelType } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'serverstats',
    description: 'Configura o elimina los canales automáticos de estadísticas del servidor.',
    userPerms: 'Administrator',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'setup',
            description: 'Crea automáticamente la categoría y los canales de estadísticas.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'disable',
            description: 'Deshabilita y elimina los canales de estadísticas.',
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Administrador para usar este comando.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData) guildData = new Guild({ guildId: guild.id });

        if (subcommand === 'setup') {
            await interaction.deferReply();

            try {
                await guild.members.fetch();

                const totalMembers = guild.memberCount;
                const botCount = guild.members.cache.filter(m => m.user.bot).size;
                const humanCount = totalMembers - botCount;
                const roleCount = guild.roles.cache.size;

                // Crear categoría
                const category = await guild.channels.create({
                    name: '📊 ESTADÍSTICAS DEL SERVIDOR',
                    type: ChannelType.GuildCategory,
                    position: 0,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.Connect],
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                // Crear canal de miembros
                const memberCh = await guild.channels.create({
                    name: `👥 Miembros: ${humanCount.toLocaleString()}`,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.Connect],
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                // Crear canal de bots
                const botCh = await guild.channels.create({
                    name: `🤖 Bots: ${botCount.toLocaleString()}`,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.Connect],
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                // Crear canal de roles
                const roleCh = await guild.channels.create({
                    name: `🎭 Roles: ${roleCount.toLocaleString()}`,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.Connect],
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                guildData.config.serverStats = {
                    enabled: true,
                    categoryId: category.id,
                    memberChannelId: memberCh.id,
                    botChannelId: botCh.id,
                    roleChannelId: roleCh.id
                };

                await guildData.save();

                await interaction.editReply({
                    content: `✅ ¡Contadores de estadísticas creados exitosamente en la categoría **${category.name}**! Se actualizarán solos cada 10 minutos.`
                });

            } catch (error) {
                console.error('[ServerStats] Error creating channels:', error);
                await interaction.editReply({ content: '❌ Error al crear los canales de estadísticas. Verifica los permisos del bot.' });
            }

        } else if (subcommand === 'disable') {
            const stats = guildData.config.serverStats;
            if (!stats || !stats.enabled) {
                return interaction.reply({ content: '❌ Los contadores de estadísticas no están activos en este servidor.', ephemeral: true });
            }

            try {
                if (stats.memberChannelId) await guild.channels.cache.get(stats.memberChannelId)?.delete().catch(() => {});
                if (stats.botChannelId) await guild.channels.cache.get(stats.botChannelId)?.delete().catch(() => {});
                if (stats.roleChannelId) await guild.channels.cache.get(stats.roleChannelId)?.delete().catch(() => {});
                if (stats.categoryId) await guild.channels.cache.get(stats.categoryId)?.delete().catch(() => {});

                guildData.config.serverStats = { enabled: false };
                await guildData.save();

                await interaction.reply({ content: '✅ Se han deshabilitado y eliminado los canales de estadísticas del servidor.' });
            } catch (error) {
                console.error('[ServerStats] Error disabling:', error);
                await interaction.reply({ content: '❌ Error al deshabilitar las estadísticas.', ephemeral: true });
            }
        }
    },
};
