const { EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

const ANIMALS_TABLE = [
    { name: '🐇 Conejo Veloz', rarity: 'Común', minVal: 25, maxVal: 55, chance: 0.40 },
    { name: '🦊 Zorro Astuto', rarity: 'Poco Común', minVal: 70, maxVal: 140, chance: 0.30 },
    { name: '🐗 Jabalí Salvaje', rarity: 'Raro', minVal: 180, maxVal: 350, chance: 0.17 },
    { name: '🐻 Oso Pardo Gigante', rarity: 'Épico', minVal: 450, maxVal: 900, chance: 0.09 },
    { name: '🐉 Dragón Ancestral', rarity: 'Legendario', minVal: 2000, maxVal: 4000, chance: 0.04 }
];

module.exports = {
    name: 'hunt',
    description: '[🏹 ECONOMY] Adéntrate en el bosque salvaje para cazar criaturas y ganar recompensas.',
    cooldown: 60000, // 60 segundos
    run: async (client, interaction) => {
        let userData = await Economy.findById(interaction.user.id);
        if (!userData) {
            userData = new Economy({ _id: interaction.user.id });
        }

        const rand = Math.random();
        let cumulative = 0;
        let hunted = ANIMALS_TABLE[0];

        for (const item of ANIMALS_TABLE) {
            cumulative += item.chance;
            if (rand <= cumulative) {
                hunted = item;
                break;
            }
        }

        const earnedCoins = Math.floor(Math.random() * (hunted.maxVal - hunted.minVal + 1)) + hunted.minVal;
        userData.coins += earnedCoins;

        if (!userData.inventory) userData.inventory = [];
        userData.inventory.push(hunted.name);
        await userData.save();

        let color = '#4caf50';
        if (hunted.rarity === 'Legendario') color = '#ff4081';
        else if (hunted.rarity === 'Épico') color = '#9c27b0';
        else if (hunted.rarity === 'Raro') color = '#ff9800';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🏹 ¡Cacería en el Bosque!')
            .setDescription(`Rastreaste las huellas en la maleza y cazaste:\n\n### ${hunted.name} (${hunted.rarity})\n\n💰 Recompensa del gremio de cazadores: **+${earnedCoins.toLocaleString()}** monedas.`)
            .setFooter({ text: `Saldo total: ${userData.coins.toLocaleString()} monedas` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
