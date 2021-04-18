import config from 'config/dev';
import { TopWarBot } from 'modules/local/TopWarBot';

const args = [...process.argv.slice(2)];

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

const bot = new TopWarBot(config);

bot.start();

import padLeft from 'modules/shared/padLeft';

console.log('🔸 padLeft():', padLeft('kek', 'lol', 10));
