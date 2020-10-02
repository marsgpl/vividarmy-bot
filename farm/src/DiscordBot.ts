import Discord from 'discord.js';
import { MongoClient } from 'mongodb';

import _log from 'modules/log';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import { Browser } from 'modules/Browser';

import { DiscordState } from 'types/DiscordState';
import { GameState } from 'types/GameState';
import { MongoState } from 'types/MongoState';

import cmdGetPlayerInfo from 'discordCommands/getPlayerInfo';

const discordCommands: {[key: string]: Function} = {
    info: cmdGetPlayerInfo,
    find: cmdGetPlayerInfo,
};

export interface DiscordBotConfig {
    browser: {
        userAgent: string;
    };
    proxy?: {
        socks5: {
            host: string;
            port: number;
        }[];
    };
    mongo: {
        connectUrl: string;
        db: string;
    };
    discord: {
        app: {
            clientId: string;
            bot: {
                name: string;
                token: string;
            };
            allowedChannelsIds: {[key: string]: string};
            adminUsersIds: {[key: string]: string};
        };
        gameAccount: {
            id: string;
            authCode: string;
        };
    };
    game: {
        printWsPackets: boolean;
        checkProxy: {
            required: boolean;
            url: string;
            expectedAnswer: string;
        };
        urls: {[key: string]: string};
    }
}

export interface DiscordBotState {
    mongo: MongoState;
    browser: Browser;
    discord: DiscordState;
    game: GameState;
}

export class DiscordBot {
    protected log: Function;
    public config: DiscordBotConfig;
    public state?: DiscordBotState;

    constructor(config: DiscordBotConfig) {
        this.log = _log.setName('discord-bot');
        this.config = config;
    }

    public async start() {
        const { config, log } = this;

        log('connecting to storage:', config.mongo.db);

        const mongoClient = await MongoClient.connect(config.mongo.connectUrl);
        const mongoDb = mongoClient.db(config.mongo.db);
        const mongoCollections = {
            cookies: await mongoDb.collection('cookies'),
            players: await mongoDb.collection('players'),
            bots: await mongoDb.collection('bots'),
        };

        log('connecting to discord:', config.discord.app.bot.name);

        const discordClient = new Discord.Client;
        await discordClient.login(config.discord.app.bot.token);

        const cookieJar = new CookieJar({
            storageType: CookieJarStorageType.MONGO_DB,
            storageConfig: {
                collection: mongoCollections.cookies,
                docId: 'discord',
            },
        });

        const browser = new Browser({
            userAgent: config.browser.userAgent,
            cookieJar,
            socks5: config.proxy?.socks5[0],
        });

        this.state = {
            mongo: {
                client: mongoClient,
                db: mongoDb,
                collections: mongoCollections,
            },
            browser,
            discord: {
                client: discordClient,
            },
            game: {
                connected: false,
                connecting: false,
                reporter: () => {},
                accountAuthCode: config.discord.gameAccount.authCode,
                userAgent: config.browser.userAgent,
                gameWsNextPacketIndex: 0,
                gameWsPushCallback: () => {},
                gameWsSend: () => setTimeout(() => {}, 0),
            },
        };

        this.bindToDiscord();
    }

    protected bindToDiscord() {
        if (!this.state) throw Error('no state');

        const { config, log } = this;
        const { client } = this.state.discord;

        client.on('ready', () => {
            const tag = client?.user?.tag;

            if (!tag) {
                throw Error('failed to connect to discord');
            }

            log('connected to discord:', tag);
        });

        client.on('message', async msg => {
            if (!this.state) throw Error('no state');

            const channelId = msg.channel.id;
            const userId = msg.author.id;

            if (userId === config.discord.app.clientId) {
                // message from itself
                return;
            }

            const isChannelAllowed = Boolean(config.discord.app.allowedChannelsIds[channelId]);
            const isUserAdmin = Boolean(config.discord.app.adminUsersIds[userId]);

            if (!isChannelAllowed) {
                log('channel not allowed:', channelId, 'from:', msg.author.username + '#' + msg.author.discriminator, msg.author.id);
                return;
            }

            const [_, cmd] = msg.content.match(/^([^\s]+)/) || [];
            const cmdFu = discordCommands[cmd];

            const reporter = (text: string): void => {
                log(text);
                msg.channel.send(text);
            };

            this.state.game.reporter = reporter;

            if (cmdFu) {
                reporter(`starting command: ${cmd}`);

                try {
                    await cmdFu(this, msg);
                } catch (error) {
                    msg.reply(`Error: ${error.message || error}`);
                }
            } else {
                msg.reply(`unknown command: ${cmd}`);
            }
        });
    }
}
