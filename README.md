# Seed

Open-source Discord bot template with slash commands, an Express dashboard, and MongoDB persistence.

## Getting Started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in your own Discord, MongoDB, and session credentials.
4. Start the project with `npm run dev` or `npm start`.

## Environment Variables

- `TOKEN`: Discord bot token.
- `DISCORD_CLIENT_ID`: Discord application ID.
- `DISCORD_CLIENT_SECRET`: OAuth2 client secret used by the dashboard.
- `GUILD_ID`: Test guild used to register commands during development.
- `BOT_OWNER_ID`: Discord user ID allowed to access owner-only features.
- `MONGO_DB`: MongoDB connection string.
- `PORT`: HTTP server port.
- `BASE_URL`: Base URL for the dashboard.
- `SESSION_SECRET`: Secret used by `express-session`.