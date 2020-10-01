import config from 'config/dev.json';
import { DiscordBot } from 'DiscordBot';

process.on('unhandledRejection', reason => {
    console.log('unhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', reason => {
    console.log('uncaughtException:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM');
    process.exit(1);
});

const discordBot = new DiscordBot(config);

discordBot.start();
