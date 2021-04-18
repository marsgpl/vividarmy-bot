const CookieJar = require('modules/CookieJar');
const Browser = require('modules/Browser');

const checkProxy = require('gameCommands/checkProxy');
// const connectToGameWs = require('gameCommands/connectToGameWs');

module.exports = async state => {
    const { game, config, db } = state;
    const { msg } = state.discord;

    if (game.connected) {
        return true;
    }

    if (game.connecting) {
        msg.channel.send(`bot is currently connecting to game, try again later`);
        return false;
    }

    msg.channel.send(`connecting to game ...`);

    const cookieJar = new CookieJar({
        storageType: CookieJar.STORAGE_TYPE_MONGO_DB,
        storageConfig: {
            collection: await db.collection(config.mongo.game.cookieJarCollection),
            docId: 'discordGameAccount',
        },
    });

    const browser = new Browser({
        userAgent: config.game.browser.userAgent,
        socks5: config.game.proxy.socks5[0],
        cookieJar,
    });

    game.connecting = true;

    game.ctx = {
        config: config.game,
        db,
        browser,
        account: {...config.discord.gameAccount},
    };

    if (config.game.proxy.required) {
        msg.channel.send(`checking proxy ...`);
        await checkProxy(game.ctx);
    }

    // get client version
    // get account servers
    // await connectToGameWs(game.ctx);

    game.connected = true;
    game.connecting = false;

    return true;
};
