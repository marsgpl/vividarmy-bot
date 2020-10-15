import config from 'config/prod.json';
import { Config } from 'class/Config';
import { Web } from 'class/Web';

process.on('unhandledRejection', reason => {
    console.log('Web unhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', reason => {
    console.log('Web uncaughtException:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('Web SIGTERM');
    process.exit(1);
});

const web = new Web(config as Config);

web.start();
