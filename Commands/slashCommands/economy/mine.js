const { EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

const ORES_TABLE = [
    { name: '🪨 Piedra y Carbón', rarity: 'Común', minVal: 20, maxVal: 50, chance: 0.45 },
    { name: '⛓️ Mineral de Hierro', rarity: 'Poco Común', minVal: 60, maxVal: 120, chance: 0.28 },
    { name: '🪙 Pepita de Oro', rarity: 'Raro', minVal: 150, maxVal: 300, chance: 0.16 },
    { name: '💎 Diamante Puro', rarity: 'Épico', minVal: 400, maxVal: 800, chance: 0.08 },
    { name: '🌌 Fragmento de Netherite', rarity: 'Legendario', minVal: 1500, maxVal: 3000, chance: 0.03 }
];

module.exports = {
    name: 'mine',
    description: 'Entra a la mina con tu pico para extraer valiosos minerales y gemas.',
    cooldown: 60000, // 60 segundos
    run: async (client, interaction) => {
        let userData = await Economy.findById(interaction.user.id);
        if (!userData) {
            userData = new Economy({ _id: interaction.user.id });
        }

        const rand = Math.random();
        let cumulative = 0;
        let mined = ORES_TABLE[0];

        for (const item of ORES_TABLE) {
            cumulative += item.chance;
            if (rand <= cumulative) {
                mined = item;
                break;
            }
        }

        const earnedCoins = Math.floor(Math.random() * (mined.maxVal - mined.minVal + 1)) + mined.minVal;
        userData.coins += earnedCoins;

        if (!userData.inventory) userData.inventory = [];
        userData.inventory.push(mined.name);
        await userData.save();

        let color = '#757575';
        if (mined.rarity === 'Legendario') color = '#ff4444';
        else if (mined.rarity === 'Épico') color = '#33b5e5';
        else if (mined.rarity === 'Raro') color = '#ffbb33';
        else if (mined.rarity === 'Poco Común') color = '#00C851';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('⛏️ ¡Expedición Minera!')
            .setDescription(`Picaste en las profundidades de la cueva y encontraste:\n\n### ${mined.name} (${mined.rarity})\n\n💰 Vendiste los minerales fundidos por **+${earnedCoins.toLocaleString()}** monedas.`)
            .setFooter({ text: `Saldo total: ${userData.coins.toLocaleString()} monedas` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
