const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const Backup = require('../../../models/Backup');
const crypto = require('crypto');

module.exports = {
    name: 'backup',
    description: 'Sistema de copias de seguridad de la estructura del servidor.',
    userPerms: 'Administrator',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'create',
            description: 'Crea una copia de seguridad completa de roles, categorías y canales.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'list',
            description: 'Muestra todas las copias de seguridad guardadas de este servidor.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Muestra información detallada de una copia de seguridad.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'id',
                    description: 'ID de la copia de seguridad',
                    required: true,
                }
            ]
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Administrador para usar este comando.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if (subcommand === 'create') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const backupId = crypto.randomBytes(5).toString('hex').toUpperCase();

                // 1. Clonar Roles (excluyendo @everyone y gestionados)
                const rolesData = guild.roles.cache
                    .filter(r => !r.managed && r.name !== '@everyone')
                    .map(r => ({
                        name: r.name,
                        color: r.color,
                        hoist: r.hoist,
                        permissions: r.permissions.bitfield.toString(),
                        mentionable: r.mentionable,
                        position: r.position
                    }));

                // 2. Clonar Categorías y Canales
                const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
                const categoriesData = [];

                for (const [, cat] of categories) {
                    const childrenChannels = guild.channels.cache.filter(c => c.parentId === cat.id).map(ch => ({
                        name: ch.name,
                        type: ch.type,
                        topic: ch.topic || null,
                        nsfw: ch.nsfw || false,
                        bitrate: ch.bitrate || undefined,
                        userLimit: ch.userLimit || undefined,
                        rateLimitPerUser: ch.rateLimitPerUser || undefined,
                        permissions: []
                    }));

                    categoriesData.push({
                        name: cat.name,
                        permissions: [],
                        children: childrenChannels
                    });
                }

                // Canales sin categoría
                const othersData = guild.channels.cache
                    .filter(c => !c.parentId && c.type !== ChannelType.GuildCategory)
                    .map(ch => ({
                        name: ch.name,
                        type: ch.type,
                        topic: ch.topic || null,
                        nsfw: ch.nsfw || false,
                        bitrate: ch.bitrate || undefined,
                        userLimit: ch.userLimit || undefined,
                        rateLimitPerUser: ch.rateLimitPerUser || undefined,
                        permissions: []
                    }));

                const newBackup = new Backup({
                    backupId,
                    guildId: guild.id,
                    guildName: guild.name,
                    creatorId: interaction.user.id,
                    iconURL: guild.iconURL({ dynamic: true }),
                    data: {
                        roles: rolesData,
                        categories: categoriesData,
                        others: othersData
                    }
                });

                await newBackup.save();

                const embed = new EmbedBuilder()
                    .setColor('#00C851')
                    .setTitle('💾 Copia de Seguridad Creada')
                    .setDescription(`¡Se ha generado un snapshot completo del servidor exitosamente!`)
                    .addFields(
                        { name: '🆔 Backup ID', value: `\`${backupId}\``, inline: true },
                        { name: '🎭 Roles guardados', value: `${rolesData.length}`, inline: true },
                        { name: '📁 Categorías guardadas', value: `${categoriesData.length}`, inline: true }
                    )
                    .setFooter({ text: 'Guarda este ID en un lugar seguro' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('[Backup] Error creating backup:', error);
                await interaction.editReply({ content: '❌ Ocurrió un error al generar la copia de seguridad.' });
            }

        } else if (subcommand === 'list') {
            const backups = await Backup.find({ guildId: guild.id }).sort({ createdAt: -1 }).limit(10);
            if (!backups.length) {
                return interaction.reply({ content: '💾 No hay copias de seguridad creadas para este servidor.', ephemeral: true });
            }

            const listStr = backups.map(b => {
                return `🔹 ID: \`${b.backupId}\` • Fecha: <t:${Math.floor(b.createdAt.getTime() / 1000)}:f> (Creado por <@${b.creatorId}>)`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#33b5e5')
                .setTitle(`💾 Backups Registrados - ${guild.name}`)
                .setDescription(listStr)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'info') {
            const bId = interaction.options.getString('id').trim().toUpperCase();
            const backup = await Backup.findOne({ backupId: bId });

            if (!backup) {
                return interaction.reply({ content: `❌ No se encontró ninguna copia con el ID \`${bId}\`.`, ephemeral: true });
            }

            const rolesCount = backup.data?.roles?.length || 0;
            const categoriesCount = backup.data?.categories?.length || 0;
            let totalChannels = backup.data?.others?.length || 0;
            if (backup.data?.categories) {
                backup.data.categories.forEach(c => {
                    totalChannels += c.children?.length || 0;
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#aa66cc')
                .setTitle(`ℹ️ Información de Backup: ${backup.backupId}`)
                .addFields(
                    { name: '🏛️ Servidor Original', value: backup.guildName, inline: true },
                    { name: '👤 Creador', value: `<@${backup.creatorId}>`, inline: true },
                    { name: '📅 Fecha de Creación', value: `<t:${Math.floor(backup.createdAt.getTime() / 1000)}:F>`, inline: false },
                    { name: '🎭 Roles', value: `${rolesCount}`, inline: true },
                    { name: '📁 Categorías', value: `${categoriesCount}`, inline: true },
                    { name: '💬 Total Canales', value: `${totalChannels}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
