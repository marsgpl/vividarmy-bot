const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;

const log = require('modules/log').setName('discord-bot');
const loadConfig = require('modules/loadConfig');

const commands = {
    'find': require('discordCommands/find'),
};

const state = {
    config: null,
    discord: {
        client: null,
        msg: null,
        args: '',
        isUserAdmin: false,
    },
    game: {
        connected: false,
        connecting: false,
        ctx: null,
    },
    mongo: {
        client: null,
        db: null,
        collections: {},
    },
};

process.on('unhandledRejection', reason => {
    log('unhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', reason => {
    log('uncaughtException:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    log('SIGTERM');
    process.exit(1);
});

(async () => {
    log('loading config');

    const config = await loadConfig(process.env.VIVIDARMY_BOT_CONFIG);
    state.config = config;

    log('connecting to mongo');

    state.mongo.client = await MongoClient.connect(config.mongo.connectUrl);
    state.mongo.db = state.mongo.client.db(config.mongo.db);

    log('connecting to discord');

    const discord = new Discord.Client();
    state.discord.client = discord;

    await discord.login(config.discord.app.bot.token);

    discord.on('ready', () => {
        log('logged in to discord as', discord.user.tag);
    });

    discord.on('message', async msg => {
        const channelId = msg.channel && msg.channel.id; // discord channel id where msg was sent
        const userId = msg.author && msg.author.id; // discord user id who sent this msg

        if (userId == config.discord.app.clientId) {
            // message from itself
            return;
        }

        const isChannelAllowed = Boolean(config.discord.app.allowedChannelsIds[channelId]);
        const isUserAdmin = Boolean(config.discord.app.adminUsersIds[userId]);

        if (!isChannelAllowed) {
            log('channel not allowed:', channelId);
            return;
        }

        const [ cmd, args ] = String(msg.content || '').split(/\s+/g);

        const cmdFu = commands[cmd];

        if (!cmdFu) {
            const error = `unknown command: ${cmd}`;

            log(error);
            msg.channel.send(error);

            return;
        }

        log('command:', msg.content);

        state.discord.msg = msg;
        state.discord.args = args;
        state.discord.isUserAdmin = isUserAdmin;

        await cmdFu(state);
    });
})();
