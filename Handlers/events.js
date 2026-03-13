const fs = require('fs');

module.exports = (client) => {
    let count = 0;
    fs.readdirSync('./Events/').forEach(dir => {
        const files = fs.readdirSync(`./Events/${dir}/`).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const event = require(`../Events/${dir}/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client)); // Pass client as the last argument
            } else {
                client.on(event.name, (...args) => event.execute(...args, client)); // Pass client as the last argument
            }
            count++;
        }
    });
    console.log(`[Events] Loaded ${count} events.`);
};