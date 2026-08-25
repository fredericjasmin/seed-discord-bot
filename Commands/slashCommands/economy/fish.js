const { EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');
const ms = require('ms');

const FISH_TABLE = [
    { name: '🐟 Sardina', rarity: 'Común', minVal: 15, maxVal: 35, chance: 0.40 },
    { name: '🐠 Pez Payaso', rarity: 'Poco Común', minVal: 40, maxVal: 80, chance: 0.30 },
    { name: '🐡 Pez Globo', rarity: 'Raro', minVal: 100, maxVal: 200, chance: 0.18 },
    { name: '🦈 Tiburón Bebé', rarity: 'Épico', minVal: 300, maxVal: 600, chance: 0.09 },
    { name: '👑 Kraken Mítico', rarity: 'Legendario', minVal: 1200, maxVal: 2500, chance: 0.03 },
    { name: '👞 Bota Vieja', rarity: 'Basura', minVal: 1, maxVal: 5, chance: 0.05 }
];

module.exports = {
    name: 'fish',
    description: '[🎣 ECONOMY] Ve a pescar al río o al océano para ganar monedas e ítems raros.',
    cooldown: 45000, // 45 segundos
    run: async (client, interaction) => {
        let userData = await Economy.findById(interaction.user.id);
        if (!userData) {
            userData = new Economy({ _id: interaction.user.id });
        }

        // Selección ponderada de pesca
        const rand = Math.random();
        let cumulative = 0;
        let caught = FISH_TABLE[0];

        for (const item of FISH_TABLE) {
            cumulative += item.chance;
            if (rand <= cumulative) {
                caught = item;
                break;
            }
        }

        const earnedCoins = Math.floor(Math.random() * (caught.maxVal - caught.minVal + 1)) + caught.minVal;
        userData.coins += earnedCoins;
        
        if (!userData.inventory) userData.inventory = [];
        if (caught.rarity !== 'Basura') {
            userData.inventory.push(caught.name);
        }
        await userData.save();

        let color = '#33b5e5';
        if (caught.rarity === 'Legendario') color = '#ffbb33';
        else if (caught.rarity === 'Épico') color = '#aa66cc';
        else if (caught.rarity === 'Raro') color = '#00C851';
        else if (caught.rarity === 'Basura') color = '#757575';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎣 ¡Salida de Pesca!')
            .setDescription(`Lanzaste tu caña de pescar y atrapaste:\n\n### ${caught.name} (${caught.rarity})\n\n💰 Vendiste tu captura por **+${earnedCoins.toLocaleString()}** monedas.`)
            .setFooter({ text: `Saldo total: ${userData.coins.toLocaleString()} monedas` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
