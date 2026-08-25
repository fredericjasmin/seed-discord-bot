const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const CATEGORY_METADATA = {
    moderation: { name: 'Moderación & Seguridad', emoji: '🛡️', description: 'Comandos de sanciones, automod y protección' },
    economy: { name: 'Economía & RPG', emoji: '💰', description: 'Minijuegos, pesca, minería, apuestas y comercio' },
    utility: { name: 'Utilidad & Servidor', emoji: '🛠️', description: 'Rangos, sugerencias, cumpleaños, voz temporal y backups' },
    information: { name: 'Información & Ayuda', emoji: 'ℹ️', description: 'Estado del bot, panel de ayuda y estadísticas' },
    giveaway: { name: 'Sorteos (Giveaways)', emoji: '🎁', description: 'Creación y gestión de sorteos en vivo' },
    fun: { name: 'Diversión & Juegos', emoji: '🎉', description: 'Comandos de entretenimiento y juegos sociales' },
    ticket: { name: 'Tickets de Soporte', emoji: '📩', description: 'Paneles de atención al cliente y soporte' }
};

module.exports = {
    name: 'help',
    description: 'Muestra el menú de ayuda interactivo y la lista de comandos.',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'comando',
            description: 'Nombre de un comando específico para ver su información detallada',
            required: false
        }
    ],
    run: async (client, interaction) => {
        const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID || client.user.id}&permissions=8&scope=bot%20applications.commands`;
        const guildSettingsUrl = interaction.guild ? `${baseUrl}/servers/${interaction.guild.id}/settings` : `${baseUrl}/servers`;

        // 1. Si el usuario pidió un comando específico
        const specificCmdName = interaction.options.getString('comando')?.toLowerCase()?.replace(/^\//, '');
        if (specificCmdName) {
            const cmd = client.slashCommands.get(specificCmdName);
            if (!cmd) {
                return interaction.reply({ content: `❌ No se encontró ningún comando llamado \`/${specificCmdName}\`.`, ephemeral: true });
            }

            const cmdEmbed = new EmbedBuilder()
                .setColor('#00C851')
                .setTitle(`📖 Comando: /${cmd.name}`)
                .setDescription(cmd.description || 'Sin descripción.')
                .addFields(
                    { name: '📂 Categoría', value: cmd.category ? cmd.category.toUpperCase() : 'GENERAL', inline: true },
                    { name: '🔒 Permisos Requeridos', value: cmd.userPerms || 'Ninguno (Todos los miembros)', inline: true }
                )
                .setFooter({ text: `${client.user.username} • Manual de Comandos` })
                .setTimestamp();

            if (cmd.options && cmd.options.length > 0) {
                const optionsList = cmd.options.map(opt => {
                    const reqStr = opt.required ? '*(obligatorio)*' : '*(opcional)*';
                    return `• \`${opt.name}\` ${reqStr}: ${opt.description || 'Sin descripción'}`;
                }).join('\n');
                cmdEmbed.addFields({ name: '⚙️ Parámetros & Opciones', value: optionsList });
            }

            return interaction.reply({ embeds: [cmdEmbed] });
        }

        // 2. Agrupar todos los comandos por categoría
        const categoriesMap = new Map();
        client.slashCommands.forEach(cmd => {
            if (cmd.category === 'owner') return;
            const cat = (cmd.category || 'utility').toLowerCase();
            if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
            categoriesMap.get(cat).push(cmd);
        });

        // 3. Crear Embed de Inicio (Overview)
        const totalCommandsCount = Array.from(categoriesMap.values()).reduce((acc, list) => acc + list.length, 0);

        function buildHomeEmbed() {
            const overviewFields = [];
            for (const [catKey, cmdList] of categoriesMap.entries()) {
                const meta = CATEGORY_METADATA[catKey] || { name: catKey.toUpperCase(), emoji: '📁' };
                overviewFields.push({
                    name: `${meta.emoji} ${meta.name}`,
                    value: `\`${cmdList.length} comandos\` • Selecciona en el menú desplegable para ver detalles.`,
                    inline: true
                });
            }

            return new EmbedBuilder()
                .setColor('#00C851')
                .setAuthor({ name: `Panel de Ayuda • ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                .setTitle('🌱 Guía de Comandos & Módulos')
                .setDescription(`Explora todos los comandos disponibles usando el **menú desplegable** inferior.\nActualmente hay **${totalCommandsCount} comandos** configurados en el bot.`)
                .addFields(overviewFields)
                .setFooter({ text: 'Usa /help [comando] para ver detalles de una función específica' })
                .setTimestamp();
        }

        // 4. Crear Select Menu de Categorías
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help-category-select')
            .setPlaceholder('📂 Selecciona una categoría para explorar...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Inicio / Resumen General')
                    .setValue('home')
                    .setDescription('Ver todas las categorías y módulos principales')
                    .setEmoji('🏠')
            );

        for (const [catKey, cmdList] of categoriesMap.entries()) {
            const meta = CATEGORY_METADATA[catKey] || { name: catKey.toUpperCase(), emoji: '📁', description: 'Lista de comandos' };
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(meta.name)
                    .setValue(catKey)
                    .setDescription(meta.description.slice(0, 100))
                    .setEmoji(meta.emoji)
            );
        }

        // 5. Botones de Enlace (Dashboard, Comandos Web, Invitar)
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('⚙️ Panel Web')
                .setStyle(ButtonStyle.Link)
                .setURL(guildSettingsUrl),
            new ButtonBuilder()
                .setLabel('📜 Comandos en Web')
                .setStyle(ButtonStyle.Link)
                .setURL(`${baseUrl}/commands`),
            new ButtonBuilder()
                .setLabel('🤖 Invitar Bot')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl)
        );

        const menuRow = new ActionRowBuilder().addComponents(selectMenu);

        const responseMsg = await interaction.reply({
            embeds: [buildHomeEmbed()],
            components: [menuRow, buttonRow],
            fetchReply: true
        });

        // 6. Colector interactivo para el Select Menu
        const collector = responseMsg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000 // 2 minutos
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Solo quien ejecutó el comando puede usar este menú.', ephemeral: true });
            }

            const selectedCat = i.values[0];

            if (selectedCat === 'home') {
                return i.update({ embeds: [buildHomeEmbed()] });
            }

            const cmdList = categoriesMap.get(selectedCat) || [];
            const meta = CATEGORY_METADATA[selectedCat] || { name: selectedCat.toUpperCase(), emoji: '📁' };

            const categoryEmbed = new EmbedBuilder()
                .setColor('#00C851')
                .setTitle(`${meta.emoji} Categoría: ${meta.name}`)
                .setDescription(`Lista de todos los comandos disponibles en este módulo (${cmdList.length} comandos):`)
                .setFooter({ text: `Usa /help [comando] para ver opciones de un comando específico` })
                .setTimestamp();

            const formattedCommands = cmdList.map(c => {
                const perms = c.userPerms ? ` \`[${c.userPerms}]\`` : '';
                return `**\`/${c.name}\`**${perms}\n<:reply:1200000000000000000> *${c.description || 'Sin descripción'}*`;
            }).join('\n\n').replace(/<:reply:\d+>/g, '↳');

            // Partir en campos si es muy largo
            if (formattedCommands.length > 4000) {
                categoryEmbed.setDescription(cmdList.map(c => `\`/${c.name}\``).join(' • '));
            } else {
                categoryEmbed.setDescription(formattedCommands || 'No hay comandos en esta categoría.');
            }

            await i.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', async () => {
            // Deshabilitar el select menu tras expirar
            const disabledMenu = new StringSelectMenuBuilder()
                .setCustomId('help-disabled')
                .setPlaceholder('⏰ Menú de ayuda expirado (Usa /help de nuevo)')
                .setDisabled(true)
                .addOptions(new StringSelectMenuOptionBuilder().setLabel('Expirado').setValue('expired'));

            await responseMsg.edit({
                components: [new ActionRowBuilder().addComponents(disabledMenu), buttonRow]
            }).catch(() => {});
        });
    },
};