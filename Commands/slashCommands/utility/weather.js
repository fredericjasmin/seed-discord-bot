const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'weather',
    description: 'Get weather information for a location.',
    options: [
        {
            name: 'city',
            type: 3, // STRING
            description: 'The city or location you want the weather for.',
            required: true,
        },
    ],

    async execute(interaction) {
        await interaction.deferReply();

    const city = interaction.options.getString('city');

        try {
            // Step 1: Geocoding - Convert city name to coordinates using Open-Meteo Geocoding API
            const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geocodingUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                return interaction.editReply(`City "${city}" not found.`);
            }

            const { latitude, longitude, name, country } = geoData.results[0];

            // Step 2: Fetch weather data using Open-Meteo Forecast API
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=1`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            if (!weatherData || !weatherData.current_weather) {
                console.error('Error getting weather:', weatherData);
                return interaction.editReply('There was an error getting the weather. Please try again later.');
            }

            const { temperature, windspeed, weathercode, is_day } = weatherData.current_weather;
            const humidity = weatherData.hourly.relativehumidity_2m[0]; // Taking the first hourly value

            // Open-Meteo weather codes mapping (simplified for common conditions)
            const weatherDescriptions = {
                0: 'Clear sky',
                1: 'Mostly clear',
                2: 'Partly cloudy',
                3: 'Cloudy',
                45: 'Fog',
                48: 'Freezing fog',
                51: 'Light drizzle',
                53: 'Moderate drizzle',
                55: 'Dense drizzle',
                56: 'Light freezing drizzle',
                57: 'Dense freezing drizzle',
                61: 'Light rain',
                63: 'Moderate rain',
                65: 'Heavy rain',
                66: 'Light freezing rain',
                67: 'Heavy freezing rain',
                71: 'Light snow',
                73: 'Moderate snow',
                75: 'Heavy snow',
                77: 'Snow grains',
                80: 'Light rain showers',
                81: 'Moderate rain showers',
                82: 'Violent rain showers',
                85: 'Light snow showers',
                86: 'Heavy snow showers',
                95: 'Thunderstorm',
                96: 'Thunderstorm with light hail',
                99: 'Thunderstorm with heavy hail',
            };

            const weatherDescription = weatherDescriptions[weathercode] || 'Unknown condition';

            const embed = new EmbedBuilder()
                .setColor('#007bff') // Blue color for weather
                .setTitle(`Clima en ${name}, ${country}`)
                .setDescription(weatherDescription)
                .addFields(
                    { name: 'Temperatura', value: `${temperature}°C`, inline: true },
                    { name: 'Humedad', value: `${humidity}%`, inline: true },
                    { name: 'Velocidad del viento', value: `${windspeed} km/h`, inline: true },
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener el clima:', error);
            await interaction.editReply('Hubo un error al intentar obtener el clima.');
        }
    }
};