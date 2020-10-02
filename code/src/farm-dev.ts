import config from 'config/dev.json';
import { Config } from 'class/Config';
import { Farm } from 'class/Farm';

process.on('unhandledRejection', reason => {
    console.log('Farm unhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', reason => {
    console.log('Farm uncaughtException:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('Farm SIGTERM');
    process.exit(1);
});

const farm = new Farm(config as Config);

farm.start();
