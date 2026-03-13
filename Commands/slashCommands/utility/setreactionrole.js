const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'setreactionrole',
    description: 'Set up a reaction message to assign roles.',
    options: [
        {
            name: 'channel',
            type: 7, // CHANNEL
            description: 'The channel where the message is located.',
            required: true,
            channel_types: [ChannelType.GuildText],
        },
        {
            name: 'message_id',
            type: 3, // STRING
            description: 'The ID of the message to add reactions to.',
            required: true,
        },
        {
            name: 'emoji1',
            type: 3, // STRING
            description: 'First emoji for the reaction.',
            required: true,
        },
        {
            name: 'role1',
            type: 8, // ROLE
            description: 'First role to assign with the reaction.',
            required: true,
        },
        {
            name: 'emoji2',
            type: 3, // STRING
            description: 'Second emoji for the reaction.',
            required: false,
        },
        {
            name: 'role2',
            type: 8, // ROLE
            description: 'Second role to assign with the reaction.',
            required: false,
        },
        {
            name: 'emoji3',
            type: 3, // STRING
            description: 'Third emoji for the reaction.',
            required: false,
        },
        {
            name: 'role3',
            type: 8, // ROLE
            description: 'Third role to assign with the reaction.',
            required: false,
        },
        {
            name: 'emoji4',
            type: 3, // STRING
            description: 'Fourth emoji for the reaction.',
            required: false,
        },
        {
            name: 'rol4',
            type: 8, // ROLE
            description: 'Fourth role to assign with the reaction.',
            required: false,
        },
        {
            name: 'emoji5',
            type: 3, // STRING
            description: 'Fifth emoji for the reaction.',
            required: false,
        },
        {
            name: 'rol5',
            type: 8, // ROLE
            description: 'Fifth role to assign with the reaction.',
            required: false,
        },
    ],
    userPerms: ['ManageRoles', 'ManageChannels'],

    async execute(interaction) {
        const channel = interaction.options.getChannel('canal');
        const messageId = interaction.options.getString('mensaje_id');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles) || !interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'You do not have permission to set up reaction roles.', ephemeral: true });
        }

        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'El canal debe ser un canal de texto.', ephemeral: true });
        }

        let message;
        try {
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            return interaction.reply({ content: 'Message with the provided ID was not found in that channel.', ephemeral: true });
        }

        const reactions = [];
        for (let i = 1; i <= 5; i++) {
            const emoji = interaction.options.getString(`emoji${i}`);
            const role = interaction.options.getRole(`rol${i}`);
            if (emoji && role) {
                reactions.push({ emoji: emoji, roleId: role.id });
            }
        }

        if (reactions.length === 0) {
            return interaction.reply({ content: 'Debes proporcionar al menos un par de emoji y rol.', ephemeral: true });
        }

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: interaction.guild.id });
        }

        // Remove existing reaction role config for this message if it exists
        guildData.config.reactionRoles = guildData.config.reactionRoles.filter(rr => rr.messageId !== messageId);

        guildData.config.reactionRoles.push({
            messageId: messageId,
            channelId: channel.id,
            reactions: reactions,
        });

        await guildData.save();

        // Add reactions to the message
        for (const reaction of reactions) {
            await message.react(reaction.emoji).catch(console.error);
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Configured Reaction Roles')
            .setDescription(`A reaction roles message has been set up in [this message](${message.url}).`)
            .addFields(
                { name: 'Canal', value: channel.toString(), inline: true },
                { name: 'Mensaje ID', value: messageId, inline: true },
                { name: 'Reacciones', value: reactions.map(r => `${r.emoji} -> <@&${r.roleId}>`).join('\n') }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};