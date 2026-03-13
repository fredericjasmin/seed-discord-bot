const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandType, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path'); // Import path module

// Recursive function to get all command files
function getCommandFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getCommandFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

module.exports = {
  name: 'help',
  description: "I show all my commands",
  run: async (client, interaction) => {

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

    const commandBaseDir = "./Commands/slashCommands/";
    const categories = fs.readdirSync(commandBaseDir).filter(folder => fs.statSync(path.join(commandBaseDir, folder)).isDirectory());

    let fields = [];

    categories.forEach((category) => {
      if (category === "owner") return; // Skip owner commands

      const categoryPath = path.join(commandBaseDir, category);
      const commandFiles = getCommandFiles(categoryPath);

      let list = commandFiles.map((filePath) => {
        // Calculate relative path from help.js to the command file
        const relativePathToCommand = path.relative(path.dirname(__filename), filePath);
        // Replace backslashes with forward slashes for consistent require paths on all OS
        const normalizedPathToCommand = relativePathToCommand.replace(/\\/g, '/');

        // Dynamically require the command module
        const Command = require(`./${normalizedPathToCommand}`); // Use './' for relative require

        return Command?.name || "Unknown Command";
      });

      const obj = {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: list.map(x => `\`/${x}\``).join(" | ") // Using code block for each command, separated by pipe
      };
      fields.push(obj);
    });

    const embed = new EmbedBuilder()
      .setColor("#03fcdb")
      .setTitle(`${client.user.username} Commands`)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription('This is the list of all my available commands');

    if (fields.length >= 1) embed.addFields(fields);

    const buttons = new ActionRowBuilder()
      .addComponents([
        new ButtonBuilder()
          .setLabel('Invite Me')
          .setURL(inviteUrl)
          .setStyle(ButtonStyle.Link)
          .setEmoji("🤖")
      ]);
    return interaction.reply({ embeds: [embed], components: [buttons] });
  },
};