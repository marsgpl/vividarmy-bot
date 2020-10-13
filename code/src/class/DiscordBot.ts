import Discord from 'discord.js';

import { GameBot } from 'class/GameBot';
import { BaseBot } from 'class/BaseBot';
import { Config } from 'class/Config';
import { DiscordState } from 'state/DiscordState';
import { MongoState } from 'state/MongoState';
import { Player } from 'localTypes/Player';

interface DiscordBotState {
    mongo: MongoState;
    discord: DiscordState;
    game: GameBot;
    gameSvS: GameBot;
}

type DiscordBotCommand = (
    this: DiscordBot,
    message: Discord.Message,
    isUserAdmin: boolean,
) => Promise<void>;

type DiscordBotCommandsCache = {
    [commandName: string]: DiscordBotCommand;
};

export class DiscordBot extends BaseBot {
    protected state?: DiscordBotState;
    protected commandsCache: DiscordBotCommandsCache = {};

    constructor(config: Config) {
        super('DiscordBot', config);
    }

    public async start(): Promise<void> {
        const mongoState = await this.connectToMongo();
        const discordState = await this.connectToDiscord();
        const gameBot = await this.createGameBot(mongoState);
        const gameBotSvS = await this.createGameBotSvS(mongoState);

        this.state = {
            mongo: mongoState,
            discord: discordState,
            game: gameBot,
            gameSvS: gameBotSvS || gameBot,
        };

        await this.bindToDiscord();
    }

    protected async connectToDiscord(): Promise<DiscordState> {
        const { log, config } = this;

        const client = new Discord.Client;

        await client.login(config.discord.app.bot.token);

        return {
            client,
        };
    }

    protected async createGameBotSvS(mongoState: MongoState): Promise<GameBot | null> {
        const { config, log } = this;

        if (!config.discord.gameAccountSvS) {
            return null;
        }

        const gameBot = new GameBot(config, {
            gpToken: config.discord.gameAccountSvS.gpToken,
            cookieDocId: config.discord.gameAccountSvS.cookieDocId,
            cookieCollection: mongoState.collections.cookies,
        });

        gameBot.reporter = (text: string): void => {
            log('GameBot SvS:', text);
        };

        await gameBot.init();

        log(`game bot SvS created: gp_token=${gameBot.getGpToken()}`);

        return gameBot;
    }

    protected async createGameBot(mongoState: MongoState): Promise<GameBot> {
        const { config, log } = this;

        const gameBot = new GameBot(config, {
            gpToken: config.discord.gameAccount.gpToken,
            cookieDocId: config.discord.gameAccount.cookieDocId,
            cookieCollection: mongoState.collections.cookies,
        });

        gameBot.reporter = (text: string): void => {
            log('GameBot:', text);
        };

        await gameBot.init();

        log(`game bot created: gp_token=${gameBot.getGpToken()}`);

        return gameBot;
    }

    protected async bindToDiscord(): Promise<void> {
        const { log, state } = this;
        const discordClient = state?.discord.client;

        if (!discordClient) throw Error('no discordClient');

        discordClient.on('ready', () => {
            const usertag = discordClient.user?.tag;

            if (!usertag) throw Error('no user.tag');

            log(`connected to discord: ${usertag}`);
        });

        discordClient.on('message', this.onDiscordMessage.bind(this));
    }

    protected async onDiscordMessage(message: Discord.Message): Promise<void> {
        const { config, log, state } = this;

        if (!state) throw Error('no state');

        const userId = message.author.id;
        const userName = message.author.username;
        const userTag = '#' + message.author.discriminator;
        const channelId = message.channel.id;
        const isFromItself = Boolean(userId === config.discord.app.clientId);
        const isChannelAllowed = Boolean(config.discord.app.allowedChannelsIds[channelId]);
        const isUserAdmin = Boolean(config.discord.app.adminUsersIds[userId]);

        if (isFromItself) {
            return;
        }

        log(`new message from discord: ${message.content} (channel id=${channelId}) (sender id=${userId} name=${userName}${userTag})`);

        if (!isChannelAllowed) {
            log(`channel id=${channelId} is not allowed`);
            return;
        }

        const commandName = this.getCommandNameFromMessageText(message.content);

        if (!commandName) {
            log(`only commands with text are allowed`);
            return;
        }

        const command = this.getCommandByName(commandName);

        if (!command) {
            const reply = `unknown command: \'${message.content}\'`;
            log(reply);
            message.reply(reply);
            return;
        }

        state.game.reporter = (text: string): void => {
            const msg = `GameBot: ${text}`;
            message.channel.send(msg);
            log(msg);
        };

        state.gameSvS.reporter = (text: string): void => {
            const msg = `GameBot SvS: ${text}`;
            message.channel.send(msg);
            log(msg);
        };

        try {
            await command.call(this, message, isUserAdmin);
            log(`command \`${message.content}\` succeed`);
        } catch (error) {
            const reply = `command \`${message.content}\` failed: ${error}`;
            log(reply);
            message.reply(reply);
        }
    }

    protected getCommandNameFromMessageText(text: string): string | undefined {
        const m = text.trim().match(/^([^\s]+)/);
        return m?.[1].toLowerCase() || '';
    }

    protected getCommandByName(commandName: string): DiscordBotCommand | undefined {
        if (commandName.length === 0) return;

        const commandFromCache = this.commandsCache[commandName];

        if (commandFromCache) {
            return commandFromCache;
        }

        try {
            commandName = commandName.replace(/[^a-z0-9_-]/ig, '');
            const command = require(`discordCommands/${commandName}`);
            this.commandsCache[commandName] = command.default;
        } catch (error) {
            this.log(`command ${commandName} not found: ${error}`);
        }

        return this.commandsCache[commandName];
    }

    protected findPlayerInMongo(name: string, serverId: number): Promise<Player | null> {
        if (!this.state) throw Error('no state');

        return this.state?.mongo.collections.players.findOne({
            nameLowercase: name.toLowerCase(),
            serverId,
        });
    }

    protected findPlayerInMongoById(playerId: string): Promise<Player | null> {
        if (!this.state) throw Error('no state');

        return this.state?.mongo.collections.players.findOne({
            playerId,
        });
    }

    protected async indexPlayer(player: Player): Promise<void> {
        if (!this.state) throw Error('no state');

        await this.state?.mongo.collections.players.updateOne({
            playerId: player.playerId,
        }, {
            $set: {
                ...player,
            },
        }, {
            upsert: true,
        });
    }
}
