import config from 'config/prod-578.json';
import { Config } from 'class/Config';
import { DiscordBot } from 'class/DiscordBot';

process.on('unhandledRejection', reason => {
    console.log('DiscordBot unhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', reason => {
    console.log('DiscordBot uncaughtException:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('DiscordBot SIGTERM');
    process.exit(1);
});

const discordBot = new DiscordBot(config as Config);

discordBot.start();
