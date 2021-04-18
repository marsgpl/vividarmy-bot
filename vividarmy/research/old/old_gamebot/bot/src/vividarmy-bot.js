const MongoClient = require('mongodb').MongoClient;

const log = require('modules/log');
const loadConf = require('modules/loadConf');
const Browser = require('modules/Browser');
const CookieJar = require('modules/CookieJar');

const CONF_PATH = process.env.VIVIDARMY_BOT_CONF_PATH;
const COMMAND = process.env.VIVIDARMY_BOT_COMMAND;
const ACCOUNT_ID = process.env.VIVIDARMY_ACCOUNT_ID;

process.on('unhandledRejection', (reason, promise) => {
    log('unhandledRejection:', reason, promise);
    process.exit(1);
});

process.on('uncaughtException', (reason, promise) => {
    log('uncaughtException:', reason, promise);
    process.exit(1);
});

process.on('SIGTERM', () => {
    log('SIGTERM:', 'caught, exiting');
    process.exit(1);
});

(async () => {
    const conf = await loadConf(CONF_PATH);

    const mongoClient = await MongoClient.connect(conf.mongo.connectUrl);

    const db = mongoClient.db(conf.mongo.defaultDb);

    const cookieJar = new CookieJar({
        storageType: CookieJar.STORAGE_TYPE_MONGO_DB,
        storageConf: {
            collection: await db.collection(conf.mongo.cookieJarCollection),
            docId: ACCOUNT_ID,
        },
    });

    await cookieJar.loadFromStorage();

    const browser = new Browser({
        userAgent: conf.browser.userAgent,
        socks5: conf.socks5.g123,
        cookieJar,
    });

    const command = require(`commands/${COMMAND}`);

    await command({
        conf,
        db,
        browser,
        accountId: ACCOUNT_ID,
    });

    mongoClient.close();
})();
